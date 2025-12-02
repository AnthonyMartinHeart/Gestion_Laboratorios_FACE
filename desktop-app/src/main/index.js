const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const os = require('os');
const fs = require('fs');
const path = require('path');
const net = require('net');
const { URL } = require('url');
const { randomUUID } = require('crypto');
const axios = require('axios');
require('dotenv').config();


const API_BASE = process.env.ELECTRON_API_BASE_URL || 'http://localhost:3001/api';
const LAB_ID   = String(process.env.ELECTRON_LAB_ID || '1');
const DEVICES_PATH = process.env.ELECTRON_DEVICES_PATH || '/equipos/register-or-resolve';


let mainWindow = null;
let tray = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 740,
    show: true,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  
  mainWindow.on('close', (e) => {
    if (ACTIVE_SESSION) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
}

function createTray() {
  if (tray) return;

 
  const trayIconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'assets', 'UBB.png')     
    : path.join(process.cwd(), 'src', 'renderer', 'UBB.png');     

  
  if (!fs.existsSync(trayIconPath)) {
    console.warn('[tray] Icono no encontrado:', trayIconPath);
    console.warn('[tray] No se crea bandeja. Usaré minimizar como fallback al cerrar la ventana.');
    tray = null;
    return;
  }

  const icon = nativeImage.createFromPath(trayIconPath);
  if (icon.isEmpty()) {
    console.warn('[tray] Icono inválido (¿no es PNG/ICO?):', trayIconPath);
    tray = null;
    return;
  }

  tray = new Tray(icon);

  const menu = Menu.buildFromTemplate([
    { label: 'Mostrar', click: () => mainWindow?.show() },
    {
      label: 'Salir',
      click: () => {
        if (ACTIVE_SESSION) {
          mainWindow?.show();
          mainWindow?.webContents.send('app:cannot-quit-while-session');
        } else {
          app.quit();
        }
      },
    },
  ]);

  tray.setToolTip('Gestión Laboratorios FACE');
  tray.setContextMenu(menu);
  tray.on('click', () => mainWindow?.show());
}


app.whenReady().then(async () => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  
  const persisted = readSession();
  if (persisted) {
    const ok = await verifySessionOnBoot(persisted);
    if (ok) {
      ACTIVE_SESSION = persisted;
      setAuth({ token: persisted.token });
      mainWindow.webContents.once('did-finish-load', () => {
        mainWindow.webContents.send('sesion:rehydrate', persisted);
      });
    } else {
      clearSessionFile();
    }
  }
});

app.on('window-all-closed', () => {
  
  if (process.platform !== 'darwin') {
    if (!ACTIVE_SESSION) app.quit();
  }
});


let AUTH = { token: null, claims: null };
function setAuth(next) {
  AUTH = { ...AUTH, ...next };
  const token = AUTH.token || null;
  if (token) {
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common.Authorization;
  }
}
function clearAuth() {
  AUTH = { token: null, claims: null };
  delete axios.defaults.headers.common.Authorization;
}


const SESSION_FILE = path.join(app.getPath('userData'), 'session.json');

function readSession() {
  try {
    if (!fs.existsSync(SESSION_FILE)) return null;
    return JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
  } catch {
    return null;
  }
}
function writeSession(payload) {
  try {
    fs.mkdirSync(path.dirname(SESSION_FILE), { recursive: true });
    fs.writeFileSync(SESSION_FILE, JSON.stringify(payload, null, 2), 'utf8');
    return true;
  } catch {
    return false;
  }
}
function clearSessionFile() {
  try {
    if (fs.existsSync(SESSION_FILE)) fs.unlinkSync(SESSION_FILE);
    return true;
  } catch {
    return false;
  }
}

let ACTIVE_SESSION = null; 


const STORE_FILE = path.join(app.getPath('userData'), 'device.json');

