import { io } from "socket.io-client";

let socket = null;
let currentLabId = null;
let handlers = {
  onFreeModeChange: null,
};

function getSocketUrl() {
  
  return "http://localhost:3001";
}


export function connectLabChannel(labId, { onFreeModeChange } = {}) {
  const id = Number(labId);
  if (!Number.isFinite(id)) {
    console.error("labId inválido en connectLabChannel:", labId);
    return () => {};
  }

  currentLabId = id;
  handlers.onFreeModeChange = onFreeModeChange || null;

  
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(getSocketUrl(), {
    withCredentials: true,
  });

  socket.on("connect", () => {
    console.log("🔌 Socket conectado en desktop-app:", socket.id);

    
    socket.emit("subscribe_lab", { labId: id });
  });

  socket.on("subscribed_lab", (data) => {
    console.log("✅ Suscrito a laboratorio:", data);
  });

  
  socket.on("lab_free_mode_changed", (msg) => {
    
    if (Number(msg.labId) !== currentLabId) return;

    console.log("📡 lab_free_mode_changed recibido en desktop-app:", msg);

    if (handlers.onFreeModeChange) {
      handlers.onFreeModeChange({
        labId: msg.labId,
        freeMode: !!msg.freeMode,
      });
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Socket desconectado en desktop-app:", reason);
  });

  socket.on("connect_error", (err) => {
    console.error(" Error de conexión Socket.IO en desktop-app:", err.message);
  });

  
  return () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    currentLabId = null;
    handlers.onFreeModeChange = null;
  };
}
