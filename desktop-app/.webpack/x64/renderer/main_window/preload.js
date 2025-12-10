/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "electron":
/*!***************************!*\
  !*** external "electron" ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = require("electron");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/************************************************************************/
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!******************************!*\
  !*** ./src/preload/index.js ***!
  \******************************/
const {
  contextBridge,
  ipcRenderer
} = __webpack_require__(/*! electron */ "electron");
contextBridge.exposeInMainWorld('api', {
  system: {
    state: () => ipcRenderer.invoke('system:state'),
    getConfig: () => ipcRenderer.invoke('system:config')
  },
  auth: {
    login: ({
      rut,
      password
    }) => ipcRenderer.invoke('auth:login', {
      rut,
      password
    }),
    logout: () => ipcRenderer.invoke('auth:logout'),
    register: payload => ipcRenderer.invoke('auth:register', payload)
  },
  dispositivo: {
    getInfo: (baseUrl, labId) => ipcRenderer.invoke('dispositivo:getInfo', {
      baseUrl,
      labId
    }),
    setFixedNumber: deviceNumber => ipcRenderer.invoke('dispositivo:setFixedNumber', {
      deviceNumber
    }),
    getPersisted: () => ipcRenderer.invoke('dispositivo:getPersisted'),
    ensureRegistered: () => ipcRenderer.invoke('dispositivo:ensureRegistered')
  },
  sesion: {
    iniciar: rut => ipcRenderer.invoke('sesion:iniciar', {
      rut
    }),
    finalizar: (sessionId, reason) => ipcRenderer.invoke('sesion:finalizar', {
      sessionId,
      reason
    }),
    readPersisted: () => ipcRenderer.invoke('sesion:persist/read'),
    clearPersisted: () => ipcRenderer.invoke('sesion:persist/clear'),
    onRehydrate: cb => ipcRenderer.on('sesion:rehydrate', (_e, d) => cb(d)),
    onEnded: cb => ipcRenderer.on('sesion:ended', (_e, d) => cb(d))
  },
  app: {
    onCannotQuitWhileSession: cb => ipcRenderer.on('app:cannot-quit-while-session', cb),
    allowOfflineUse: () => ipcRenderer.invoke("app:allowOfflineUse"),
    restoreKiosk: () => ipcRenderer.invoke("app:restoreKiosk")
  },
  network: {
    health: () => ipcRenderer.invoke('network:health')
  }
});
})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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LFlBQVksRUFBRUEsQ0FBQSxLQUFNdEMsV0FBVyxDQUFDSyxNQUFNLENBQUMsa0JBQWtCO0VBQzNELENBQUM7RUFDRGtDLE9BQU8sRUFBRTtJQUNUQyxNQUFNLEVBQUVBLENBQUEsS0FBTXhDLFdBQVcsQ0FBQ0ssTUFBTSxDQUFDLGdCQUFnQjtFQUNqRDtBQUVGLENBQUMsQ0FBQyxDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZGVza3RvcC1hcHAvZXh0ZXJuYWwgY29tbW9uanMyIFwiZWxlY3Ryb25cIiIsIndlYnBhY2s6Ly9kZXNrdG9wLWFwcC93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9kZXNrdG9wLWFwcC8uL3NyYy9wcmVsb2FkL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcImVsZWN0cm9uXCIpOyIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCJjb25zdCB7IGNvbnRleHRCcmlkZ2UsIGlwY1JlbmRlcmVyIH0gPSByZXF1aXJlKCdlbGVjdHJvbicpO1xyXG5cclxuY29udGV4dEJyaWRnZS5leHBvc2VJbk1haW5Xb3JsZCgnYXBpJywge1xyXG4gIHN5c3RlbToge1xyXG4gICAgc3RhdGU6ICgpID0+IGlwY1JlbmRlcmVyLmludm9rZSgnc3lzdGVtOnN0YXRlJyksXHJcbiAgICBnZXRDb25maWc6ICgpID0+IGlwY1JlbmRlcmVyLmludm9rZSgnc3lzdGVtOmNvbmZpZycpLFxyXG4gIH0sXHJcbiAgICBhdXRoOiB7XHJcbiAgICBsb2dpbjogKHsgcnV0LCBwYXNzd29yZCB9KSA9PlxyXG4gICAgICBpcGNSZW5kZXJlci5pbnZva2UoJ2F1dGg6bG9naW4nLCB7IHJ1dCwgcGFzc3dvcmQgfSksXHJcblxyXG4gICAgbG9nb3V0OiAoKSA9PlxyXG4gICAgICBpcGNSZW5kZXJlci5pbnZva2UoJ2F1dGg6bG9nb3V0JyksXHJcblxyXG4gICAgcmVnaXN0ZXI6IChwYXlsb2FkKSA9PlxyXG4gICAgICBpcGNSZW5kZXJlci5pbnZva2UoJ2F1dGg6cmVnaXN0ZXInLCBwYXlsb2FkKSxcclxuICAgIH0sXHJcblxyXG5cclxuICBkaXNwb3NpdGl2bzoge1xyXG4gICAgZ2V0SW5mbzogKGJhc2VVcmwsIGxhYklkKSA9PiBpcGNSZW5kZXJlci5pbnZva2UoJ2Rpc3Bvc2l0aXZvOmdldEluZm8nLCB7IGJhc2VVcmwsIGxhYklkIH0pLFxyXG4gICAgc2V0Rml4ZWROdW1iZXI6IChkZXZpY2VOdW1iZXIpID0+IGlwY1JlbmRlcmVyLmludm9rZSgnZGlzcG9zaXRpdm86c2V0Rml4ZWROdW1iZXInLCB7IGRldmljZU51bWJlciB9KSxcclxuICAgIGdldFBlcnNpc3RlZDogKCkgPT4gaXBjUmVuZGVyZXIuaW52b2tlKCdkaXNwb3NpdGl2bzpnZXRQZXJzaXN0ZWQnKSxcclxuICAgIGVuc3VyZVJlZ2lzdGVyZWQ6ICgpID0+IGlwY1JlbmRlcmVyLmludm9rZSgnZGlzcG9zaXRpdm86ZW5zdXJlUmVnaXN0ZXJlZCcpLFxyXG4gIH0sXHJcbiAgIHNlc2lvbjoge1xyXG4gICAgaW5pY2lhcjogKHJ1dCkgPT4gaXBjUmVuZGVyZXIuaW52b2tlKCdzZXNpb246aW5pY2lhcicsIHsgcnV0IH0pLFxyXG4gICAgZmluYWxpemFyOiAoc2Vzc2lvbklkLCByZWFzb24pID0+IGlwY1JlbmRlcmVyLmludm9rZSgnc2VzaW9uOmZpbmFsaXphcicsIHsgc2Vzc2lvbklkLCByZWFzb24gfSksXHJcbiAgICByZWFkUGVyc2lzdGVkOiAoKSA9PiBpcGNSZW5kZXJlci5pbnZva2UoJ3Nlc2lvbjpwZXJzaXN0L3JlYWQnKSxcclxuICAgIGNsZWFyUGVyc2lzdGVkOiAoKSA9PiBpcGNSZW5kZXJlci5pbnZva2UoJ3Nlc2lvbjpwZXJzaXN0L2NsZWFyJyksXHJcbiAgICBvblJlaHlkcmF0ZTogKGNiKSA9PiBpcGNSZW5kZXJlci5vbignc2VzaW9uOnJlaHlkcmF0ZScsIChfZSwgZCkgPT4gY2IoZCkpLFxyXG4gICAgb25FbmRlZDogKGNiKSA9PiBpcGNSZW5kZXJlci5vbignc2VzaW9uOmVuZGVkJywgKF9lLCBkKSA9PiBjYihkKSksXHJcbiAgfSxcclxuICBhcHA6IHtcclxuICAgIG9uQ2Fubm90UXVpdFdoaWxlU2Vzc2lvbjogKGNiKSA9PiBpcGNSZW5kZXJlci5vbignYXBwOmNhbm5vdC1xdWl0LXdoaWxlLXNlc3Npb24nLCBjYiksXHJcbiAgICBhbGxvd09mZmxpbmVVc2U6ICgpID0+IGlwY1JlbmRlcmVyLmludm9rZShcImFwcDphbGxvd09mZmxpbmVVc2VcIiksXHJcbiAgICByZXN0b3JlS2lvc2s6ICgpID0+IGlwY1JlbmRlcmVyLmludm9rZShcImFwcDpyZXN0b3JlS2lvc2tcIiksXHJcbiAgfSxcclxuICBuZXR3b3JrOiB7XHJcbiAgaGVhbHRoOiAoKSA9PiBpcGNSZW5kZXJlci5pbnZva2UoJ25ldHdvcms6aGVhbHRoJyksXHJcbiAgfSxcclxuXHJcbn0pO1xyXG4iXSwibmFtZXMiOlsiY29udGV4dEJyaWRnZSIsImlwY1JlbmRlcmVyIiwicmVxdWlyZSIsImV4cG9zZUluTWFpbldvcmxkIiwic3lzdGVtIiwic3RhdGUiLCJpbnZva2UiLCJnZXRDb25maWciLCJhdXRoIiwibG9naW4iLCJydXQiLCJwYXNzd29yZCIsImxvZ291dCIsInJlZ2lzdGVyIiwicGF5bG9hZCIsImRpc3Bvc2l0aXZvIiwiZ2V0SW5mbyIsImJhc2VVcmwiLCJsYWJJZCIsInNldEZpeGVkTnVtYmVyIiwiZGV2aWNlTnVtYmVyIiwiZ2V0UGVyc2lzdGVkIiwiZW5zdXJlUmVnaXN0ZXJlZCIsInNlc2lvbiIsImluaWNpYXIiLCJmaW5hbGl6YXIiLCJzZXNzaW9uSWQiLCJyZWFzb24iLCJyZWFkUGVyc2lzdGVkIiwiY2xlYXJQZXJzaXN0ZWQiLCJvblJlaHlkcmF0ZSIsImNiIiwib24iLCJfZSIsImQiLCJvbkVuZGVkIiwiYXBwIiwib25DYW5ub3RRdWl0V2hpbGVTZXNzaW9uIiwiYWxsb3dPZmZsaW5lVXNlIiwicmVzdG9yZUtpb3NrIiwibmV0d29yayIsImhlYWx0aCJdLCJzb3VyY2VSb290IjoiIn0=