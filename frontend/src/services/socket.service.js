import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_BASE_URL?.replace('/api', '') || 'http://localhost:3009';

console.log('Socket URL:', SOCKET_URL);

let socket = null;

export const connectSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('✅ Socket conectado:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket desconectado');
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    console.log('Desconectando socket...', socket.id);
    socket.emit('user-logout'); // Emitir evento de logout antes de desconectar
    socket.removeAllListeners(); // Remover todos los listeners
    socket.disconnect();
    socket = null;
    console.log('Socket desconectado completamente');
  } else if (socket) {
    socket = null;
  }
};

export const getSocket = () => {
  return socket;
};

export const emitUserLogin = (userData) => {
  if (socket) {
    if (socket.connected) {
      console.log('🔵 Emitiendo user-login:', userData);
      socket.emit('user-login', userData);
    } else {
      console.log('⏳ Socket no conectado aún, esperando...');
      // Esperar a que el socket se conecte
      socket.once('connect', () => {
        console.log('🔵 Socket conectado, emitiendo user-login:', userData);
        socket.emit('user-login', userData);
      });
    }
  } else {
    console.error('❌ Socket no existe');
  }
};

export const onUsersCountUpdate = (callback) => {
  if (socket) {
    socket.on('users-count', (count) => {
      console.log('🔢 Actualizando contador en componente:', count);
      callback(count);
    });
  } else {
    console.warn('⚠️ Socket no disponible para onUsersCountUpdate');
  }
};

export const offUsersCountUpdate = () => {
  if (socket) {
    socket.off('users-count');
  }
};
