import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationsService } from '../services/notifications.service';
import '../styles/notificationBell.css';

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  // Mostrar para administradores, profesores y consultores
  if (!user || !['administrador', 'consultor', 'profesor'].includes(user.rol)) {
    return null;
  }

  // Cargar notificaciones al montar el componente
  useEffect(() => {
    if (user && ['administrador', 'consultor', 'profesor'].includes(user.rol)) {
      loadNotifications();
      
      // Actualizar cada 30 segundos
      const interval = setInterval(() => {
        loadNotifications();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      console.log('🔔 Cargando notificaciones para usuario:', user?.rut, 'rol:', user?.rol);
      const data = await notificationsService.getNotifications();
      console.log('📨 Notificaciones recibidas del backend:', data);
      setNotifications(data);
      setHasUnread(data.some(n => !n.leida));
      console.log('🔕 Notificaciones no leídas:', data.filter(n => !n.leida).length);
    } catch (error) {
      console.error('❌ Error al cargar notificaciones:', error);
      
      // Fallback a datos mock específicos por rol
      let mockNotifications = [];
      
      if (user.rol === 'administrador') {
        mockNotifications = [
          {
            id: 1,
            tipo: 'cancelacion',
            titulo: 'Reserva Cancelada',
            mensaje: 'Se ha cancelado una reserva para el Lab 1',
            fechaCreacion: new Date().toISOString(),
            leida: false
          },
          {
            id: 2,
            tipo: 'solicitud',
            titulo: 'Nueva Solicitud de Clase',
            mensaje: 'Hay una nueva solicitud de bloque de clases pendiente de revisión',
            fechaCreacion: new Date(Date.now() - 30 * 60000).toISOString(),
            leida: false
          }
        ];
      } else if (user.rol === 'profesor') {
        mockNotifications = [
          {
            id: 3,
            tipo: 'solicitud_aprobada',
            titulo: '✅ Solicitud Aprobada',
            mensaje: 'Tu solicitud de clase para el Lab 2 ha sido aprobada',
            fechaCreacion: new Date(Date.now() - 15 * 60000).toISOString(),
            leida: false
          },
          {
            id: 4,
            tipo: 'solicitud_rechazada',
            titulo: '❌ Solicitud Rechazada',
            mensaje: 'Tu solicitud de clase para el Lab 3 ha sido rechazada',
            fechaCreacion: new Date(Date.now() - 60 * 60000).toISOString(),
            leida: false
          }
        ];
      } else if (user.rol === 'consultor') {
        mockNotifications = [
          {
            id: 5,
            tipo: 'turno_asignado',
            titulo: '⏰ Turno Asignado (MOCK)',
            mensaje: 'Se te ha asignado un nuevo turno (datos de prueba)',
            fechaCreacion: new Date(Date.now() - 5 * 60000).toISOString(),
            leida: false
          },
          {
            id: 6,
            tipo: 'horario_actualizado',
            titulo: '📅 Horario Actualizado',
            mensaje: 'Los horarios de laboratorio han sido actualizados',
            fechaCreacion: new Date(Date.now() - 10 * 60000).toISOString(),
            leida: false
          },
          {
            id: 6,
            tipo: 'turno_asignado',
            titulo: '⏰ Turno Asignado',
            mensaje: 'Se te ha asignado un nuevo turno para mañana',
            fechaCreacion: new Date(Date.now() - 45 * 60000).toISOString(),
            leida: false
          }
        ];
      }
      
      setNotifications(mockNotifications);
      setHasUnread(mockNotifications.some(n => !n.leida));
    }
  };

  const toggleNotifications = () => {
    setIsOpen(!isOpen);
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationsService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, leida: true } : n
        )
      );
      
      // Verificar si quedan notificaciones sin leer
      const updatedNotifications = notifications.map(n => 
        n.id === notificationId ? { ...n, leida: true } : n
      );
      setHasUnread(updatedNotifications.some(n => !n.leida));
    } catch (error) {
      console.error('Error al marcar como leída:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, leida: true })));
      setHasUnread(false);
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    }
  };

  const formatFecha = (fechaStr) => {
    const fecha = new Date(fechaStr);
    const ahora = new Date();
    const diferencia = ahora - fecha;
    const minutos = Math.floor(diferencia / 60000);
    const horas = Math.floor(diferencia / 3600000);
    const dias = Math.floor(diferencia / 86400000);

    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `Hace ${minutos} min`;
    if (horas < 24) return `Hace ${horas} h`;
    return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
  };

  const getIconoTipo = (tipo) => {
    switch (tipo) {
      case 'cancelacion':
        return '❌';
      case 'mantenimiento':
        return '🔧';
      case 'solicitud':
        return '📋';
      case 'solicitud_aprobada':
        return '✅';
      case 'solicitud_rechazada':
        return '❌';
      case 'horario_actualizado':
        return '📅';
      case 'turno_asignado':
        return '⏰';
      case 'tarea_asignada':
        return '📋';
      case 'tarea_completada':
        return '✅';
      case 'tarea_no_completada':
        return '❌';
      default:
        return '📢';
    }
  };

  return (
    <div className="notification-bell-container">
      <button 
        className={`notification-bell ${hasUnread ? 'has-unread' : ''}`}
        onClick={toggleNotifications}
        title="Notificaciones"
      >
        🔔
        {hasUnread && <span className="notification-badge">{notifications.filter(n => !n.leida).length}</span>}
      </button>

      {isOpen && (
        <>
          <div className="notification-overlay" onClick={toggleNotifications}></div>
          <div className="notification-dropdown">
            <div className="notification-header">
              <h3>📢 Notificaciones</h3>
              {hasUnread && (
                <button 
                  className="mark-all-read"
                  onClick={markAllAsRead}
                >
                  ✅ Marcar todas como leídas
                </button>
              )}
            </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <span className="no-notif-icon">🔔</span>
                <p>No hay notificaciones</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`notification-item ${!notification.leida ? 'unread' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="notification-icon">
                    {getIconoTipo(notification.tipo)}
                  </div>
                  
                    <div className="notification-content">
                      <h4>{notification.titulo}</h4>
                      <p>{notification.mensaje}</p>
                      
                      {notification.detalles && (() => {
                        try {
                          const detalles = JSON.parse(notification.detalles);
                          return (
                            <div className="notification-details">
                              {detalles.usuario && (
                                <span className="usuario">👤 {detalles.usuario}</span>
                              )}
                              {detalles.laboratorio && (
                                <span className="laboratorio">🏢 {detalles.laboratorio}</span>
                              )}
                              {detalles.motivo && (
                                <span className="motivo">💭 {detalles.motivo}</span>
                              )}
                            </div>
                          );
                        } catch (e) {
                          return null;
                        }
                      })()}
                      
                      <span className="notification-time">{formatFecha(notification.fechaCreacion)}</span>
                    </div>

                  {!notification.leida && <div className="unread-dot"></div>}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-footer">
              <button className="view-all-notifications">
                📋 Ver todas las notificaciones
              </button>
            </div>
          )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