function readDeviceData() {
  try { if (!fs.existsSync(STORE_FILE)) return {}; return JSON.parse(fs.readFileSync(STORE_FILE, 'utf8')); }
  catch { return {}; }
}
function persistDeviceData(patch) {
  const current = readDeviceData(); const next = { ...current, ...patch };
  fs.mkdirSync(path.dirname(STORE_FILE), { recursive: true });
  fs.writeFileSync(STORE_FILE, JSON.stringify(next, null, 2), 'utf8');
  return next;
}
function ensureDeviceId() {
  const d = readDeviceData(); if (d.deviceId) return d.deviceId;
  const deviceId = randomUUID(); persistDeviceData({ deviceId }); return deviceId;
}
async function getActiveIPv4(baseUrl) {
  const viaSocket = await getLocalAddressViaSocket(baseUrl).catch(() => null);
  if (viaSocket) return viaSocket;
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const addr of ifaces[name] || []) {
      if (addr.family === 'IPv4' && !addr.internal) return addr.address;
    }
  }
  return null;
}
function getLocalAddressViaSocket(baseUrl) {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(baseUrl);
      const port = url.port ? Number(url.port) : (url.protocol === 'https:' ? 443 : 80);
      const host = url.hostname;
      const socket = net.connect({ host, port, timeout: 2500 }, () => {
        const local = socket.localAddress; socket.end();
        if (local && local !== '::1') resolve(local); else reject(new Error('No localAddress'));
      });
      socket.on('error', reject);
      socket.on('timeout', () => { socket.destroy(); reject(new Error('Socket timeout')); });
    } catch (e) { reject(e); }
  });
}

async function ensureDeviceRegistered() {
  const deviceId = ensureDeviceId();
  const ip = process.env.TEST_IP || (await getActiveIPv4(API_BASE));
  const hostname = os.hostname();
  const suggestedNumber = ip?.split('.').map(Number).pop() || null;

  const { data } = await axios.post(`${API_BASE}${DEVICES_PATH}`, {
    labId: Number(LAB_ID),
    ip,
    hostname,
    deviceId,
    suggestedNumber,
  });

  
  const payload = data?.data || data || {};

  const fixed = Number(payload.deviceNumber);
  if (!fixed) throw new Error('No se recibió deviceNumber del backend');

  const freeMode = !!payload.freeMode;
  const labId = payload.labId ?? Number(LAB_ID);

  
  persistDeviceData({ deviceNumber: fixed, labId, freeMode });

  return {
    fixedNumber: fixed,
    deviceId,
    hostname,
    ip,
    labId,
    freeMode,
  };
}



async function verifySessionOnBoot(sess) {
  try {
    if (!sess || !sess.sessionId) return false;
    setAuth({ token: sess.token });
    
    const { data } = await axios.post(`${API_BASE}/sesiones/heartbeat`, { sessionId: sess.sessionId });
    return data?.status === 'active';
  } catch {
    
    return true;
    
  }
}


ipcMain.handle('system:state', async () => {
  return { authenticated: !!AUTH.token, user: AUTH.claims || null, token: AUTH.token || null };
});


ipcMain.handle('dispositivo:getInfo', async (_evt, { baseUrl, labId } = {}) => {
  const deviceId = ensureDeviceId();
  const ip = process.env.TEST_IP || (await getActiveIPv4(baseUrl || API_BASE));
  const hostname = os.hostname();
  const suggestedNumber = ip?.split('.').map(Number).pop() || null;
  const persisted = readDeviceData();
  return {
    deviceId, hostname, ip, labId: labId || LAB_ID || null,
    suggestedNumber, fixedNumber: persisted.deviceNumber ?? null,
  };
});
ipcMain.handle('dispositivo:setFixedNumber', async (_evt, { deviceNumber }) => {
  const saved = persistDeviceData({ deviceNumber }); return { ok: true, savedNumber: saved.deviceNumber };
});
ipcMain.handle('dispositivo:getPersisted', async () => readDeviceData());
ipcMain.handle('dispositivo:ensureRegistered', async () => {
  try { const info = await ensureDeviceRegistered(); return { ok: true, ...info }; }
  catch (e) { return { ok: false, message: e?.response?.data?.message || e?.message || 'Error registrando' }; }
});


