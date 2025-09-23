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
  const [notificationsCleared, setNotificationsCleared] = useState(false);

  // Mostrar para administradores, profesores, consultores y estudiantes
  if (!user || !['administrador', 'consultor', 'profesor', 'estudiante'].includes(user.rol)) {
    return null;
  }

  // Cargar notificaciones al montar el componente
  useEffect(() => {
    if (user && ['administrador', 'consultor', 'profesor'].includes(user.rol)) {
      setNotificationsCleared(false); // Reiniciar estado al cambiar usuario
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

    // Si las notificaciones fueron limpiadas manualmente, no cargar nada
    if (notificationsCleared) {
      loadNotifications.loading = false;
      return;
    }

    try {
      console.log('🔔 Cargando notificaciones para usuario:', user?.rut, 'rol:', user?.rol);
      let data = await notificationsService.getNotifications();
      console.log('📨 Notificaciones recibidas del backend:', data);
      // Filtrar notificaciones para estudiantes
      if (user.rol === 'estudiante') {
        data = data.filter(n => n.tipo === 'reserva_equipo');
      }
      setNotifications(data);
      setHasUnread(data.some(n => !n.leida));
      console.log('🔕 Notificaciones no leídas:', data.filter(n => !n.leida).length);
    } catch (error) {
      console.error('❌ Error al cargar notificaciones:', error);
      if (notifications.length === 0) {
        setNotifications([]);
        setHasUnread(false);
      }
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

  // Limpiar todas las notificaciones
  const clearAllNotifications = async () => {
    try {
      await notificationsService.clearAll();
      setNotifications([]);
      setHasUnread(false);
      setNotificationsCleared(true);
      console.log('🗑️ Notificaciones limpiadas exitosamente');
    } catch (error) {
      console.error('Error al limpiar notificaciones:', error);
      // En caso de error, limpiar localmente
      setNotifications([]);
      setHasUnread(false);
      setNotificationsCleared(true);
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
      case 'reserva_equipo':
        return '💻';
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
                {notificationsCleared && (
                  <button 
                    className="refresh-notifications"
                    onClick={() => {
                      setNotificationsCleared(false);
                      loadNotifications();
                    }}
                  >
                    🔄 Actualizar
                  </button>
                )}
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
                    {/* Personalizar mensaje para estudiantes y reserva_equipo */}
                    {user.rol === 'estudiante' && notification.tipo === 'reserva_equipo' ? (
                      <>
                        <h4>Reserva realizada</h4>
                        <p>
                          Has reservado el equipo #{(() => {
                            try {
                              const detalles = typeof notification.detalles === 'string' ? JSON.parse(notification.detalles) : notification.detalles;
                              return detalles && detalles.pcId ? detalles.pcId : 'N/A';
                            } catch {
                              return 'N/A';
                            }
                          })()} con fecha {(() => {
                            try {
                              const detalles = typeof notification.detalles === 'string' ? JSON.parse(notification.detalles) : notification.detalles;
                              if (detalles && detalles.fecha) return detalles.fecha;
                              if (detalles && detalles.fechaReserva) return detalles.fechaReserva;
                              if (notification.fechaCreacion) {
                                const fecha = new Date(notification.fechaCreacion);
                                return fecha.toLocaleDateString('es-CL');
                              }
                              return 'N/A';
                            } catch {
                              return 'N/A';
                            }
                          })()}
                        </p>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
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
                  {notificationsCleared && (
                    <button 
                      className="modal-refresh-notifications"
                      onClick={() => {
                        setNotificationsCleared(false);
                        loadNotifications();
                      }}
                    >
                      🔄 Actualizar
                    </button>
                  )}
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
