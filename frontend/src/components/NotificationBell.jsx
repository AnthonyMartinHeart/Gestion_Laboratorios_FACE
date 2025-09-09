import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationsService } from '../services/notifications.service';
import '../styles/notificationBell.css';

// Variable global para la función de recarga de notificaciones
window.refreshNotifications = null;

const NotificationBell = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);

  // Mostrar para administradores, profesores y consultores
  if (!user || !['administrador', 'consultor', 'profesor'].includes(user.rol)) {
    return null;
  }

  // Cargar notificaciones al montar el componente
  useEffect(() => {
    if (user && ['administrador', 'consultor', 'profesor'].includes(user.rol)) {
      loadNotifications();
      
      // Actualizar cada 15 segundos (más frecuente)
      const interval = setInterval(() => {
        loadNotifications();
      }, 15000);

      // Listener para cuando la ventana vuelve a estar en foco
      const handleFocus = () => {
        console.log('🔄 Ventana en foco - actualizando notificaciones');
        loadNotifications();
      };

      // Listener para cambios de visibilidad de la página
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          console.log('🔄 Página visible - actualizando notificaciones');
          loadNotifications();
        }
      };

      // Agregar event listeners
      window.addEventListener('focus', handleFocus);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', handleFocus);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [user]);

  // Actualizar notificaciones cuando cambie de página/ruta
  useEffect(() => {
    if (user && ['administrador', 'consultor', 'profesor'].includes(user.rol)) {
      console.log('🔄 Cambio de ruta detectado - actualizando notificaciones');
      loadNotifications();
    }
  }, [location.pathname, user]);

  const loadNotifications = async () => {
    // Evitar múltiples llamadas simultáneas
    if (loadNotifications.loading) return;
    loadNotifications.loading = true;

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
            tipo: 'tarea_asignada_admin',
            titulo: 'Tarea asignada exitosamente',
            mensaje: 'Se ha asignado una nueva tarea: Actualizar Winrar a Luis Alfredo Fernandez Canullan',
            fechaCreacion: new Date().toISOString(),
            leida: false,
            detalles: JSON.stringify({
              tareaId: 1,
              titulo: "Actualizar Winrar",
              prioridad: "alta",
              asignadoA: "Luis Alfredo Fernandez Canullan"
            })
          },
          {
            id: 2,
            tipo: 'cancelacion',
            titulo: 'Reserva Cancelada',
            mensaje: 'Se ha cancelado una reserva para el Lab 1',
            fechaCreacion: new Date(Date.now() - 15 * 60000).toISOString(),
            leida: false,
            detalles: JSON.stringify({
              usuario: "María González",
              laboratorio: "Laboratorio 1",
              motivo: "Cancelación manual"
            })
          },
          {
            id: 3,
            tipo: 'solicitud',
            titulo: 'Nueva Solicitud de Clase',
            mensaje: 'Hay una nueva solicitud de bloque de clases pendiente de revisión',
            fechaCreacion: new Date(Date.now() - 30 * 60000).toISOString(),
            leida: false
          },
          {
            id: 4,
            tipo: 'mantenimiento',
            titulo: '🔧 Mantenimiento Finalizado',
            mensaje: 'Se ha finalizado el mantenimiento del equipo PC-8',
            fechaCreacion: new Date(Date.now() - 45 * 60000).toISOString(),
            leida: true,
            detalles: JSON.stringify({
              pcId: 8,
              usuario: "Técnico López",
              laboratorio: "Laboratorio 1"
            })
          }
        ];
      } else if (user.rol === 'profesor') {
        mockNotifications = [
          {
            id: 5,
            tipo: 'solicitud_aprobada',
            titulo: '✅ Solicitud Aprobada',
            mensaje: 'Tu solicitud de clase para el Lab 2 ha sido aprobada',
            fechaCreacion: new Date(Date.now() - 15 * 60000).toISOString(),
            leida: false
          },
          {
            id: 6,
            tipo: 'mantenimiento',
            titulo: '🔧 Equipo en Mantenimiento',
            mensaje: 'El equipo PC-12 que tenías reservado está en mantenimiento',
            fechaCreacion: new Date(Date.now() - 30 * 60000).toISOString(),
            leida: false,
            detalles: JSON.stringify({
              pcId: 12,
              laboratorio: "Laboratorio 3"
            })
          },
          {
            id: 7,
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
            id: 8,
            tipo: 'turno_asignado',
            titulo: '⏰ Turno Asignado',
            mensaje: 'Se te ha asignado un nuevo turno para mañana',
            fechaCreacion: new Date(Date.now() - 5 * 60000).toISOString(),
            leida: false
          },
          {
            id: 9,
            tipo: 'mantenimiento',
            titulo: '� Equipo Reportado en Mantenimiento',
            mensaje: 'El equipo PC-7 ha sido reportado para mantenimiento',
            fechaCreacion: new Date(Date.now() - 10 * 60000).toISOString(),
            leida: false,
            detalles: JSON.stringify({
              pcId: 7,
              laboratorio: "Laboratorio 1",
              motivo: "Problema de hardware reportado"
            })
          },
          {
            id: 10,
            tipo: 'horario_actualizado',
            titulo: '📅 Horario Actualizado',
            mensaje: 'Los horarios de laboratorio han sido actualizados',
            fechaCreacion: new Date(Date.now() - 45 * 60000).toISOString(),
            leida: false
          }
        ];
      }
      
      setNotifications(mockNotifications);
      setHasUnread(mockNotifications.some(n => !n.leida));
    } finally {
      loadNotifications.loading = false;
    }
  };

  // Hacer la función disponible globalmente
  useEffect(() => {
    if (user && ['administrador', 'consultor', 'profesor'].includes(user.rol)) {
      window.refreshNotifications = loadNotifications;
    }
    
    return () => {
      window.refreshNotifications = null;
    };
  }, [user]);

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
      
      // Recargar notificaciones para asegurar sincronización
      setTimeout(() => loadNotifications(), 1000);
    } catch (error) {
      console.error('Error al marcar como leída:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, leida: true })));
      setHasUnread(false);
      
      // Recargar notificaciones para asegurar sincronización
      setTimeout(() => loadNotifications(), 1000);
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    }
  };

  // Limpiar todas las notificaciones
  const clearAllNotifications = async () => {
    try {
      // await notificationsService.clearAll(); // TODO: Implementar en el backend
      setNotifications([]);
      setHasUnread(false);
      
      // Recargar notificaciones para asegurar sincronización
      setTimeout(() => loadNotifications(), 1000);
    } catch (error) {
      console.error('Error al limpiar notificaciones:', error);
    }
  };

  // Abrir modal de todas las notificaciones
  const openAllNotificationsModal = () => {
    setIsOpen(false); // Cerrar el dropdown
    setShowAllModal(true); // Abrir la modal
  };

  // Cerrar modal de todas las notificaciones
  const closeAllNotificationsModal = () => {
    setShowAllModal(false);
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
              <div className="notification-header-buttons">
                {notifications.length > 0 && (
                  <button 
                    className="mark-all-read"
                    onClick={markAllAsRead}
                    disabled={!hasUnread}
                    style={{ opacity: hasUnread ? 1 : 0.5 }}
                  >
                    ✅ Marcar todas como leídas
                  </button>
                )}
                {notifications.length > 0 && (
                  <button 
                    className="clear-all-notifications"
                    onClick={clearAllNotifications}
                  >
                    🗑️ Limpiar todo
                  </button>
                )}
              </div>
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
                >
                  <div className="notification-icon">
                    {getIconoTipo(notification.tipo)}
                  </div>
                  
                  <div className="notification-content" onClick={() => markAsRead(notification.id)}>
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
                            {detalles.pcId && (
                              <span className="pcId">💻 PC-{detalles.pcId}</span>
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

                  <div className="notification-actions">
                    {!notification.leida && (
                      <button 
                        className="mark-as-read-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                      >
                        ✓
                      </button>
                    )}
                  </div>

                  {!notification.leida && <div className="unread-dot"></div>}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-footer">
              <button 
                className="view-all-notifications"
                onClick={openAllNotificationsModal}
              >
                📋 Ver todas las notificaciones
              </button>
            </div>
          )}
          </div>
        </>
      )}

      {/* Modal de todas las notificaciones */}
      {showAllModal && (
        <div className="notification-modal-overlay" onClick={closeAllNotificationsModal}>
          <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notification-modal-header">
              <div className="modal-header-content">
                <h2>📋 Todas las Notificaciones</h2>
                <div className="modal-header-buttons">
                  {notifications.length > 0 && (
                    <button 
                      className="modal-mark-all-read"
                      onClick={markAllAsRead}
                      disabled={!hasUnread}
                      style={{ opacity: hasUnread ? 1 : 0.5 }}
                    >
                      ✅ Marcar todas como leídas
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button 
                      className="modal-clear-all"
                      onClick={clearAllNotifications}
                    >
                      🗑️ Limpiar historial
                    </button>
                  )}
                </div>
              </div>
              <button 
                className="modal-close-btn"
                onClick={closeAllNotificationsModal}
              >
                ✕
              </button>
            </div>

            <div className="notification-modal-content">
              {notifications.length === 0 ? (
                <div className="no-notifications-modal">
                  <span className="no-notif-icon">🔔</span>
                  <h3>No hay notificaciones</h3>
                  <p>Cuando recibas notificaciones, aparecerán aquí.</p>
                </div>
              ) : (
                <div className="notification-modal-list">
                  {notifications.map(notification => (
                    <div 
                      key={notification.id}
                      className={`notification-modal-item ${!notification.leida ? 'unread' : ''}`}
                    >
                      <div className="notification-modal-icon">
                        {getIconoTipo(notification.tipo)}
                      </div>
                      
                      <div className="notification-modal-content-item" onClick={() => markAsRead(notification.id)}>
                        <h4>{notification.titulo}</h4>
                        <p>{notification.mensaje}</p>
                        
                        {notification.detalles && (() => {
                          try {
                            const detalles = JSON.parse(notification.detalles);
                            return (
                              <div className="notification-modal-details">
                                {detalles.usuario && (
                                  <span className="usuario">👤 {detalles.usuario}</span>
                                )}
                                {detalles.laboratorio && (
                                  <span className="laboratorio">🏢 {detalles.laboratorio}</span>
                                )}
                                {detalles.pcId && (
                                  <span className="pcId">💻 PC-{detalles.pcId}</span>
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
                        
                        <span className="notification-modal-time">{formatFecha(notification.fechaCreacion)}</span>
                      </div>

                      <div className="notification-modal-actions">
                        {!notification.leida && (
                          <button 
                            className="modal-mark-as-read-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                          >
                            ✓
                          </button>
                        )}
                      </div>

                      {!notification.leida && <div className="unread-dot-modal"></div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
