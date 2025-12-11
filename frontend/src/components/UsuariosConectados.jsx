import { useState, useEffect } from 'react';
import { getSocket } from '@services/socket.service';
import '@styles/UsuariosConectados.css';

const UsuariosConectados = () => {
  const [usuariosConectados, setUsuariosConectados] = useState(0);

  useEffect(() => {
    // Intentar obtener el socket con un pequeño delay
    const checkSocket = () => {
      const socket = getSocket();
      
      if (socket) {
        console.log('👥 Socket disponible en UsuariosConectados');
        
        // Escuchar actualizaciones del contador
        const handleUsersCount = (count) => {
          console.log('🔢 Actualizando contador UI:', count);
          setUsuariosConectados(count);
        };

        // Suscribirse al evento
        socket.on('users-count', handleUsersCount);
        
        // Escuchar actualizaciones cuando cambian sesiones de la app
        socket.on('session-count-update', () => {
          console.log('🔄 Sesión de app cambió, solicitando nuevo conteo');
          socket.emit('get-users-count');
        });

        // Si el socket ya está conectado, solicitar el conteo actual
        if (socket.connected) {
          console.log('🔄 Solicitando conteo actual de usuarios...');
          socket.emit('get-users-count');
        } else {
          // Si no está conectado, esperar a que se conecte
          socket.once('connect', () => {
            console.log('🔄 Socket conectado, solicitando conteo...');
            socket.emit('get-users-count');
          });
        }

        // Limpiar el listener cuando el componente se desmonte
        return () => {
          console.log('🧹 Limpiando listener de usuarios conectados');
          socket.off('users-count', handleUsersCount);
          socket.off('session-count-update');
        };
      } else {
        console.warn('⚠️ Socket no disponible aún, reintentando...');
        // Reintentar después de 500ms
        const timeout = setTimeout(checkSocket, 500);
        return () => clearTimeout(timeout);
      }
    };

    checkSocket();
  }, []);

  return (
    <div className="usuarios-conectados-container">
      <div className="usuarios-conectados-icono">
        <svg 
          width="50" 
          height="50" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="8" r="4" fill="#4a90e2" />
          <path 
            d="M4 20C4 16.6863 6.68629 14 10 14H14C17.3137 14 20 16.6863 20 20V21H4V20Z" 
            fill="#4a90e2" 
          />
        </svg>
      </div>
      <div className="usuarios-conectados-info">
        <div className="usuarios-conectados-numero">{usuariosConectados}</div>
        <div className="usuarios-conectados-texto">Usuarios Conectados</div>
      </div>
    </div>
  );
};

export default UsuariosConectados;
