const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  system: {
    state: () => ipcRenderer.invoke('system:state'),
  },
  auth: {
    login: (rut, password) => ipcRenderer.invoke('auth:login', { rut, password }),
    logout: () => ipcRenderer.invoke('auth:logout'),
  },
  dispositivo: {
    getInfo: (baseUrl, labId) => ipcRenderer.invoke('dispositivo:getInfo', { baseUrl, labId }),
    setFixedNumber: (deviceNumber) => ipcRenderer.invoke('dispositivo:setFixedNumber', { deviceNumber }),
    getPersisted: () => ipcRenderer.invoke('dispositivo:getPersisted'),
    ensureRegistered: () => ipcRenderer.invoke('dispositivo:ensureRegistered'),
  },
  sesion: {
    iniciar: (rut) => ipcRenderer.invoke('sesion:iniciar', { rut }),
    finalizar: (sessionId) => ipcRenderer.invoke('sesion:finalizar', { sessionId }),
  },
});
