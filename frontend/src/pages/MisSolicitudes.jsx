import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@context/AuthContext';
import useSolicitudes from '@hooks/solicitudes/useSolicitudes';
import useCrearSolicitud from '@hooks/solicitudes/useCrearSolicitud';
import { actualizarEstadoSolicitud, eliminarSolicitud } from '@services/solicitud.service.js';
import { showSuccessAlert, showErrorAlert } from '@helpers/sweetAlert.js';
import { formatearNombre } from '@helpers/formatText.js';
import Swal from 'sweetalert2';
import '@styles/solicitudes.css';

const MisSolicitudes = () => {
  const { user } = useAuth();
  const { solicitudes, loading, error, fetchSolicitudes } = useSolicitudes();
  
  const onSolicitudCreated = useCallback(() => {
    fetchSolicitudes();
    // Refrescar horarios cuando se crea una solicitud aprobada
    if (window.refreshClases) {
      window.refreshClases();
    }
  }, [fetchSolicitudes]);
  
  const { crear: crearSolicitud, loading: creandoSolicitud } = useCrearSolicitud(onSolicitudCreated);
  
  const [showForm, setShowForm] = useState(false);
  const [showOtroCarrera, setShowOtroCarrera] = useState(false);
  const [otroCarrera, setOtroCarrera] = useState('');
  
  // Función para obtener la fecha actual en formato YYYY-MM-DD
  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const [filtros, setFiltros] = useState({
    fechaCreacion: getCurrentDate() // Fecha actual por defecto
  });
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    laboratorio: '',
    carrera: '',
    fecha: '',
    fechaInicio: '',
    fechaTermino: '',
    horaInicio: '',
    horaTermino: '',
    tipoSolicitud: 'unica', // 'unica' o 'recurrente'
    diasSemana: [] // Para solicitudes recurrentes: ['lunes', 'martes', etc.]
  });

  const horasInicio = [
    "08:10", "09:40", "11:10", "12:40",
    "14:10", "15:40", "17:10"
  ];

  const horasTermino = [
    "09:30", "11:00", "12:30", "14:00",
    "15:30", "17:00", "18:30", "20:00"
  ];

  const laboratorios = [
    { value: 'lab1', label: 'Laboratorio 1' },
    { value: 'lab2', label: 'Laboratorio 2' },
    { value: 'lab3', label: 'Laboratorio 3' }
  ];

  const carreras = [
    { value: 'CPA', label: 'Contador Público y Auditor' },
    { value: 'ICO', label: 'Ingeniería Comercial' },
    { value: 'ICINF', label: 'Ingeniería Civil en Informática' },
    { value: 'IECI', label: 'Ingeniería de Ejecución en Computación e Informática' },
    { value: 'DRCH', label: 'Derecho' },
    { value: 'MG', label: 'Magister' },
    { value: 'PECE', label: 'PECE' },
    { value: 'otro', label: 'Otro' }
  ];

  const diasSemanaOpciones = [
    { value: 'lunes', label: 'Lunes', numero: 1 },
    { value: 'martes', label: 'Martes', numero: 2 },
    { value: 'miercoles', label: 'Miércoles', numero: 3 },
    { value: 'jueves', label: 'Jueves', numero: 4 },
    { value: 'viernes', label: 'Viernes', numero: 5 },
    { value: 'sabado', label: 'Sábado', numero: 6 }
  ];



  // Función para abreviar carrera personalizada
  const abreviarCarrera = (texto) => {
    if (!texto) return '';
    
    // Convertir a mayúsculas y limpiar
    const textoLimpio = texto.toUpperCase().trim();
    
    // Dividir en palabras y tomar las iniciales
    const palabras = textoLimpio.split(/\s+/);
    
    if (palabras.length === 1) {
      // Si es una sola palabra, tomar las primeras 4 letras
      return palabras[0].substring(0, 4).toUpperCase();
    } else {
      // Si son múltiples palabras, tomar las iniciales (máximo 5)
      return palabras.slice(0, 5).map(palabra => palabra[0]).join('').toUpperCase();
    }
  };

    // Filtrar solicitudes según el rol
  const solicitudesFiltradas = useMemo(() => {
    if (!solicitudes) return [];
    
    if (user?.rol === 'profesor') {
      // Profesores solo ven sus propias solicitudes
      return solicitudes.filter(s => s.profesorRut === user.rut);
    } else if (user?.rol === 'administrador') {
      // Administradores ven todas las solicitudes
      return solicitudes;
    }
    
    return [];
  }, [solicitudes, user]);

  // Función helper para convertir fecha a formato comparable
  const parseDate = useCallback((fechaStr) => {
    if (!fechaStr) return null;
    
    // Si ya es un objeto Date válido
    if (fechaStr instanceof Date) return fechaStr;
    
    const str = fechaStr.toString().trim();
    
    // Formato YYYY-MM-DD (del input date)
    if (str.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return new Date(str + 'T00:00:00');
    }
    
    // Formato DD-MM-YYYY (del backend)
    if (str.match(/^\d{2}-\d{2}-\d{4}$/)) {
      const [dia, mes, año] = str.split('-');
      return new Date(año, mes - 1, dia); // mes - 1 porque Date usa 0-11
    }
    
    // Formato DD/MM/YYYY 
    if (str.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [dia, mes, año] = str.split('/');
      return new Date(año, mes - 1, dia);
    }
    
    // Formato ISO con tiempo (ejemplo: 2025-08-22T14:18:56.000Z)
    if (str.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      return new Date(str);
    }
    
    // Formato con tiempo incluido (DD-MM-YYYY, HH:MM:SS a. m./p. m.)
    if (str.match(/^\d{2}-\d{2}-\d{4},?\s+\d{1,2}:\d{2}:\d{2}/)) {
      const fechaPart = str.split(',')[0].trim();
      if (fechaPart.match(/^\d{2}-\d{2}-\d{4}$/)) {
        const [dia, mes, año] = fechaPart.split('-');
        return new Date(año, mes - 1, dia);
      }
    }
    
    // Intentar parseo directo como último recurso
    const parsed = new Date(str);
    return isNaN(parsed.getTime()) ? null : parsed;
  }, []);

  // Aplicar filtros adicionales
  const solicitudesConFiltros = useMemo(() => {
    let filtered = [...solicitudesFiltradas];

    // Filtro por FECHA DE CREACIÓN de la solicitud (cuándo se envió)
    if (filtros.fechaCreacion) {
      filtered = filtered.filter(solicitud => {
        // Buscar la fecha de creación en el campo createdAt
        const fechaCreacionSolicitud = parseDate(
          solicitud.createdAt ||        // Campo principal con la fecha de creación
          solicitud.fechaCreacion || 
          solicitud.creada
        );
        const fechaFiltro = parseDate(filtros.fechaCreacion);
        
        if (!fechaCreacionSolicitud || !fechaFiltro) {
          console.log('❌ Fecha inválida:', { 
            solicitudId: solicitud.id, 
            fechaCreacion: solicitud.createdAt,
            fechaFiltro: filtros.fechaCreacion 
          });
          return false;
        }
        
        // Comparar solo las fechas (sin horas)
        const fechaSol = new Date(fechaCreacionSolicitud.getFullYear(), fechaCreacionSolicitud.getMonth(), fechaCreacionSolicitud.getDate());
        const fechaFil = new Date(fechaFiltro.getFullYear(), fechaFiltro.getMonth(), fechaFiltro.getDate());
        
        const coincide = fechaSol.getTime() === fechaFil.getTime();
        
        if (coincide) {
          console.log('✅ Solicitud coincide con filtro:', {
            id: solicitud.id,
            titulo: solicitud.titulo,
            fechaCreacion: fechaSol.toLocaleDateString('es-CL'),
            fechaFiltro: fechaFil.toLocaleDateString('es-CL')
          });
        }
        
        return coincide;
      });
    }

    console.log('📊 Resultado del filtro:', {
      total: solicitudesFiltradas.length,
      filtradas: filtered.length,
      fechaFiltro: filtros.fechaCreacion
    });

    return filtered;
  }, [solicitudesFiltradas, filtros, parseDate]);

  // Obtener horarios de término válidos según la hora de inicio
  const getHorariosTerminoValidos = (horaInicioSeleccionada) => {
    if (!horaInicioSeleccionada) return [];

    const horaAMinutos = (hora) => {
      const [h, m] = hora.split(':').map(Number);
      return h * 60 + m;
    };

    const inicioEnMinutos = horaAMinutos(horaInicioSeleccionada);

    return horasTermino.filter(hora => {
      const terminoEnMinutos = horaAMinutos(hora);
      return terminoEnMinutos > inicioEnMinutos;
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'carrera') {
      if (value === 'otro') {
        setShowOtroCarrera(true);
        setOtroCarrera('');
        setFormData({ ...formData, carrera: '' });
      } else {
        setShowOtroCarrera(false);
        setOtroCarrera('');
        setFormData({ ...formData, carrera: value });
      }
    } else if (name === 'horaInicio') {
      // Al cambiar hora de inicio, limpiar hora de término
      setFormData({ 
        ...formData, 
        horaInicio: value,
        horaTermino: '' 
      });
    } else if (name === 'diasSemana') {
      // Manejar selección múltiple de días de la semana
      const diasActuales = formData.diasSemana || [];
      if (checked) {
        setFormData({ ...formData, diasSemana: [...diasActuales, value] });
      } else {
        setFormData({ ...formData, diasSemana: diasActuales.filter(dia => dia !== value) });
      }
    } else if (name === 'fechaInicio' && formData.tipoSolicitud === 'recurrente') {
      // Al cambiar fecha de inicio en modo recurrente, ajustar fecha fin si es necesario
      setFormData(prev => ({
        ...prev,
        fechaInicio: value,
        fechaTermino: prev.fechaTermino && prev.fechaTermino < value ? value : prev.fechaTermino
      }));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    console.log('🔄 Cambio en filtro:', { name, value });
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.titulo.trim()) {
      showErrorAlert('Error', 'El título es obligatorio');
      return;
    }
    
    if (!formData.laboratorio || !formData.horaInicio || !formData.horaTermino) {
      showErrorAlert('Error', 'Todos los campos obligatorios deben ser completados');
      return;
    }

    if (!formData.carrera && !showOtroCarrera) {
      showErrorAlert('Error', 'Debe seleccionar una carrera');
      return;
    }

    if (showOtroCarrera && !otroCarrera.trim()) {
      showErrorAlert('Error', 'Debe especificar el nombre de la carrera');
      return;
    }

    // Preparar datos de la solicitud
    const solicitudData = { ...formData };
    
    // Manejar carrera personalizada
    if (showOtroCarrera && otroCarrera) {
      solicitudData.carrera = abreviarCarrera(otroCarrera);
    }

    if (formData.tipoSolicitud === 'unica') {
      // Validaciones para solicitud única
      if (!formData.fecha) {
        showErrorAlert('Error', 'Debe especificar una fecha');
        return;
      }

      // Validar que la fecha no sea pasada (permitir hoy)
      // Usar la fecha del input directamente para evitar problemas de zona horaria
      const fechaInput = formData.fecha;
      const hoyInput = new Date().toISOString().split('T')[0];

      if (fechaInput < hoyInput) {
        showErrorAlert('Error', 'No se pueden crear solicitudes para fechas pasadas');
        return;
      }

      // Validar que no sea domingo (corregir bug de timezone)
      // getDay() devuelve 0 para domingo, pero la fecha debe ser local
      const fechaLocal = new Date(formData.fecha + 'T00:00:00');
      if (fechaLocal.getDay() === 0) {
        showErrorAlert('Error', 'No se pueden solicitar bloques para los domingos');
        return;
      }
    } else {
      // Validaciones para solicitud recurrente
      if (!formData.fechaInicio || !formData.fechaTermino) {
        showErrorAlert('Error', 'Debe especificar fecha de inicio y término para solicitudes recurrentes');
        return;
      }

      if (!formData.diasSemana || formData.diasSemana.length === 0) {
        showErrorAlert('Error', 'Debe seleccionar al menos un día de la semana');
        return;
      }

      // Validar que las fechas no sean pasadas
      const fechaInicio = new Date(formData.fechaInicio);
      const fechaTermino = new Date(formData.fechaTermino);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      if (fechaInicio < hoy) {
        showErrorAlert('Error', 'No se pueden crear solicitudes para fechas pasadas');
        return;
      }
      
      if (fechaTermino < fechaInicio) {
        showErrorAlert('Error', 'La fecha de término no puede ser anterior a la fecha de inicio');
        return;
      }

      // Verificar que haya al menos una ocurrencia válida
      let hayOcurrencias = false;
      for (let d = new Date(fechaInicio); d <= fechaTermino; d.setDate(d.getDate() + 1)) {
        const diaSemana = diasSemanaOpciones.find(dia => dia.numero === d.getDay());
        if (diaSemana && formData.diasSemana.includes(diaSemana.value)) {
          hayOcurrencias = true;
          break;
        }
      }
      
      if (!hayOcurrencias) {
        showErrorAlert('Error', 'No hay ocurrencias válidas con los días seleccionados en el período especificado');
        return;
      }
    }

    const result = await crearSolicitud(solicitudData);
    
    if (result.success) {
      // Limpiar formulario
      setFormData({
        titulo: '',
        descripcion: '',
        laboratorio: '',
        carrera: '',
        fecha: '',
        fechaInicio: '',
        fechaTermino: '',
        horaInicio: '',
        horaTermino: '',
        tipoSolicitud: 'unica',
        diasSemana: []
      });
      setShowOtroCarrera(false);
      setOtroCarrera('');
      setShowForm(false);
    }
  };

  const handleAprobarRechazar = async (solicitud, estado) => {
    if (estado === 'rechazada') {
      const { value: motivoRechazo } = await Swal.fire({
        title: 'Rechazar Solicitud',
        input: 'textarea',
        inputLabel: 'Motivo del rechazo',
        inputPlaceholder: 'Explica el motivo del rechazo...',
        inputAttributes: {
          'aria-label': 'Motivo del rechazo'
        },
        showCancelButton: true,
        confirmButtonText: 'Rechazar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc3545',
        inputValidator: (value) => {
          if (!value) {
            return 'Debes proporcionar un motivo de rechazo';
          }
        }
      });

      if (!motivoRechazo) return;

      const result = await actualizarEstadoSolicitud(solicitud.id, estado, motivoRechazo);
      
      if (result.success) {
        showSuccessAlert('Solicitud rechazada', 'La solicitud ha sido rechazada exitosamente');
        fetchSolicitudes();
      } else {
        showErrorAlert('Error', result.error);
      }
    } else {
      // Aprobar solicitud
      const confirmResult = await Swal.fire({
        title: '¿Aprobar solicitud?',
        html: `
          <div style="text-align: left;">
            <p><strong>Profesor:</strong> ${solicitud.profesorNombre}</p>
            <p><strong>Título:</strong> ${solicitud.titulo}</p>
            <p><strong>Laboratorio:</strong> ${solicitud.laboratorio.toUpperCase()}</p>
            ${solicitud.carrera ? `<p><strong>Carrera:</strong> ${solicitud.carrera}</p>` : ''}
            <p><strong>Tipo:</strong> ${solicitud.tipoSolicitud === 'recurrente' ? '🔄 Recurrente' : '📅 Única'}</p>
            <p><strong>Fecha:</strong> ${formatearFechaSolicitud(solicitud)}</p>
            <p><strong>Horario:</strong> ${solicitud.horaInicio} - ${solicitud.horaTermino}</p>
            ${solicitud.descripcion ? `<p><strong>Descripción:</strong> ${solicitud.descripcion}</p>` : ''}
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Aprobar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#28a745'
      });

      if (confirmResult.isConfirmed) {
        const result = await actualizarEstadoSolicitud(solicitud.id, estado);
        
        if (result.success) {
          showSuccessAlert('Solicitud aprobada', 'La solicitud ha sido aprobada exitosamente');
          fetchSolicitudes();
          // Refrescar horarios cuando se aprueba una solicitud
          if (window.refreshClases) {
            window.refreshClases();
          }
        } else {
          showErrorAlert('Error', result.error);
        }
      }
    }
  };

  const handleEliminar = async (solicitud) => {
    const confirmResult = await Swal.fire({
      title: '¿Eliminar solicitud?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    });

    if (confirmResult.isConfirmed) {
      const result = await eliminarSolicitud(solicitud.id);
      
      if (result.success) {
        showSuccessAlert('Solicitud eliminada', 'La solicitud ha sido eliminada exitosamente');
        fetchSolicitudes();
      } else {
        showErrorAlert('Error', result.error);
      }
    }
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: { class: 'badge-warning', text: 'Pendiente' },
      aprobada: { class: 'badge-success', text: 'Aprobada' },
      rechazada: { class: 'badge-danger', text: 'Rechazada' }
    };
    
    const badge = badges[estado] || badges.pendiente;
    return `<span class="badge ${badge.class}">${badge.text}</span>`;
  };

  const formatearFechaSolicitud = (solicitud) => {
    if (solicitud.tipoSolicitud === 'recurrente') {
      // Validar que las fechas existan
      if (!solicitud.fecha || !solicitud.fechaTermino) {
        return 'Fechas no disponibles';
      }
      
      // Parsear fechas sin conversión de timezone
      const [yearI, monthI, dayI] = solicitud.fecha.split('-').map(Number);
      const fechaInicio = new Date(yearI, monthI - 1, dayI).toLocaleDateString('es-CL');
      
      const [yearT, monthT, dayT] = solicitud.fechaTermino.split('-').map(Number);
      const fechaTermino = new Date(yearT, monthT - 1, dayT).toLocaleDateString('es-CL');
      
      const diasTexto = solicitud.diasSemana?.join(', ') || 'Días no especificados';
      return `${fechaInicio} al ${fechaTermino} (${diasTexto})`;
    }
    
    // Validar que la fecha exista
    if (!solicitud.fecha) {
      return 'Fecha no disponible';
    }
    
    // Parsear fecha sin conversión de timezone (YYYY-MM-DD)
    const [year, month, day] = solicitud.fecha.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('es-CL');
  };

  const getTipoSolicitudBadge = (solicitud) => {
    if (solicitud.tipoSolicitud === 'recurrente') {
      return '<span class="badge badge-info">🔄 Recurrente</span>';
    }
    return '<span class="badge badge-secondary">📅 Única</span>';
  };

  if (loading) {
    return (
      <div className="solicitudes-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="solicitudes-container">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error de Conexión</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button 
              className="btn-retry"
              onClick={fetchSolicitudes}
            >
              🔄 Reintentar
            </button>
            <div className="error-help">
              <small>
                Si el problema persiste, verifica que:
                <br />• El backend esté funcionando en el puerto 3009
                <br />• La base de datos esté conectada
                <br />• No haya errores en la consola del servidor
              </small>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="solicitudes-container">
      <div className="solicitudes-header">
        <h1 style={{ textAlign: 'center', width: '100%', marginBottom: '20px' }}>Solicitudes De Clases</h1>
      </div>

      <div className="solicitudes-header-flex">
        <div className="filter-card">
          <div className="filters-section">
            <div className="filters-content">
              <div className="filter-group">
                <label className="filter-label">📅 Fecha de envío de solicitud:</label>
                <input
                  type="date"
                  name="fechaCreacion"
                  value={filtros.fechaCreacion}
                  onChange={handleFilterChange}
                  className="filter-input"
                />
              </div>
            </div>
          </div>
          {user?.rol === 'profesor' && (
            <button 
              className="btn-nueva-solicitud"
              onClick={() => setShowForm(true)}
              disabled={creandoSolicitud}
            >
              ➕ Nueva Solicitud
            </button>
          )}
        </div>
      </div>

      {/* Formulario para nueva solicitud */}
      {showForm && (
        <div className="popup-overlay">
          <div className="popup-form solicitud-form modern-form">
            <div className="form-header modern-header">
              <div className="header-content">
                <div className="header-icon">✨</div>
                <div className="header-text">
                  <h3>Nueva Solicitud de Bloque de Clases</h3>
                  <p>Complete los datos para solicitar un bloque de tiempo</p>
                </div>
              </div>
              <button 
                className="close-btn modern-close"
                onClick={() => setShowForm(false)}
                disabled={creandoSolicitud}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modern-form-content">
              {/* Sección 1: Información básica */}
              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon">📝</div>
                  <h4>Información de la Actividad</h4>
                </div>
                
                <div className="form-group">
                  <label htmlFor="titulo" className="modern-label">
                    <span className="label-text">Título de la actividad</span>
                    <span className="required-indicator">*</span>
                  </label>
                  <input
                    type="text"
                    id="titulo"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleChange}
                    placeholder="Ej: Clase de Programación Avanzada"
                    maxLength="255"
                    disabled={creandoSolicitud}
                    className="modern-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="descripcion" className="modern-label">
                    <span className="label-text">Descripción</span>
                    <span className="optional-indicator">(opcional)</span>
                  </label>
                  <textarea
                    id="descripcion"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    placeholder="Detalles adicionales sobre la actividad..."
                    rows="3"
                    disabled={creandoSolicitud}
                    className="modern-textarea"
                  />
                </div>


              </div>

              {/* Sección 2: Laboratorio y fechas */}
              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon">🏢</div>
                  <h4>Lugar, Carrera y Tipo de Solicitud</h4>
                </div>
                
                <div className="form-group">
                  <label htmlFor="laboratorio" className="modern-label">
                    <span className="label-text">Laboratorio</span>
                    <span className="required-indicator">*</span>
                  </label>
                  <select
                    id="laboratorio"
                    name="laboratorio"
                    value={formData.laboratorio}
                    onChange={handleChange}
                    disabled={creandoSolicitud}
                    className="modern-select"
                    required
                  >
                    <option value="">Seleccionar laboratorio</option>
                    {laboratorios.map(lab => (
                      <option key={lab.value} value={lab.value}>
                        {lab.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="carrera" className="modern-label">
                    <span className="label-text">Carrera</span>
                    <span className="required-indicator">*</span>
                  </label>
                  <select
                    id="carrera"
                    name="carrera"
                    value={showOtroCarrera ? 'otro' : formData.carrera}
                    onChange={handleChange}
                    disabled={creandoSolicitud}
                    className="modern-select"
                    required
                  >
                    <option value="">Seleccionar carrera</option>
                    {carreras.map(carrera => (
                      <option key={carrera.value} value={carrera.value}>
                        {carrera.label}
                      </option>
                    ))}
                  </select>
                </div>

                {showOtroCarrera && (
                  <div className="form-group">
                    <label htmlFor="otroCarrera" className="modern-label">
                      <span className="label-text">Especifica tu carrera</span>
                      <span className="required-indicator">*</span>
                    </label>
                    <input
                      type="text"
                      id="otroCarrera"
                      name="otroCarrera"
                      value={otroCarrera}
                      onChange={(e) => setOtroCarrera(e.target.value)}
                      placeholder="Escribe el nombre de tu carrera"
                      maxLength="50"
                      disabled={creandoSolicitud}
                      className="modern-input"
                      required
                    />
                    <small style={{ display: 'block', marginTop: '0.5rem', color: '#6c757d' }}>
                      Se abreviará automáticamente: {otroCarrera ? abreviarCarrera(otroCarrera) : '(esperando...)'}
                    </small>
                  </div>
                )}

                {/* Toggle para tipo de solicitud */}
                <div className="form-group">
                  <div className="date-mode-toggle">
                    <button
                      type="button"
                      className={`toggle-btn ${formData.tipoSolicitud === 'unica' ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, tipoSolicitud: 'unica', diasSemana: [] })}
                      disabled={creandoSolicitud}
                    >
                      📅 Fecha única
                    </button>
                    <button
                      type="button"
                      className={`toggle-btn ${formData.tipoSolicitud === 'recurrente' ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, tipoSolicitud: 'recurrente' })}
                      disabled={creandoSolicitud}
                    >
                      🔄 Clases recurrentes
                    </button>
                  </div>
                  
                  {/* Información sobre solicitudes recurrentes */}
                  {formData.tipoSolicitud === 'recurrente' && (
                    <div className="info-card">
                      <div className="info-icon">ℹ️</div>
                      <div className="info-content">
                        <p><strong>Solicitudes Recurrentes:</strong></p>
                        <p>Se creará UNA SOLA solicitud que cubrirá todo el período especificado con los días seleccionados.</p>
                        <p><strong>Ventaja:</strong> Una solicitud limpia que representa todo tu horario recurrente</p>
                      </div>
                    </div>
                  )}
                </div>

                {formData.tipoSolicitud === 'unica' ? (
                  <div className="form-group">
                    <label htmlFor="fecha" className="modern-label">
                      <span className="label-text">Fecha</span>
                      <span className="required-indicator">*</span>
                    </label>
                    <input
                      type="date"
                      id="fecha"
                      name="fecha"
                      value={formData.fecha}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      disabled={creandoSolicitud}
                      className="modern-input"
                      required
                    />
                  </div>
                ) : (
                  <>
                    <div className="form-row modern-row">
                      <div className="form-group">
                        <label htmlFor="fechaInicio" className="modern-label">
                          <span className="label-text">Fecha de inicio</span>
                          <span className="required-indicator">*</span>
                        </label>
                        <input
                          type="date"
                          id="fechaInicio"
                          name="fechaInicio"
                          value={formData.fechaInicio}
                          onChange={handleChange}
                          min={new Date().toISOString().split('T')[0]}
                          disabled={creandoSolicitud}
                          className="modern-input"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="fechaTermino" className="modern-label">
                          <span className="label-text">Fecha de término</span>
                          <span className="required-indicator">*</span>
                        </label>
                        <input
                          type="date"
                          id="fechaTermino"
                          name="fechaTermino"
                          value={formData.fechaTermino}
                          onChange={handleChange}
                          min={formData.fechaInicio || new Date().toISOString().split('T')[0]}
                          disabled={creandoSolicitud}
                          className="modern-input"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="modern-label">
                        <span className="label-text">Días de la semana</span>
                        <span className="required-indicator">*</span>
                      </label>
                      <div className="days-selector">
                        {diasSemanaOpciones.map(dia => (
                          <label key={dia.value} className="day-checkbox">
                            <input
                              type="checkbox"
                              name="diasSemana"
                              value={dia.value}
                              checked={formData.diasSemana.includes(dia.value)}
                              onChange={handleChange}
                              disabled={creandoSolicitud}
                            />
                            <span className="day-label">{dia.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Sección 3: Horarios */}
              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon">⏰</div>
                  <h4>Horarios de Clase</h4>
                </div>
                
                <div className="form-row modern-row">
                  <div className="form-group">
                    <label htmlFor="horaInicio" className="modern-label">
                      <span className="label-text">Hora de inicio</span>
                      <span className="required-indicator">*</span>
                    </label>
                    <select
                      id="horaInicio"
                      name="horaInicio"
                      value={formData.horaInicio}
                      onChange={handleChange}
                      disabled={creandoSolicitud}
                      className="modern-select"
                      required
                    >
                      <option value="">Seleccionar hora de inicio</option>
                      {horasInicio.map(hora => (
                        <option key={hora} value={hora}>{hora}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="horaTermino" className="modern-label">
                      <span className="label-text">Hora de término</span>
                      <span className="required-indicator">*</span>
                    </label>
                    <select
                      id="horaTermino"
                      name="horaTermino"
                      value={formData.horaTermino}
                      onChange={handleChange}
                      disabled={creandoSolicitud}
                      className="modern-select"
                      required
                    >
                      <option value="">
                        {formData.horaInicio ? "Seleccionar hora de término" : "Primero selecciona hora de inicio"}
                      </option>
                      {getHorariosTerminoValidos(formData.horaInicio).map(hora => (
                        <option key={hora} value={hora}>{hora}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {((formData.tipoSolicitud === 'unica' && formData.fecha) || 
                  (formData.tipoSolicitud === 'recurrente' && formData.fechaInicio && formData.fechaTermino && formData.diasSemana.length > 0)) && (
                  <div className="date-info-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div className="info-icon" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
                    <div className="info-content">
                      {formData.carrera && (
                        <>
                          <p style={{ margin: 0 }}><strong>🎓 Carrera:</strong></p>
                          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem', color: '#2563eb' }}>
                            {showOtroCarrera && otroCarrera ? abreviarCarrera(otroCarrera) : formData.carrera}
                          </p>
                          <hr style={{ width: '50%', margin: '0.5rem auto', border: '1px solid #e5e7eb' }} />
                        </>
                      )}
                      {formData.tipoSolicitud === 'unica' ? (
                        <>
                          <p style={{ margin: 0 }}><strong>Fecha solicitada:</strong></p>
                          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>{formData.fecha ? formData.fecha.split('-').reverse().join('-') : ''}</p>
                          <small style={{ display: 'block', marginTop: '0.2rem' }}>Solicitud para un solo día</small>
                        </>
                      ) : (
                        <>
                          <p style={{ margin: 0 }}><strong>Clases recurrentes:</strong></p>
                          <p style={{ margin: 0 }}>
                            Todos los {formData.diasSemana.map(dia => 
                              diasSemanaOpciones.find(d => d.value === dia)?.label
                            ).join(', ').toLowerCase()}
                          </p>
                          <p style={{ margin: 0 }}>
                            Del {formData.fechaInicio ? new Date(formData.fechaInicio).toLocaleDateString('es-CL') : ''} al {formData.fechaTermino ? new Date(formData.fechaTermino).toLocaleDateString('es-CL') : ''}
                          </p>
                          <small style={{ display: 'block', marginTop: '0.2rem' }}>Se creará una solicitud para cada día especificado</small>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="form-buttons modern-buttons">
                <button 
                  type="submit" 
                  className="btn-primary modern-primary"
                  disabled={creandoSolicitud}
                >
                  {creandoSolicitud ? (
                    <>
                      <span className="loading-spinner"></span>
                      Creando solicitud...
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">✨</span>
                      Crear Solicitud
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  className="btn-secondary modern-secondary"
                  onClick={() => setShowForm(false)}
                  disabled={creandoSolicitud}
                >
                  <span className="btn-icon">✕</span>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de solicitudes */}
      <div className="solicitudes-list">
        {solicitudesConFiltros.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No hay solicitudes</h3>
            <p>
              {user?.rol === 'profesor' ? 
                'Aún no has creado ninguna solicitud de bloque de clases. ¡Comienza creando una nueva!' :
                'No hay solicitudes pendientes de revisión.'
              }
            </p>
          </div>
        ) : (
          <div className="solicitudes-grid">
            {solicitudesConFiltros.map(solicitud => (
              <div key={solicitud.id} className={`solicitud-card ${solicitud.estado}`}>
                <div className="card-header">
                  <h4>{solicitud.titulo}</h4>
                  <div className="badges-container">
                    <div 
                      className="tipo-badge"
                      dangerouslySetInnerHTML={{ __html: getTipoSolicitudBadge(solicitud) }}
                    />
                    <div 
                      className="estado-badge"
                      dangerouslySetInnerHTML={{ __html: getEstadoBadge(solicitud.estado) }}
                    />
                  </div>
                </div>
                
                <div className="card-body">
                  <div className="info-row">
                    <span className="label">👨‍🏫 Profesor:</span>
                    <span>{formatearNombre(solicitud.profesorNombre)}</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="label">🏢 Laboratorio:</span>
                    <span>{solicitud.laboratorio.toUpperCase()}</span>
                  </div>

                  
                  {solicitud.carrera && (
                    <div className="info-row">
                      <span className="label">🎓 Carrera:</span>
                      <span>{solicitud.carrera}</span>
                    </div>
                  )}
                  
                  <div className="info-row">
                    <span className="label">📅 Fecha:</span>
                    <span>{formatearFechaSolicitud(solicitud)}</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="label">🕐 Horario:</span>
                    <span>{solicitud.horaInicio} - {solicitud.horaTermino}</span>
                  </div>
                  
                  {solicitud.descripcion && (
                    <div className="info-row">
                      <span className="label">📝 Descripción:</span>
                      <span>{solicitud.descripcion}</span>
                    </div>
                  )}
                  
                  <div className="info-row">
                    <span className="label">📋 Creada:</span>
                    <span>{new Date(solicitud.createdAt).toLocaleString('es-CL')}</span>
                  </div>
                  
                  {solicitud.fechaRespuesta && (
                    <div className="info-row">
                      <span className="label">✅ Respondida:</span>
                      <span>{new Date(solicitud.fechaRespuesta).toLocaleString('es-CL')}</span>
                    </div>
                  )}
                  
                  {solicitud.motivoRechazo && (
                    <div className="info-row rechazo">
                      <span className="label">❌ Motivo de rechazo:</span>
                      <span>{solicitud.motivoRechazo}</span>
                    </div>
                  )}
                </div>
                
                <div className="card-actions">
                  {/* Acciones para administradores y profesores: solo pueden eliminar sus propias solicitudes */}
                  {solicitud.estado === 'pendiente' && solicitud.profesorRut === user?.rut && (
                    <button 
                      className="btn-eliminar"
                      onClick={() => handleEliminar(solicitud)}
                    >
                      🗑️ Eliminar
                    </button>
                  )}
                  {/* Acciones para administradores: aprobar/rechazar cualquier solicitud */}
                  {user?.rol === 'administrador' && solicitud.estado === 'pendiente' && (
                    <>
                      <button 
                        className="btn-aprobar"
                        onClick={() => handleAprobarRechazar(solicitud, 'aprobada')}
                      >
                        ✅ Aprobar
                      </button>
                      <button 
                        className="btn-rechazar"
                        onClick={() => handleAprobarRechazar(solicitud, 'rechazada')}
                      >
                        ❌ Rechazar
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MisSolicitudes;

