import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { tareasService } from '../services/tareas.service';
import Swal from 'sweetalert2';
import '../styles/gestionTareas.css';

const GestionTareas = () => {
  const { user } = useAuth();
  const [tareas, setTareas] = useState([]);
  const [consultores, setConsultores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    fechaLimite: '',
    fechaAsignacion: '',
    estado: '',
    prioridad: ''
  });

  // Estados para el modal de crear/editar tarea
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' o 'edit'
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fechaLimite: '',
    asignadoAId: '',
    prioridad: 'media'
  });

  // Verificar permisos
  if (!user || !['administrador', 'consultor'].includes(user.rol)) {
    return (
      <div className="gestion-tareas-container">
        <div className="no-access">
          <h2>🚫 Acceso denegado</h2>
          <p>No tienes permisos para acceder a esta página.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    cargarDatos();
  }, [user]);

  useEffect(() => {
    cargarTareas();
  }, [filtros]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar consultores si es administrador
      if (user.rol === 'administrador') {
        const consultoresData = await tareasService.getConsultores();
        setConsultores(consultoresData.data || []);
      }
      
      await cargarTareas();
    } catch (error) {
      console.error('Error al cargar datos:', error);
      Swal.fire({
        title: 'Error',
        text: 'Error al cargar los datos',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarTareas = async () => {
    try {
      let tareasData;
      
      if (user.rol === 'administrador') {
        tareasData = await tareasService.getTareas(filtros);
      } else {
        tareasData = await tareasService.getMisTareas(filtros);
      }
      
      setTareas(tareasData.data || []);
    } catch (error) {
      console.error('Error al cargar tareas:', error);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      fechaLimite: '',
      fechaAsignacion: '',
      estado: '',
      prioridad: ''
    });
  };

  const abrirModalCrear = () => {
    setModalMode('create');
    setTareaSeleccionada(null);
    setFormData({
      titulo: '',
      descripcion: '',
      fechaLimite: '',
      asignadoAId: '',
      prioridad: 'media'
    });
    setShowModal(true);
  };

  const abrirModalEditar = (tarea) => {
    setModalMode('edit');
    setTareaSeleccionada(tarea);
    setFormData({
      titulo: tarea.titulo,
      descripcion: tarea.descripcion,
      fechaLimite: tarea.fechaLimite.split('T')[0],
      asignadoAId: tarea.asignadoA.id,
      prioridad: tarea.prioridad
    });
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setTareaSeleccionada(null);
    setFormData({
      titulo: '',
      descripcion: '',
      fechaLimite: '',
      asignadoAId: '',
      prioridad: 'media'
    });
  };

  const handleFormChange = (campo, valor) => {
    setFormData(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const guardarTarea = async (e) => {
    e.preventDefault();
    
    if (!formData.titulo || !formData.descripcion || !formData.fechaLimite || !formData.asignadoAId) {
      Swal.fire({
        title: 'Error',
        text: 'Todos los campos son obligatorios',
        icon: 'error'
      });
      return;
    }

    try {
      if (modalMode === 'create') {
        await tareasService.createTarea(formData);
        // Refrescar notificaciones inmediatamente
        if (window.refreshNotifications) {
          window.refreshNotifications();
        }
        Swal.fire({
          title: '¡Éxito!',
          text: 'Tarea creada exitosamente',
          icon: 'success'
        });
      } else {
        await tareasService.updateTarea(tareaSeleccionada.id, formData);
        // Refrescar notificaciones inmediatamente
        if (window.refreshNotifications) {
          window.refreshNotifications();
        }
        Swal.fire({
          title: '¡Éxito!',
          text: 'Tarea actualizada exitosamente',
          icon: 'success'
        });
      }
      
      cerrarModal();
      await cargarTareas();
    } catch (error) {
      console.error('Error al guardar tarea:', error);
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'Error al guardar la tarea',
        icon: 'error'
      });
    }
  };

  const eliminarTarea = async (tarea) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar la tarea "${tarea.titulo}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await tareasService.deleteTarea(tarea.id);
        Swal.fire({
          title: '¡Eliminada!',
          text: 'La tarea ha sido eliminada',
          icon: 'success'
        });
        await cargarTareas();
      } catch (error) {
        console.error('Error al eliminar tarea:', error);
        Swal.fire({
          title: 'Error',
          text: 'Error al eliminar la tarea',
          icon: 'error'
        });
      }
    }
  };

  const marcarTareaCompletada = async (tarea, completada) => {
    let observaciones = '';
    
    // Si no pudo completar la tarea, solicitar observaciones
    if (!completada) {
      const result = await Swal.fire({
        title: 'Tarea no completada',
        text: 'Por favor, explica por qué no pudiste completar la tarea:',
        input: 'textarea',
        inputPlaceholder: 'Escribe las observaciones aquí...',
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
          if (!value) {
            return 'Las observaciones son obligatorias cuando no se completa la tarea';
          }
        }
      });

      if (!result.isConfirmed) {
        return;
      }
      
      observaciones = result.value;
    } else {
      // Tarea completada, observaciones opcionales
      const result = await Swal.fire({
        title: 'Tarea completada',
        text: 'Observaciones adicionales (opcional):',
        input: 'textarea',
        inputPlaceholder: 'Escribe observaciones si las hay...',
        showCancelButton: true,
        confirmButtonText: 'Marcar como completada',
        cancelButtonText: 'Cancelar'
      });

      if (!result.isConfirmed) {
        return;
      }
      
      observaciones = result.value || '';
    }

    try {
      await tareasService.completarTarea(tarea.id, completada, observaciones);
      // Refrescar notificaciones inmediatamente
      if (window.refreshNotifications) {
        window.refreshNotifications();
      }
      Swal.fire({
        title: '¡Éxito!',
        text: `Tarea marcada como ${completada ? 'completada' : 'no completada'}`,
        icon: 'success'
      });
      await cargarTareas();
    } catch (error) {
      console.error('Error al actualizar tarea:', error);
      Swal.fire({
        title: 'Error',
        text: 'Error al actualizar la tarea',
        icon: 'error'
      });
    }
  };

  const limpiarTareasProcesadas = async () => {
    console.log('🧹 Iniciando limpieza de tareas procesadas...');
    
    // Obtener tareas completadas y no completadas (procesadas)
    const tareasProcesadas = tareas.filter(
      tarea => tarea.estado === 'completada' || tarea.estado === 'no_completada'
    );

    console.log('📊 Tareas encontradas:', {
      total: tareas.length,
      procesadas: tareasProcesadas.length,
      completadas: tareasProcesadas.filter(t => t.estado === 'completada').length,
      noCompletadas: tareasProcesadas.filter(t => t.estado === 'no_completada').length
    });

    if (tareasProcesadas.length === 0) {
      Swal.fire({
        title: 'Sin tareas',
        text: 'No hay tareas completadas o no completadas para eliminar',
        icon: 'info'
      });
      return;
    }

    const confirmResult = await Swal.fire({
      title: '¿Limpiar todas las tareas procesadas?',
      html: `
        <div style="text-align: left;">
          <p>Se eliminarán <strong>${tareasProcesadas.length}</strong> tareas procesadas:</p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>✅ <strong>${tareasProcesadas.filter(t => t.estado === 'completada').length}</strong> tareas completadas</li>
            <li>❌ <strong>${tareasProcesadas.filter(t => t.estado === 'no_completada').length}</strong> tareas no completadas</li>
          </ul>
          <p style="color: #28a745; font-weight: bold;">✋ Las tareas PENDIENTES NO se eliminarán</p>
          <p style="color: #dc3545; font-weight: bold; margin-top: 10px;">⚠️ Esta acción no se puede deshacer</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '🗑️ Eliminar Procesadas',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      customClass: {
        popup: 'swal-wide'
      }
    });

    if (confirmResult.isConfirmed) {
      let eliminadas = 0;
      let errores = 0;

      // Mostrar progreso
      Swal.fire({
        title: 'Eliminando tareas...',
        html: `Progreso: <b>0</b> de <b>${tareasProcesadas.length}</b>`,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Eliminar una por una
      for (let i = 0; i < tareasProcesadas.length; i++) {
        const tarea = tareasProcesadas[i];
        
        console.log(`🗑️ Eliminando tarea ${i + 1}/${tareasProcesadas.length}:`, {
          id: tarea.id,
          titulo: tarea.titulo,
          estado: tarea.estado
        });
        
        // Actualizar progreso
        Swal.update({
          html: `Eliminando: <b>${tarea.titulo}</b><br>Progreso: <b>${i + 1}</b> de <b>${tareasProcesadas.length}</b>`
        });

        try {
          await tareasService.deleteTarea(tarea.id);
          eliminadas++;
          console.log(`✅ Tarea ${tarea.id} eliminada exitosamente`);
        } catch (error) {
          errores++;
          console.error(`❌ Error eliminando tarea ${tarea.id}:`, error);
        }
        
        // Pequeña pausa para no saturar el servidor
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Cerrar modal de progreso
      Swal.close();

      // Mostrar resultado final
      if (errores === 0) {
        Swal.fire({
          title: 'Limpieza completada',
          text: `Se eliminaron exitosamente ${eliminadas} tareas procesadas`,
          icon: 'success'
        });
      } else {
        Swal.fire({
          title: 'Limpieza completada con errores',
          html: `
            <div style="text-align: left;">
              <p>✅ <strong>${eliminadas}</strong> tareas eliminadas correctamente</p>
              <p>❌ <strong>${errores}</strong> tareas no se pudieron eliminar</p>
              <p style="color: #6c757d; font-size: 14px;">Revisa la consola para más detalles sobre los errores</p>
            </div>
          `,
          icon: 'warning',
          confirmButtonText: 'Entendido'
        });
      }

      // Actualizar la lista
      await cargarTareas();
    }
  };

  const formatearFecha = (fechaStr) => {
    // Evitar problemas de zona horaria parseando manualmente la fecha
    const [year, month, day] = fechaStr.split('T')[0].split('-');
    const fecha = new Date(year, month - 1, day);
    
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const obtenerIconoPrioridad = (prioridad) => {
    switch (prioridad) {
      case 'alta': return '🔴';
      case 'media': return '🟡';
      case 'baja': return '🟢';
      default: return '⚪';
    }
  };

  const obtenerIconoEstado = (estado) => {
    switch (estado) {
      case 'completada': return '✅';
      case 'no_completada': return '❌';
      case 'pendiente': return '⏳';
      default: return '⚪';
    }
  };

  if (loading) {
    return (
      <div className="gestion-tareas-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando tareas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gestion-tareas-container">
      <h9>Gestión de Tareas</h9>

      {/* Filtros */}
      <div className="filtros-container">
        <div className="filtros-row">
          <div className="filtros-left">
            <div className="filtro-item">
              <label>📋 Fecha asignación:</label>
              <input
                type="date"
                value={filtros.fechaAsignacion}
                onChange={(e) => handleFiltroChange('fechaAsignacion', e.target.value)}
              />
            </div>

            <div className="filtro-item">
              <label>📅 Fecha límite:</label>
              <input
                type="date"
                value={filtros.fechaLimite}
                onChange={(e) => handleFiltroChange('fechaLimite', e.target.value)}
              />
            </div>

            <div className="filtro-item">
              <label>📊 Estado:</label>
              <select
                value={filtros.estado}
                onChange={(e) => handleFiltroChange('estado', e.target.value)}
              >
                <option value="">Todos</option>
                <option value="pendiente">⏳ Pendiente</option>
                <option value="completada">✅ Completada</option>
                <option value="no_completada">❌ No completada</option>
              </select>
            </div>

            <div className="filtro-item">
              <label>🎯 Prioridad:</label>
              <select
                value={filtros.prioridad}
                onChange={(e) => handleFiltroChange('prioridad', e.target.value)}
              >
                <option value="">Todas</option>
                <option value="alta">🔴 Alta</option>
                <option value="media">🟡 Media</option>
                <option value="baja">🟢 Baja</option>
              </select>
            </div>
          </div>

          <div className="filtros-right">
            <button className="btn-limpiar-filtros" onClick={limpiarFiltros}>
              🗑️ Limpiar filtros
            </button>
            
            {/* Botón limpiar tareas procesadas (administradores y consultores) */}
            <button 
              className="btn-limpiar-procesadas"
              onClick={limpiarTareasProcesadas}
              title="Eliminar todas las tareas completadas y no completadas"
            >
              🧹 Limpiar Procesadas
            </button>
            
            {/* Botón crear tarea (solo administradores) */}
            {user.rol === 'administrador' && (
              <button className="btn-crear-tarea" onClick={abrirModalCrear}>
                ➕ Nueva Tarea
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lista de tareas */}
      <div className="tareas-container">
        {tareas.length === 0 ? (
          <div className="no-tareas">
            <div className="no-tareas-icon">📝</div>
            <h3>No hay tareas</h3>
            <p>
              {user.rol === 'administrador' 
                ? 'Aún no has creado ninguna tarea. ¡Comienza creando una nueva!' 
                : 'No tienes tareas asignadas en este momento.'}
            </p>
          </div>
        ) : (
          <div className="tareas-grid">
            {tareas.map((tarea) => (
              <div key={tarea.id} className={`tarea-card ${tarea.estado}`}>
                <div className="tarea-header">
                  <div className="tarea-prioridad">
                    {obtenerIconoPrioridad(tarea.prioridad)}
                    <span>{tarea.prioridad}</span>
                  </div>
                  <div className="tarea-estado">
                    {obtenerIconoEstado(tarea.estado)}
                    <span>{tarea.estado.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="tarea-body">
                  <h4>{tarea.titulo}</h4>
                  <p className="tarea-descripcion">{tarea.descripcion}</p>
                  
                  <div className="tarea-info">
                    <div className="tarea-info-item">
                      <span className="label">📅 Fecha límite:</span>
                      <span className="value">{formatearFecha(tarea.fechaLimite)}</span>
                    </div>
                    
                    {user.rol === 'administrador' ? (
                      <div className="tarea-info-item">
                        <span className="label">👤 Asignado a:</span>
                        <span className="value">{tarea.asignadoA?.nombreCompleto}</span>
                      </div>
                    ) : (
                      <div className="tarea-info-item">
                        <span className="label">👤 Asignado por:</span>
                        <span className="value">{tarea.asignadoPor?.nombreCompleto}</span>
                      </div>
                    )}

                    <div className="tarea-info-item">
                      <span className="label">📅 Fecha asignación:</span>
                      <span className="value">{formatearFecha(tarea.fechaAsignacion)}</span>
                    </div>

                    {tarea.fechaCompletacion && (
                      <div className="tarea-info-item">
                        <span className="label">✅ Fecha completación:</span>
                        <span className="value">{formatearFecha(tarea.fechaCompletacion)}</span>
                      </div>
                    )}

                    {tarea.observaciones && (
                      <div className="tarea-info-item">
                        <span className="label">💭 Observaciones:</span>
                        <span className="value observaciones">{tarea.observaciones}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="tarea-actions">
                  {user.rol === 'administrador' ? (
                    // Acciones para administradores
                    tarea.estado === 'pendiente' ? (
                      <div className="admin-actions">
                        <button 
                          className="btn-editar"
                          onClick={() => abrirModalEditar(tarea)}
                        >
                          ✏️ Editar
                        </button>
                        <button 
                          className="btn-eliminar"
                          onClick={() => eliminarTarea(tarea)}
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    ) : (
                      <div className="tarea-completada-container">
                        <div className="tarea-completada-info">
                          {tarea.estado === 'completada' ? '✅ Tarea completada exitosamente' : '❌ Tarea marcada como no completada'}
                        </div>
                      </div>
                    )
                  ) : (
                    // Acciones para consultores
                    tarea.estado === 'pendiente' && (
                      <div className="consultor-actions">
                        <button 
                          className="btn-completada"
                          onClick={() => marcarTareaCompletada(tarea, true)}
                        >
                          ✅ Completada
                        </button>
                        <button 
                          className="btn-no-completada"
                          onClick={() => marcarTareaCompletada(tarea, false)}
                        >
                          ❌ No pude completarla
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal crear/editar tarea */}
      {showModal && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {modalMode === 'create' ? '➕ Nueva Tarea' : '✏️ Editar Tarea'}
              </h2>
              <button className="modal-close" onClick={cerrarModal}>✖</button>
            </div>

            <form onSubmit={guardarTarea} className="modal-form">
              <div className="form-group">
                <label>📝 Título *</label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => handleFormChange('titulo', e.target.value)}
                  placeholder="Título de la tarea"
                  required
                />
              </div>

              <div className="form-group">
                <label>📄 Descripción *</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => handleFormChange('descripcion', e.target.value)}
                  placeholder="Descripción detallada de la tarea"
                  rows="4"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>📅 Fecha límite *</label>
                  <input
                    type="date"
                    value={formData.fechaLimite}
                    onChange={(e) => handleFormChange('fechaLimite', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>🎯 Prioridad</label>
                  <select
                    value={formData.prioridad}
                    onChange={(e) => handleFormChange('prioridad', e.target.value)}
                  >
                    <option value="baja">🟢 Baja</option>
                    <option value="media">🟡 Media</option>
                    <option value="alta">🔴 Alta</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>👤 Asignar a consultor *</label>
                <select
                  value={formData.asignadoAId}
                  onChange={(e) => handleFormChange('asignadoAId', e.target.value)}
                  required
                >
                  <option value="">Selecciona un consultor</option>
                  {consultores.map((consultor) => (
                    <option key={consultor.id} value={consultor.id}>
                      {consultor.nombreCompleto} ({consultor.rut})
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancelar" onClick={cerrarModal}>
                  ❌ Cancelar
                </button>
                <button type="submit" className="btn-guardar">
                  💾 {modalMode === 'create' ? 'Crear Tarea' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionTareas;