ipcMain.handle('auth:login', async (_evt, { rut, password }) => {
  try {
    const { data } = await axios.post(`${API_BASE}/auth/login`, { rut, password });
   
    const token = typeof data === 'string' ? data : (data?.token || data?.data?.token);
    if (!token) throw new Error('Token no recibido');
    setAuth({ token, claims: { rut } }); 
    return { ok: true, token };
  } catch (e) {
    return { ok: false, message: e?.response?.data?.message || e?.message || 'No se pudo iniciar sesión' };
  }
});
ipcMain.handle('auth:logout', async () => { try { clearAuth(); return { ok: true }; } catch { return { ok: false }; } });

ipcMain.handle("app:allowOfflineUse", async () => {
  try {
    if (mainWindow) {
      
      try {
        mainWindow.setKiosk(false);
      } catch (e) {}
      try {
        mainWindow.setFullScreen(false);
      } catch (e) {}

      // Minimiza la ventana para dejar el PC libre
      mainWindow.minimize();
    }

    return { ok: true };
  } catch (e) {
    console.error("No se pudo liberar el equipo en modo offline:", e);
    return {
      ok: false,
      message: e?.message || "No se pudo liberar el equipo",
    };
  }
});

ipcMain.handle("app:restoreKiosk", async () => {
  try {
    if (mainWindow) {
      // Trae la ventana al frente
      mainWindow.show();
      mainWindow.focus();

      
      try {
        mainWindow.setFullScreen(true);
      } catch (e) {}
     
    }

    return { ok: true };
  } catch (e) {
    console.error("No se pudo restaurar el modo kiosko:", e);
    return {
      ok: false,
      message: e?.message || "No se pudo restaurar el modo kiosko",
    };
  }
});


ipcMain.handle('auth:register', async (_evt, payload) => {
  try {
    const { data } = await axios.post(`${API_BASE}/auth/register`, payload);
    
   
    const body = data?.data || data;

    return {
      ok: true,
      data: body,
    };
  } catch (e) {
    const res = e?.response?.data || {};
    return {
      ok: false,
      message: res.message || e?.message || 'No se pudo registrar al usuario',
      errors: res.errors || null,
    };
  }
});




ipcMain.handle('sesion:iniciar', async (_evt, { rut }) => {
  try {
    const reg = await ensureDeviceRegistered(); 
    const payload = {
      rut,
      labId: Number(reg.labId || LAB_ID),
      deviceNumber: Number(reg.fixedNumber),
      ip: reg.ip,
      hostname: os.hostname(),
      startedAt: new Date().toISOString(),
    };
    const { data } = await axios.post(`${API_BASE}/sesiones/start`, payload);
    const res = data?.data || data; 

    
    const toPersist = {
      sessionId: res?.sessionId || res?.id || null,
      rut,
      deviceNumber: payload.deviceNumber,
      labId: payload.labId,
      startedAt: res?.startedAt || payload.startedAt,
      token: AUTH.token,
    };
    ACTIVE_SESSION = toPersist;
    writeSession(toPersist);

    if (mainWindow) {
    try {
      mainWindow.setKiosk(false);
    } catch (e) {}
    try {
      mainWindow.setFullScreen(false);
    } catch (e) {}
    mainWindow.minimize();
    }

    return { ok: true, ...res };
  } catch (e) {
    return { 
      ok: false, 
      message: e?.response?.data?.message || e?.message || 'No se pudo iniciar la sesión' };
  }
});


ipcMain.handle('sesion:finalizar', async (_evt, { sessionId, reason }) => {
  try {
    await axios.post(`${API_BASE}/sesiones/end`, { sessionId, reason });
  } catch (e) {
    
    
  }

  ACTIVE_SESSION = null;
  clearAuth();
  clearSessionFile();

  mainWindow?.show();
  mainWindow?.webContents.send('sesion:ended', { reason: reason || 'logout' });

  return { ok: true };
});


ipcMain.handle('sesion:persist/read', async () => {
  const data = readSession();
  return { ok: !!data, data };
});
ipcMain.handle('sesion:persist/clear', async () => {
  ACTIVE_SESSION = null;
  clearAuth();
  return { ok: clearSessionFile() };
});
ipcMain.handle('system:config', () => {
  return { API_BASE, LAB_ID }; 
});

ipcMain.handle('network:health', async () => {
  try {
    await axios.get(`${API_BASE.replace(/\/+$/, '')}/health`, { timeout: 3000 });
    return { ok: true };
  } catch {
    return { ok: false };
  }
});

