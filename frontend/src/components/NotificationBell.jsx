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

  // Función helper para formatear fechas correctamente sin problemas de zona horaria
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return 'N/A';
    
    // Si la fecha está en formato YYYY-MM-DD o similar, parsear como local
    if (typeof fechaStr === 'string') {
      // Formato YYYY-MM-DD (más común desde BD)
      if (/^\d{4}-\d{2}-\d{2}/.test(fechaStr)) {
        // Extraer componentes directamente sin conversión UTC
        const [year, month, day] = fechaStr.split('T')[0].split('-');
        return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
      }
      // Formato DD-MM-YYYY (ya está correcto)
      if (/^\d{2}-\d{2}-\d{4}$/.test(fechaStr)) {
        return fechaStr;
      }
    }
    
    // Fallback: crear fecha local sin problemas de zona horaria
    try {
      // Si es un string ISO, parsearlo como fecha local
      if (typeof fechaStr === 'string' && fechaStr.includes('-')) {
        const [datePart] = fechaStr.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        // Crear fecha local (mes es 0-indexed en JS)
        const fechaLocal = new Date(year, month - 1, day);
        
        const d = String(fechaLocal.getDate()).padStart(2, '0');
        const m = String(fechaLocal.getMonth() + 1).padStart(2, '0');
        const y = fechaLocal.getFullYear();
        
        return `${d}-${m}-${y}`;
      }
      
      // Para otros casos, intentar conversión estándar
      const fecha = new Date(fechaStr);
      if (!isNaN(fecha.getTime())) {
        const d = String(fecha.getDate()).padStart(2, '0');
        const m = String(fecha.getMonth() + 1).padStart(2, '0');
        const y = fecha.getFullYear();
        return `${d}-${m}-${y}`;
      }
    } catch (e) {
      console.error('Error al formatear fecha:', e);
    }
    
    return 'N/A';
  };

  // Mostrar para administradores, profesores, consultores, estudiantes y usuarios
  if (!user || !['administrador', 'consultor', 'profesor', 'estudiante', 'usuario'].includes(user.rol)) {
    return null;
  }

  // Cargar notificaciones al montar el componente
  useEffect(() => {
    if (user && ['administrador', 'consultor', 'profesor', 'estudiante', 'usuario'].includes(user.rol)) {
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
    if (user && ['administrador', 'consultor', 'profesor', 'estudiante', 'usuario'].includes(user.rol)) {
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
      // Filtrar notificaciones para estudiantes y usuarios (el backend ya debería filtrar correctamente)
      // Este filtro es redundante pero por seguridad lo dejamos
      if (user.rol === 'estudiante' || user.rol === 'usuario') {
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
    if (user && ['administrador', 'consultor', 'profesor', 'estudiante', 'usuario'].includes(user.rol)) {
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
      case 'cancelacion_clase_profesor':
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
      case 'observacion_actualizada':
        return '📝';
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
                    {/* Personalizar mensaje para reserva_equipo (estudiantes y consultores) */}
                    {['estudiante', 'consultor', 'usuario'].includes(user.rol) && notification.tipo === 'reserva_equipo' ? (
                      <>
                        <h4>💻 Reserva Confirmada</h4>
                        <p>
                          {notification.mensaje || `Has reservado el equipo PC-${(() => {
                            try {
                              const detalles = typeof notification.detalles === 'string' ? JSON.parse(notification.detalles) : notification.detalles;
                              return detalles && detalles.pcId ? detalles.pcId : 'N/A';
                            } catch {
                              return 'N/A';
                            }
                          })()} para el día ${(() => {
                            try {
                              const detalles = typeof notification.detalles === 'string' ? JSON.parse(notification.detalles) : notification.detalles;
                              // Prioridad: fecha > fechaReserva > fechaCreacion
                              if (detalles && detalles.fecha) return detalles.fecha;
                              if (detalles && detalles.fechaReserva) return detalles.fechaReserva;
                              // Solo si no hay otra opción, usar fechaCreacion
                              return formatearFecha(notification.fechaCreacion);
                            } catch {
                              return 'N/A';
                            }
                          })()}`}
                        </p>
                        {/* Mostrar detalles adicionales para reserva_equipo */}
                        {notification.detalles && (() => {
                          try {
                            const detalles = typeof notification.detalles === 'string' ? JSON.parse(notification.detalles) : notification.detalles;
                            return (
                              <div className="notification-details">
                                {detalles.laboratorio && (
                                  <span className="laboratorio">🏢 {detalles.laboratorio}</span>
                                )}
                                {detalles.pcId && (
                                  <span className="pcId">💻 PC-{detalles.pcId}</span>
                                )}
                                {detalles.fecha && (
                                  <span className="fecha">📅 {detalles.fecha}</span>
                                )}
                                {detalles.horaInicio && detalles.horaTermino && (
                                  <span className="hora">⏰ {detalles.horaInicio} - {detalles.horaTermino}</span>
                                )}
                              </div>
                            );
                          } catch (e) {
                            return null;
                          }
                        })()}
                      </>
                    ) : (
                      <>
                        <h4>{notification.titulo}</h4>
                        <p>{(() => {
                          // Para mensaje de cancelacion_clase_profesor, reescribir nombre y fecha con formato correcto
                          if (notification.tipo === 'cancelacion_clase_profesor' && notification.mensaje) {
                            let mensaje = notification.mensaje;
                            // Regex para encontrar el nombre después de 'la profesora' o 'el profesor'
                            const nombreMatch = mensaje.match(/(?:la profesora|el profesor) ([a-záéíóúñ ]+)/i);
                            if (nombreMatch && nombreMatch[1]) {
                              const nombreOriginal = nombreMatch[1].trim();
                              // Capitalizar solo la primera letra de cada palabra
                              const nombreFormateado = nombreOriginal.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                              mensaje = mensaje.replace(nombreOriginal, nombreFormateado);
                            }
                            // Reemplazar la fecha en el mensaje por la local correcta
                            try {
                              const detalles = typeof notification.detalles === 'string' ? JSON.parse(notification.detalles) : notification.detalles;
                              let fechaMostrar = detalles && detalles.fecha;
                              if (typeof fechaMostrar === 'string') {
                                if (/^\d{4}-\d{2}-\d{2}$/.test(fechaMostrar)) {
                                  const [y, m, d] = fechaMostrar.split('-');
                                  const fechaLocal = new Date(Number(y), Number(m) - 1, Number(d));
                                  const day = String(fechaLocal.getDate()).padStart(2, '0');
                                  const month = String(fechaLocal.getMonth() + 1).padStart(2, '0');
                                  const year = fechaLocal.getFullYear();
                                  fechaMostrar = `${day}-${month}-${year}`;
                                } else if (/^\d{2}-\d{2}-\d{4}$/.test(fechaMostrar)) {
                                  // ya está bien
                                } else {
                                  const d = new Date(fechaMostrar);
                                  if (!isNaN(d)) {
                                    const day = String(d.getDate()).padStart(2, '0');
                                    const month = String(d.getMonth() + 1).padStart(2, '0');
                                    const year = d.getFullYear();
                                    fechaMostrar = `${day}-${month}-${year}`;
                                  }
                                }
                                // Reemplazar cualquier fecha en el mensaje por la correcta
                                mensaje = mensaje.replace(/\d{2,4}-\d{2}-\d{2,4}/, fechaMostrar);
                              }
                            } catch {}
                            return mensaje;
                          }
                          return notification.mensaje;
                        })()}</p>
                        {notification.detalles && (() => {
                          try {
                            const detalles = typeof notification.detalles === 'string' ? JSON.parse(notification.detalles) : notification.detalles;
                            if (notification.tipo === 'cancelacion_clase_profesor') {
                              // Siempre parsear la fecha como local y mostrar dd-mm-yyyy
                              let fechaMostrar = detalles.fecha;
                              if (typeof fechaMostrar === 'string') {
                                // Si viene yyyy-mm-dd, parsear como local
                                if (/^\d{4}-\d{2}-\d{2}$/.test(fechaMostrar)) {
                                  const [y, m, d] = fechaMostrar.split('-');
                                  // Crear fecha local
                                  const fechaLocal = new Date(Number(y), Number(m) - 1, Number(d));
                                  const day = String(fechaLocal.getDate()).padStart(2, '0');
                                  const month = String(fechaLocal.getMonth() + 1).padStart(2, '0');
                                  const year = fechaLocal.getFullYear();
                                  fechaMostrar = `${day}-${month}-${year}`;
                                } else if (/^\d{2}-\d{2}-\d{4}$/.test(fechaMostrar)) {
                                  // ya está bien
                                } else {
                                  // fallback: intentar formatear como fecha local
                                  const d = new Date(fechaMostrar);
                                  if (!isNaN(d)) {
                                    const day = String(d.getDate()).padStart(2, '0');
                                    const month = String(d.getMonth() + 1).padStart(2, '0');
                                    const year = d.getFullYear();
                                    fechaMostrar = `${day}-${month}-${year}`;
                                  }
                                }
                              }
                              // Capitalizar nombre completo (solo primera letra de cada palabra)
                              const capitalizarNombre = (nombre) => {
                                if (!nombre) return '';
                                return nombre.split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
                              };
                              return (
                                <div className="notification-details">
                                  <span className="usuario">👤 {capitalizarNombre(detalles.profesorNombre || detalles.usuario)}</span>
                                  <span className="laboratorio">🏢 {detalles.laboratorio}</span>
                                  <span className="fecha">📅 {fechaMostrar}</span>
                                  <span className="hora">⏰ {detalles.horaInicio} - {detalles.horaTermino}</span>
                                  <span className="motivo">💭 {detalles.motivo}</span>
                                </div>
                              );
                            }
                            // Otros tipos
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
                        {/* Personalizar mensaje para reserva_equipo (estudiantes y consultores) */}
                        {['estudiante', 'consultor', 'usuario'].includes(user.rol) && notification.tipo === 'reserva_equipo' ? (
                          <>
                            <h4>💻 Reserva Confirmada</h4>
                            <p>
                              {notification.mensaje || `Has reservado el equipo PC-${(() => {
                                try {
                                  const detalles = typeof notification.detalles === 'string' ? JSON.parse(notification.detalles) : notification.detalles;
                                  return detalles && detalles.pcId ? detalles.pcId : 'N/A';
                                } catch {
                                  return 'N/A';
                                }
                              })()} para el día ${(() => {
                                try {
                                  const detalles = typeof notification.detalles === 'string' ? JSON.parse(notification.detalles) : notification.detalles;
                                  // Prioridad: fecha > fechaReserva > fechaCreacion
                                  if (detalles && detalles.fecha) return detalles.fecha;
                                  if (detalles && detalles.fechaReserva) return detalles.fechaReserva;
                                  // Solo si no hay otra opción, usar fechaCreacion
                                  return formatearFecha(notification.fechaCreacion);
                                } catch {
                                  return 'N/A';
                                }
                              })()}`}
                            </p>
                            
                            {/* Mostrar detalles adicionales */}
                            {notification.detalles && (() => {
                              try {
                                const detalles = typeof notification.detalles === 'string' ? JSON.parse(notification.detalles) : notification.detalles;
                                return (
                                  <div className="notification-modal-details">
                                    {detalles.laboratorio && (
                                      <span className="laboratorio">🏢 {detalles.laboratorio}</span>
                                    )}
                                    {detalles.pcId && (
                                      <span className="pcId">💻 PC-{detalles.pcId}</span>
                                    )}
                                    {detalles.fecha && (
                                      <span className="fecha">📅 {detalles.fecha}</span>
                                    )}
                                    {detalles.horaInicio && detalles.horaTermino && (
                                      <span className="hora">⏰ {detalles.horaInicio} - {detalles.horaTermino}</span>
                                    )}
                                  </div>
                                );
                              } catch (e) {
                                return null;
                              }
                            })()}
                          </>
                        ) : (
                          <>
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
                          </>
                        )}
                        
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
