const { app, BrowserWindow, ipcMain } = require('electron');
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

// ---------- Ventana ----------
function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 740,
    show: true,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// ---------- Auth (en memoria) ----------
let AUTH = { token: null, claims: null };
function setAuth(next) { AUTH = { ...AUTH, ...next }; }
function clearAuth() { AUTH = { token: null, claims: null }; }

// ---------- Utils dispositivo ----------
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

  const fixed = Number(data?.data?.deviceNumber ?? data?.deviceNumber);
  if (!fixed) throw new Error('No se recibió deviceNumber del backend');
  persistDeviceData({ deviceNumber: fixed });

  return { fixedNumber: fixed, deviceId, hostname, ip, labId: LAB_ID };
}

// ---------- IPC: sistema ----------
ipcMain.handle('system:state', async () => {
  return { authenticated: !!AUTH.token, user: AUTH.claims || null, token: AUTH.token || null };
});

// ---------- IPC: dispositivo ----------
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

// ---------- IPC: auth ----------
ipcMain.handle('auth:login', async (_evt, { rut, password }) => {
  try {
    const { data } = await axios.post(`${API_BASE}/auth/login`, { rut, password });
    // asumo que el backend retorna token (string) o { token }
    const token = typeof data === 'string' ? data : (data?.token || data?.data?.token);
    if (!token) throw new Error('Token no recibido');
    setAuth({ token, claims: { rut } }); // opcional: puedes decodificar JWT si quieres
    return { ok: true, token };
  } catch (e) {
    return { ok: false, message: e?.response?.data?.message || e?.message || 'No se pudo iniciar sesión' };
  }
});
ipcMain.handle('auth:logout', async () => { try { clearAuth(); return { ok: true }; } catch { return { ok: false }; } });

// ---------- IPC: sesiones ----------
ipcMain.handle('sesion:iniciar', async (_evt, { rut }) => {
  try {
    const reg = await ensureDeviceRegistered(); // garantiza número fijo e IP
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
    return { ok: true, ...res }; // idealmente { sessionId, ... }
  } catch (e) {
    return { ok: false, message: e?.response?.data?.message || e?.message || 'No se pudo iniciar la sesión' };
  }
});
ipcMain.handle('sesion:finalizar', async (_evt, { sessionId }) => {
  try {
    const { data } = await axios.post(`${API_BASE}/sesiones/end`, { sessionId });
    const res = data?.data || data;
    return { ok: true, ...res };
  } catch (e) {
    return { ok: false, message: e?.response?.data?.message || e?.message || 'No se pudo finalizar la sesión' };
  }
});
