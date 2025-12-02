const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  system: {
    state: () => ipcRenderer.invoke('system:state'),
    getConfig: () => ipcRenderer.invoke('system:config'),
  },
    auth: {
    login: ({ rut, password }) =>
      ipcRenderer.invoke('auth:login', { rut, password }),

    logout: () =>
      ipcRenderer.invoke('auth:logout'),

    register: (payload) =>
      ipcRenderer.invoke('auth:register', payload),
    },


  dispositivo: {
    getInfo: (baseUrl, labId) => ipcRenderer.invoke('dispositivo:getInfo', { baseUrl, labId }),
    setFixedNumber: (deviceNumber) => ipcRenderer.invoke('dispositivo:setFixedNumber', { deviceNumber }),
    getPersisted: () => ipcRenderer.invoke('dispositivo:getPersisted'),
    ensureRegistered: () => ipcRenderer.invoke('dispositivo:ensureRegistered'),
  },
   sesion: {
    iniciar: (rut) => ipcRenderer.invoke('sesion:iniciar', { rut }),
    finalizar: (sessionId, reason) => ipcRenderer.invoke('sesion:finalizar', { sessionId, reason }),
    readPersisted: () => ipcRenderer.invoke('sesion:persist/read'),
    clearPersisted: () => ipcRenderer.invoke('sesion:persist/clear'),
    onRehydrate: (cb) => ipcRenderer.on('sesion:rehydrate', (_e, d) => cb(d)),
    onEnded: (cb) => ipcRenderer.on('sesion:ended', (_e, d) => cb(d)),
  },
  app: {
    onCannotQuitWhileSession: (cb) => ipcRenderer.on('app:cannot-quit-while-session', cb),
    allowOfflineUse: () => ipcRenderer.invoke("app:allowOfflineUse"),
    restoreKiosk: () => ipcRenderer.invoke("app:restoreKiosk"),
  },
  network: {
  health: () => ipcRenderer.invoke('network:health'),
  },

});
