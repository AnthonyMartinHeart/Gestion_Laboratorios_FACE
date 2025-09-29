import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '@context/AuthContext';
import { showSuccessAlert, showErrorAlert } from '@helpers/sweetAlert.js';
import clasesService from '@services/clases.service';
import Swal from 'sweetalert2';
import '@styles/misClases.css';
import '@styles/solicitudes.css';

const MisClases = () => {
  const { user } = useAuth();
  const [clasesAprobadas, setClasesAprobadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroSemana, setFiltroSemana] = useState('actual'); // 'actual', 'siguiente', 'todas'
  const [vistaCalendario, setVistaCalendario] = useState(false);

  // Obtener clases aprobadas del profesor
  const fetchClasesAprobadas = useCallback(async () => {
    try {
      setLoading(true);
      const response = await clasesService.obtenerMisClases();
      console.log('Response from API:', response); // Debug log
      console.log('📝 Clases recibidas:', response.data?.length || 0);
      response.data?.forEach((clase, index) => {
        console.log(`Clase ${index + 1}:`, {
          id: clase.id,
          titulo: clase.titulo,
          fecha: clase.fechaEspecifica,
          cancelada: clase.cancelada,
          motivoCancelacion: clase.motivoCancelacion
        });
      });
      setClasesAprobadas(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Error al obtener las clases');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.rol === 'profesor') {
      fetchClasesAprobadas();
    }
  }, [user, fetchClasesAprobadas]);

  // Procesar clases para agregar fecha específica y verificar si es cancelable
  const clasesConDatos = useMemo(() => {
    if (!clasesAprobadas || clasesAprobadas.length === 0) return [];

    return clasesAprobadas.map(solicitud => {
      // Si es recurrente, crear una clase por cada fecha específica (YYYY-MM-DD)
      if (solicitud.tipoSolicitud === 'recurrente') {
        const fechasEspecificas = solicitud.fechasEspecificas || [];
        return fechasEspecificas.map(fechaStr => {
          let fechaLocal;
          if (/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
            const [y, m, d] = fechaStr.split('-');
            fechaLocal = new Date(Number(y), Number(m) - 1, Number(d));
          } else {
            fechaLocal = new Date(fechaStr);
          }
          // Verificar si está cancelada
          const clasesCanceladas = solicitud.clasesCanceladas || [];
          const claseCancelada = clasesCanceladas.find(cc => 
            cc.fecha && new Date(cc.fecha).toDateString() === fechaActual.toDateString()
          );
          
          return {
            ...solicitud,
            id: `${solicitud.id}-${fechaStr}`,
            fechaEspecifica: fechaLocal,
            tipoClase: 'recurrente',
            fechaOriginal: fechaStr,
            esCancelable: fechaActual >= new Date(), // Solo se pueden cancelar clases futuras
            cancelada: !!claseCancelada,
            motivoCancelacion: claseCancelada?.motivo || null
          };
        });
      } else {
        // Para solicitudes únicas, usar la fecha de la solicitud
        let fechaLocal;
        if (/^\d{4}-\d{2}-\d{2}$/.test(solicitud.fecha)) {
          const [y, m, d] = solicitud.fecha.split('-');
          fechaLocal = new Date(Number(y), Number(m) - 1, Number(d));
        } else {
          fechaLocal = new Date(solicitud.fecha);
        }
        // Verificar si está cancelada (para solicitudes únicas)
        const clasesCanceladas = solicitud.clasesCanceladas || [];
        const claseCancelada = clasesCanceladas.find(cc => 
          cc.fecha && new Date(cc.fecha).toDateString() === fechaLocal.toDateString()
        );
        return {
          ...solicitud,
          fechaEspecifica: fechaLocal,
          tipoClase: 'unica',
          esCancelable: fechaLocal >= new Date(), // Solo se pueden cancelar clases futuras
          cancelada: !!claseCancelada,
          motivoCancelacion: claseCancelada?.motivo || null
        };
      }
    }).flat();
  }, [clasesAprobadas]);

  // Filtrar clases según el filtro seleccionado
  const clasesFiltradas = useMemo(() => {
    if (!clasesConDatos) return [];

    const hoy = new Date();
    const inicioSemanaActual = new Date(hoy);
    inicioSemanaActual.setDate(hoy.getDate() - hoy.getDay()); // Domingo
    
    const finSemanaActual = new Date(inicioSemanaActual);
    finSemanaActual.setDate(inicioSemanaActual.getDate() + 6); // Sábado
    
    const inicioSemanaProxima = new Date(finSemanaActual);
    inicioSemanaProxima.setDate(finSemanaActual.getDate() + 1); // Domingo siguiente
    
    const finSemanaProxima = new Date(inicioSemanaProxima);
    finSemanaProxima.setDate(inicioSemanaProxima.getDate() + 6); // Sábado siguiente

    return clasesConDatos.filter(clase => {
      const fechaClase = clase.fechaEspecifica;
      
      switch (filtroSemana) {
        case 'actual':
          return fechaClase >= inicioSemanaActual && fechaClase <= finSemanaActual;
        case 'siguiente':
          return fechaClase >= inicioSemanaProxima && fechaClase <= finSemanaProxima;
        case 'todas':
        default:
          return true;
      }
    }).sort((a, b) => a.fechaEspecifica - b.fechaEspecifica);
  }, [clasesConDatos, filtroSemana]);

  // Cancelar una clase específica
  const cancelarClase = async (clase) => {
    const result = await Swal.fire({
      title: '¿Cancelar esta clase?',
      html: `
        <div style="text-align: left;">
          <strong>Fecha:</strong> ${clase.fechaEspecifica.toLocaleDateString('es-CL')}<br>
          <strong>Horario:</strong> ${clase.horaInicio} - ${clase.horaTermino}<br>
          <strong>Laboratorio:</strong> ${clase.laboratorio}<br><br>
          <p style="color: #d33;">Esta acción no se puede deshacer.</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      input: 'textarea',
      inputLabel: 'Motivo de cancelación (obligatorio)',
      inputPlaceholder: 'Explica brevemente por qué necesitas cancelar esta clase...',
      inputValidator: (value) => {
        if (!value || value.trim().length < 10) {
          return 'Debes proporcionar un motivo de al menos 10 caracteres';
        }
      },
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Cancelar Clase',
      cancelButtonText: 'No cancelar',
      focusConfirm: false,
      allowOutsideClick: false,
      allowEscapeKey: false
    });

    if (result.isConfirmed) {
      try {
        // Manejar el ID de manera segura
        let solicitudId;
        if (typeof clase.id === 'string' && clase.id.includes('-')) {
          solicitudId = clase.id.split('-')[0]; // Para IDs recurrentes como "123-2024-08-22"
        } else {
          solicitudId = clase.id; // Para IDs únicos
        }
        
        console.log('🔧 Cancelando clase:', {
          claseId: clase.id,
          solicitudId: solicitudId,
          fecha: clase.fechaEspecifica.toISOString().split('T')[0],
          motivo: result.value.trim()
        });
        

        // Enviar fecha local yyyy-mm-dd sin desfase de zona horaria
        const fechaLocal = new Date(clase.fechaEspecifica.getTime() - clase.fechaEspecifica.getTimezoneOffset() * 60000)
          .toISOString().split('T')[0];
        await clasesService.cancelarClase(
          solicitudId, // solicitudId limpio
          fechaLocal, // fechaEspecifica en formato YYYY-MM-DD local
          result.value.trim() // motivoCancelacion
        );
        
        // Refrescar notificaciones inmediatamente
        if (window.refreshNotifications) {
          window.refreshNotifications();
        }
        
        showSuccessAlert(
          'Clase cancelada', 
          `La clase del ${clase.fechaEspecifica.toLocaleDateString('es-CL')} ha sido cancelada exitosamente.`
        );
        
        // Recargar las clases para mostrar el estado actualizado
        fetchClasesAprobadas();
      } catch (error) {
        console.error('Error al cancelar clase:', error);
        showErrorAlert('Error', error.message || 'No se pudo cancelar la clase. Inténtalo de nuevo.');
      }
    }
  };

  // Agrupar clases por día (solo para vista calendario)
  const clasesPorDia = useMemo(() => {
    if (!vistaCalendario || !clasesFiltradas) return [];

    const grupos = {};
    
    clasesFiltradas.forEach(clase => {
      const fechaStr = clase.fechaEspecifica.toDateString();
      if (!grupos[fechaStr]) {
        grupos[fechaStr] = {
          fecha: clase.fechaEspecifica,
          clases: []
        };
      }
      grupos[fechaStr].clases.push(clase);
    });

    return Object.values(grupos).sort((a, b) => a.fecha - b.fecha);
  }, [clasesFiltradas, vistaCalendario]);

  const formatearFecha = (fecha) => {
    // Si recibimos un string YYYY-MM-DD, mostrarlo como DD-MM-YYYY
    if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      const [y, m, d] = fecha.split('-');
      return `${d}-${m}-${y}`;
    }
    // Si es Date, mostrar como DD-MM-YYYY
    if (fecha instanceof Date && !isNaN(fecha)) {
      const d = String(fecha.getDate()).padStart(2, '0');
      const m = String(fecha.getMonth() + 1).padStart(2, '0');
      const y = fecha.getFullYear();
      return `${d}-${m}-${y}`;
    }
    return '';
  };

  const getDiaSemana = (fecha) => {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    if (fecha instanceof Date && !isNaN(fecha)) {
      return dias[fecha.getDay()];
    }
    // Si es string YYYY-MM-DD, calcular día
    if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      const [y, m, d] = fecha.split('-');
      const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
      return dias[dateObj.getDay()];
    }
    return '';
  };

  const getEstadoClase = (clase) => {
    // Si la clase está cancelada, retornar ese estado primero
    if (clase.cancelada) {
      console.log('🔴 Clase cancelada detectada:', clase.id, clase.motivoCancelacion);
      return 'cancelada';
    }
    
    const ahora = new Date();
    const fechaClase = clase.fechaEspecifica;
    const [horaInicio, minutoInicio] = clase.horaInicio.split(':').map(Number);
    const [horaFin, minutoFin] = clase.horaTermino.split(':').map(Number);
    
    const inicioClase = new Date(fechaClase);
    inicioClase.setHours(horaInicio, minutoInicio, 0, 0);
    
    const finClase = new Date(fechaClase);
    finClase.setHours(horaFin, minutoFin, 0, 0);

    if (ahora > finClase) return 'finalizada';
    if (ahora >= inicioClase && ahora <= finClase) return 'en-curso';
    if (fechaClase.toDateString() === ahora.toDateString() && ahora < inicioClase) return 'hoy';
    return 'programada';
  };

  const getEstadoBadge = (estado) => {
    // No mostrar badge para clases canceladas
    if (estado === 'cancelada') {
      return '';
    }
    
    const badges = {
      'programada': { class: 'badge-info', text: '📅 Programada', icon: '📅' },
      'hoy': { class: 'badge-warning', text: '⏰ Hoy', icon: '⏰' },
      'en-curso': { class: 'badge-success', text: '🟢 En Curso', icon: '🟢' },
      'finalizada': { class: 'badge-secondary', text: '✅ Finalizada', icon: '✅' }
    };

    const badge = badges[estado] || badges.programada;
    return `<span class="badge ${badge.class}">${badge.text}</span>`;
  };

  if (user?.rol !== 'profesor') {
    return (
      <div className="mis-clases-container">
        <div className="access-denied">
          <div className="access-icon">🚫</div>
          <h3>Acceso Denegado</h3>
          <p>Esta página está disponible solo para profesores.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mis-clases-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando clases...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mis-clases-container">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error al cargar las clases</h3>
          <p>{error}</p>
          <button className="btn-retry" onClick={fetchClasesAprobadas}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!clasesFiltradas || clasesFiltradas.length === 0) {
    return (
      <div className="mis-clases-container">
        <div className="clases-header">
          <div className="header-title">
            <h1>📚 Mis Clases</h1>
            <p>Gestiona tu horario de clases aprobadas</p>
          </div>
          
          <div className="header-controls">
            <div className="filtros-container">
              <span className="filtro-label">📅 Período:</span>
              <select 
                value={filtroSemana} 
                onChange={(e) => setFiltroSemana(e.target.value)}
                className="filtro-select"
              >
                <option value="actual">Esta semana</option>
                <option value="siguiente">Próxima semana</option>
                <option value="todas">Todas las futuras</option>
              </select>
            </div>

            <div className="vista-toggle">
              <p className="modo-titulo">🔄 Modo:</p>
              <div className="modo-botones">
                <button 
                  className={`toggle-btn ${!vistaCalendario ? 'active' : ''}`}
                  onClick={() => setVistaCalendario(false)}
                >
                  📋 Lista
                </button>
                <button 
                  className={`toggle-btn ${vistaCalendario ? 'active' : ''}`}
                  onClick={() => setVistaCalendario(true)}
                >
                  📅 Calendario
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h3>No hay clases programadas</h3>
          <p>No tienes clases aprobadas para el período seleccionado. Las clases aparecerán aquí una vez que sean aprobadas por un administrador.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mis-clases-container">
      <div className="clases-header">
        <div className="header-title">
          <h1>📚 Mis Clases</h1>
          <p>Gestiona tu horario de clases aprobadas</p>
        </div>
        
        <div className="header-controls">
          <div className="filtros-container">
            <span className="filtro-label">📅 Período:</span>
            <select 
              value={filtroSemana} 
              onChange={(e) => setFiltroSemana(e.target.value)}
              className="filtro-select"
            >
              <option value="actual">Esta semana</option>
              <option value="siguiente">Próxima semana</option>
              <option value="todas">Todas las futuras</option>
            </select>
          </div>

          <div className="vista-toggle">
            <p className="modo-titulo">🔄 Modo:</p>
            <div className="modo-botones">
              <button 
                className={`toggle-btn ${!vistaCalendario ? 'active' : ''}`}
                onClick={() => setVistaCalendario(false)}
              >
                📋 Lista
              </button>
              <button 
                className={`toggle-btn ${vistaCalendario ? 'active' : ''}`}
                onClick={() => setVistaCalendario(true)}
              >
                📅 Calendario
              </button>
            </div>
          </div>
        </div>
      </div>

      {!vistaCalendario ? (
        // VISTA DE LISTA
        <div className="clases-grid">
          {clasesFiltradas.map((clase) => {
            const estado = getEstadoClase(clase);
            return (
              <div key={clase.id} className={`clase-card ${estado}`}>
                <div className="clase-card-header">
                  <h4>{clase.titulo}</h4>
                  <div className="badges-container">
                    {clase.tipoClase === 'recurrente' && (
                      <span className="badge badge-info">🔄 Recurrente</span>
                    )}
                    <div 
                      className="estado-badge"
                      dangerouslySetInnerHTML={{ __html: getEstadoBadge(estado) }}
                    />
                  </div>
                </div>

                <div className="clase-card-body">
                  <div className="info-row">
                    <span className="label">📅 Fecha:</span>
                    <span>{getDiaSemana(clase.fechaEspecifica)}, {formatearFecha(clase.fechaEspecifica)}</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="label">🕐 Horario:</span>
                    <span>{clase.horaInicio} - {clase.horaTermino}</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="label">🏢 Laboratorio:</span>
                    <span>{clase.laboratorio.toUpperCase()}</span>
                  </div>
                  
                  {estado === 'cancelada' && clase.motivoCancelacion && (
                    <div className="info-row motivo-cancelacion">
                      <span className="label">❌ Motivo de cancelación:</span>
                      <span>{clase.motivoCancelacion}</span>
                    </div>
                  )}
                  
                  {clase.descripcion && (
                    <div className="info-row">
                      <span className="label">📝 Descripción:</span>
                      <span>{clase.descripcion}</span>
                    </div>
                  )}
                </div>
                
                <div className="clase-card-actions">
                  {estado !== 'finalizada' && estado !== 'cancelada' && clase.esCancelable && (
                    <button 
                      className="btn-cancelar"
                      onClick={() => cancelarClase(clase)}
                    >
                      ❌ Cancelar Clase
                    </button>
                  )}
                  
                  {estado === 'finalizada' && (
                    <span className="texto-finalizada">Clase finalizada</span>
                  )}
                  
                  {!clase.esCancelable && estado !== 'finalizada' && estado !== 'cancelada' && (
                    <span className="texto-no-cancelable">No se puede cancelar</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // VISTA DE CALENDARIO
        <div className="calendario-container">
          {clasesPorDia.map(({ fecha, clases }) => (
            <div key={fecha.toDateString()} className="dia-calendario">
              <div className="dia-header">
                <h3>{getDiaSemana(fecha)}</h3>
                <span className="fecha">{fecha.toLocaleDateString('es-CL')}</span>
              </div>
              
              <div className="clases-del-dia">
                {clases.map((clase) => {
                  const estado = getEstadoClase(clase);
                  return (
                    <div key={clase.id} className={`clase-calendario ${estado}`}>
                      <div className="clase-header-cal">
                        <span className="hora">{clase.horaInicio} - {clase.horaTermino}</span>
                        <div 
                          className="estado-badge"
                          dangerouslySetInnerHTML={{ __html: getEstadoBadge(estado) }}
                        />
                      </div>
                      
                      <div className="clase-info-cal">
                        <h4>{clase.titulo}</h4>
                        <p>📍 {clase.laboratorio.toUpperCase()}</p>
                        {clase.descripcion && <p className="descripcion">{clase.descripcion}</p>}
                        
                        {estado === 'cancelada' && clase.motivoCancelacion && (
                          <div className="motivo-cancelacion">
                            <strong>Motivo:</strong> {clase.motivoCancelacion}
                          </div>
                        )}
                      </div>
                      
                      {estado !== 'finalizada' && estado !== 'cancelada' && clase.esCancelable && (
                        <button 
                          className="btn-cancelar-small"
                          onClick={() => cancelarClase(clase)}
                        >
                          ❌ Cancelar
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MisClases;
