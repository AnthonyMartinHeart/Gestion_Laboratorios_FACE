import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import '@styles/SelectPC.css';
import { useAuth } from '@context/AuthContext';

import useCreateReservation from '@hooks/reservation/useCreateReservation.jsx';
import useReservationSync from '@hooks/reservation/useReservationSync.jsx';
import { formatRut } from '@helpers/rutFormatter.js';
import { deleteReservation, createReservation, finishReservation, finishActiveReservations } from '@services/reservation.service.js';
import { getLabFreeMode, setLabFreeMode } from '../services/lab.service';

const SelectPC = ({ onReservaCreada }) => {
  const { labId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Hook para sincronización de reservas en tiempo real
  const { 
    reservedPCs, 
    loading: syncLoading, 
    isReserved, 
    isInMaintenance,
    isInClassBlock, 
    refreshReservations 
  } = useReservationSync(labId);

  const isAuthorized = user && (user.rol === 'administrador' || user.rol === 'consultor' || user.rol === 'profesor');

  let pcStart = 1, pcEnd = 40;
  if (labId === 'lab2') { pcStart = 41; pcEnd = 60; }
  else if (labId === 'lab3') { pcStart = 61; pcEnd = 80; }

  const pcs = Array.from({ length: pcEnd - pcStart + 1 }, (_, i) => pcStart + i);

    
  const getNumericLabId = () => {
    if (labId === 'lab1') return 1;
    if (labId === 'lab2') return 2;
    if (labId === 'lab3') return 3;
    return 1;
  };

  
  const [freeMode, setFreeMode] = useState(false);
  const [loadingFreeMode, setLoadingFreeMode] = useState(false);

  const carrerasMap = {
    "Contador Público y Auditor": "CPA",
    "Ingeniería Comercial": "ICO",
    "Ingeniería Civil en Informática": "ICINF",
    "Ingeniería de Ejecución en Computación e Informática": "IECI",
    "Derecho": "DRCH",
    "Magister": "MG",
    "PECE": "PECE",
    "Otro": "OTRO"
  };

  const carreras = Object.keys(carrerasMap);

  const horasInicio = [
    "08:10", "09:40", "11:10", "12:40",
    "14:10", "15:40", "17:10", "18:40"
  ];

  const horasTermino = [
    "09:30", "11:00", "12:30", "14:00",
    "15:30", "17:00", "18:30", "19:20", "20:00"
  ];

  // Función para obtener la fecha/hora actual (usa zona horaria local automáticamente)
  const getLocalDateTime = () => {
    // Simplemente retorna la fecha/hora local del sistema
    // Esto se ajusta automáticamente a la zona horaria configurada en el servidor/navegador
    const now = new Date();
    
    return now;
  };

  // Función para obtener horarios válidos según la hora actual
  const getHorariosValidos = () => {
    // Usar hora local del sistema (se ajusta automáticamente a la zona horaria)
    const ahora = getLocalDateTime();
    
    // Verificar si es domingo (0 = domingo en JavaScript)
    const esDomingo = ahora.getDay() === 0;
    
    // Si es domingo, no hay horarios disponibles
    if (esDomingo) {
      return {
        inicioValidos: [],
        terminoValidos: [],
        esDomingo: true
      };
    }
    
    const horaActual = ahora.getHours();
    const minutoActual = ahora.getMinutes();
    const tiempoActualEnMinutos = horaActual * 60 + minutoActual;

    // Margen de anticipación universal para todas las clases (50 minutos)
    const margenAnticipacion = 50;

    // Mapeo de horarios de término a horarios de inicio siguiente para transiciones automáticas
    const terminoAInicio = {
      "09:30": { siguiente: "09:40", ventanaInicio: 9 * 60 + 30, ventanaFin: 9 * 60 + 40 },   // 09:30 → 09:40
      "11:00": { siguiente: "11:10", ventanaInicio: 11 * 60 + 0, ventanaFin: 11 * 60 + 10 },  // 11:00 → 11:10
      "12:30": { siguiente: "12:40", ventanaInicio: 12 * 60 + 30, ventanaFin: 12 * 60 + 40 }, // 12:30 → 12:40
      "14:00": { siguiente: "14:10", ventanaInicio: 14 * 60 + 0, ventanaFin: 14 * 60 + 10 },  // 14:00 → 14:10
      "15:30": { siguiente: "15:40", ventanaInicio: 15 * 60 + 30, ventanaFin: 15 * 60 + 40 }, // 15:30 → 15:40
      "17:00": { siguiente: "17:10", ventanaInicio: 17 * 60 + 0, ventanaFin: 17 * 60 + 10 }   // 17:00 → 17:10
    };

    // Verificar si estamos en una ventana de tiempo de transición entre clases (activación inmediata)
    let enVentanaTransicion = false;
    let claseActivada = null;
    
      for (const [horaTermino, config] of Object.entries(terminoAInicio)) {
      const { siguiente, ventanaInicio, ventanaFin } = config;
      
      // Si estamos entre la hora de término y el inicio de la siguiente clase
      if (tiempoActualEnMinutos >= ventanaInicio && tiempoActualEnMinutos <= ventanaFin) {
        enVentanaTransicion = true;
        claseActivada = siguiente;
        break;
      }
    }    const horariosInicioValidos = horasInicio.filter(hora => {
      const [h, m] = hora.split(':').map(Number);
      const tiempoHora = h * 60 + m;
      
      // CASO 1: Si estamos en ventana de transición y esta es la siguiente clase, activar inmediatamente
      if (enVentanaTransicion && hora === claseActivada) {
        return true;
      }
      
      // CASO 2: Si la clase ya comenzó, permitir reservas hasta 1 hora después del inicio
      if (tiempoHora <= tiempoActualEnMinutos) {
        const tiempoLimite = tiempoHora + 60; // 1 hora después del inicio de la clase
        return tiempoActualEnMinutos <= tiempoLimite;
      }
      
      // CASO 3: Para TODAS las clases futuras, aplicar margen de anticipación uniforme de 30 minutos
      const tiempoActivacion = tiempoHora - margenAnticipacion; // 30 minutos antes del inicio
      const permiteReserva = tiempoActualEnMinutos >= tiempoActivacion;
      
      return permiteReserva;
    });

    const horariosTerminoValidos = horasTermino.filter(hora => {
      const [h, m] = hora.split(':').map(Number);
      const tiempoHora = h * 60 + m;
      // Para horarios de término, usar un margen mínimo desde la hora actual
      return tiempoHora > tiempoActualEnMinutos + 15; // Al menos 15 minutos de duración mínima
    });

    return {
      inicioValidos: horariosInicioValidos,
      terminoValidos: horariosTerminoValidos,
      esDomingo: false
    };
  };

  // Función para obtener horarios de término válidos según la hora de inicio seleccionada
  const getHorariosTerminoValidos = (horaInicioSeleccionada) => {
    if (!horaInicioSeleccionada) return [];

    const { terminoValidos } = getHorariosValidos();
    const inicioEnMinutos = horaAMinutos(horaInicioSeleccionada);

    return terminoValidos.filter(hora => {
      const terminoEnMinutos = horaAMinutos(hora);
      return terminoEnMinutos > inicioEnMinutos;
    });
  };

  const [showForm, setShowForm] = useState(false);
  const [selectedPC, setSelectedPC] = useState(null);
  const [showOtroCarrera, setShowOtroCarrera] = useState(false);
  const [formData, setFormData] = useState({
    rut: '',
    carrera: '',
    otroCarrera: '',
    horaInicio: '',
    horaTermino: ''
  });

  const { handleCreate, loading } = useCreateReservation();

  const horaAMinutos = (hora) => {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  };

  const horaAMilisegundos = (hora) => {
    const hoy = new Date();
    const [horas, minutos] = hora.split(':').map(Number);
    const tiempo = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), horas, minutos);
    // Si la hora ya pasó hoy, asumimos que es para mañana
    if (tiempo < hoy) {
      tiempo.setDate(tiempo.getDate() + 1);
    }
    return tiempo.getTime();
  };

  const calcularDuracionReserva = (horaInicio, horaTermino) => {
    const inicioMs = horaAMilisegundos(horaInicio);
    const terminoMs = horaAMilisegundos(horaTermino);
    return terminoMs - inicioMs;
  };

    
  useEffect(() => {
    const loadFreeMode = async () => {
      try {
        const numericLabId = getNumericLabId();
        const initial = await getLabFreeMode(numericLabId);
        setFreeMode(initial);
      } catch (e) {
        console.error('Error cargando modo libre del laboratorio:', e);
      }
    };

    loadFreeMode();
  }, [labId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!selectedPC) {
        navigate('/home');
      }
    }, 60000);

    return () => clearTimeout(timeout);
  }, [selectedPC, navigate]);

  // Hook para sincronización automática de horarios cada minuto
  useEffect(() => {
    const syncInterval = setInterval(() => {
      // Forzar re-renderizado para actualizar horarios disponibles
      const localTime = getLocalDateTime();
      console.log('🔄 Sincronizando horarios automáticamente:', localTime.toLocaleString());
      
      // Si hay un formulario abierto, actualizar los horarios disponibles
      if (showForm) {
        const horariosActualizados = getHorariosValidos();
        if (horariosActualizados.esDomingo) {
          // Si es domingo y hay un formulario abierto, cerrarlo
          setShowForm(false);
          setSelectedPC(null);
          Swal.fire({
            title: 'Laboratorio Cerrado',
            text: 'El laboratorio se ha cerrado automáticamente porque es domingo.',
            icon: 'info',
            confirmButtonText: 'Entendido'
          });
        }
      }
    }, 60000); // Cada minuto

    // Cleanup del intervalo
    return () => clearInterval(syncInterval);
  }, [showForm, navigate]);

  // Hook adicional para detectar cambios de zona horaria del navegador
  useEffect(() => {
    const detectTimezoneChange = () => {
      const currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log('🌍 Zona horaria detectada:', currentTimezone);
      
      // Verificar si la página se cargó con una zona horaria diferente
      const storedTimezone = localStorage.getItem('lastTimezone');
      if (storedTimezone && storedTimezone !== currentTimezone) {
        console.log('⚠️ Cambio de zona horaria detectado:', storedTimezone, '->', currentTimezone);
        // Forzar recarga para recalcular horarios
        window.location.reload();
      }
      localStorage.setItem('lastTimezone', currentTimezone);
    };

    detectTimezoneChange();
    
    // Detectar cambios de visibilidad de la página (cuando el usuario regresa)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        detectTimezoneChange();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleMaintenance = async () => {
    // Obtener PCs en mantenimiento
    const pcsEnMantenimiento = [];
    for (let pc = pcStart; pc <= pcEnd; pc++) {
      if (isInMaintenance(pc)) {
        pcsEnMantenimiento.push(pc);
      }
    }
    
    const maintenanceList = pcsEnMantenimiento.map(pc => `Equipo ${pc}`).join(', ');
    const currentPCs = maintenanceList.length > 0 ? `\n\nEquipos actualmente en mantenimiento: ${maintenanceList}` : '';

    const { value: action } = await Swal.fire({
      title: 'Gestión de Mantenimiento',
      text: `¿Qué acción desea realizar?${currentPCs}`,
      icon: 'question',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Marcar PC en mantenimiento',
      denyButtonText: 'Desmarcar PC de mantenimiento',
      cancelButtonText: 'Cancelar',
      cancelButtonColor: '#6c757d'
    });

    if (!action && action !== false) return; // Si el usuario cierra el diálogo

    const { value: pcNumber } = await Swal.fire({
      title: action ? 'Marcar en Mantenimiento' : 'Desmarcar de Mantenimiento',
      input: 'number',
      inputLabel: 'Número de PC',
      inputPlaceholder: 'Ingrese el número del PC',
      showCancelButton: true,
      inputValidator: (value) => {
        const num = parseInt(value);
        if (!value) {
          return 'Debe ingresar un número de PC';
        }
        if (num < pcStart || num > pcEnd) {
          return `El número debe estar entre ${pcStart} y ${pcEnd}`;
        }
        if (action) { // Si vamos a marcar en mantenimiento
          if (isInMaintenance(num)) {
            return 'Este PC ya está en mantenimiento';
          }
          if (isReserved(num)) {
            return 'No se puede marcar en mantenimiento un PC reservado';
          }
        } else { // Si vamos a desmarcar
          if (!isInMaintenance(num)) {
            return 'Este PC no está en mantenimiento';
          }
        }
      }
    });

    if (pcNumber) {
      const pc = parseInt(pcNumber);
      
      try {
        if (action) {
          // Marcar PC en mantenimiento creando una reserva especial
          const maintenanceData = {
            rut: '00.000.000-0', // RUT especial para mantenimiento
            carrera: 'MAINTENANCE',
            horaInicio: '00:00',
            horaTermino: '23:59',
            labId: labId === 'lab1' ? 1 : labId === 'lab2' ? 2 : 3,
            pcId: pc
          };

          console.log('=== CREANDO RESERVA DE MANTENIMIENTO ===');
          console.log('Datos enviados:', maintenanceData);
          
          try {
            const result = await createReservation(maintenanceData);
            console.log('Respuesta del servidor:', result);
            
            if (result && result.success) {
              console.log('✅ Reserva de mantenimiento creada exitosamente');
              refreshReservations();
              // Refrescar notificaciones inmediatamente
              if (window.refreshNotifications) {
                window.refreshNotifications();
              }
              Swal.fire('¡Listo!', `PC ${pc} ha sido marcado en mantenimiento y será visible para todos los usuarios`, 'success');
            } else if (result && !result.error) {
              console.log('✅ Reserva creada (sin campo success explícito)');
              refreshReservations();
              // Refrescar notificaciones inmediatamente
              if (window.refreshNotifications) {
                window.refreshNotifications();
              }
              Swal.fire('¡Listo!', `PC ${pc} ha sido marcado en mantenimiento y será visible para todos los usuarios`, 'success');
            } else {
              console.log('❌ Error en la creación:', result.error);
              throw new Error(result.error || 'Error al marcar en mantenimiento');
            }
          } catch (networkError) {
            console.error('❌ Error de red o servidor:', networkError);
            throw networkError;
          }
        } else {
          // Desmarcar PC de mantenimiento eliminando la reserva especial
          const maintenanceReservation = reservedPCs.get(pc);
          
          if (maintenanceReservation && maintenanceReservation.carrera === 'MAINTENANCE') {
            const result = await deleteReservation(maintenanceReservation.id);
            
            if (!result.error) {
              // Actualizar la sincronización
              refreshReservations();
              // Refrescar notificaciones inmediatamente
              if (window.refreshNotifications) {
                window.refreshNotifications();
              }
              Swal.fire('¡Listo!', `PC ${pc} ha sido desmarcado de mantenimiento y volverá a estar disponible para todos los usuarios`, 'success');
            } else {
              throw new Error(result.error || 'Error al desmarcar de mantenimiento');
            }
          } else {
            throw new Error('No se encontró la reserva de mantenimiento');
          }
        }
      } catch (error) {
        console.error('Error en gestión de mantenimiento:', error);
        Swal.fire('Error', `No se pudo completar la operación: ${error.message}`, 'error');
      }
    }
  };

  const handleLibrarEquipos = async () => {
    // Solo administradores y consultores pueden liberar equipos
    if (!user || (user.rol !== 'administrador' && user.rol !== 'consultor')) {
      Swal.fire('Acceso denegado', 'Solo los administradores y consultores pueden liberar equipos.', 'error');
      return;
    }

    // Obtener el rango de PCs del laboratorio actual
    const { start, end } = (() => {
      switch (labId) {
        case 'lab1': return { start: 1, end: 40 };
        case 'lab2': return { start: 41, end: 60 };
        case 'lab3': return { start: 61, end: 80 };
        default: return { start: 1, end: 40 };
      }
    })();

    // Filtrar reservas activas del laboratorio actual (EXCLUYENDO mantenimiento)
    const activeReservations = Array.from(reservedPCs.entries())
      .filter(([pcNumber, reservation]) => {
        // Solo incluir PCs del laboratorio actual
        const inLab = pcNumber >= start && pcNumber <= end;
        // EXCLUIR reservas de mantenimiento
        const notMaintenance = !reservation.isMaintenance;
        return inLab && notMaintenance;
      })
      .map(([pcNumber, reservation]) => ({
        pcNumber,
        ...reservation
      }));

    if (activeReservations.length === 0) {
      Swal.fire('Información', `No hay equipos reservados en ${labId.toUpperCase()} (excluyendo equipos en mantenimiento).`, 'info');
      return;
    }

    // Mostrar opciones de liberación
    const { value: action } = await Swal.fire({
      title: 'Liberar Equipos',
      html: `
        <div style="text-align: left;">
          <p><strong>Equipos reservados en ${labId.toUpperCase()}:</strong></p>
          <div style="max-height: 200px; overflow-y: auto; margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
            ${activeReservations.map(res => 
              `<div style="margin-bottom: 5px; padding: 5px; background: ${res.isClassBlock ? '#ffe6cc' : '#e6f3ff'}; border-radius: 3px;">
                <strong>PC ${res.pcNumber}</strong> - ${res.horaInicio} a ${res.horaTermino}<br>
                <small>${res.isClassBlock ? '🏫 Bloque de Clases' : '👤 Reserva Individual'}</small>
              </div>`
            ).join('')}
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 10px;">
            <strong>Nota:</strong> "Liberar" hace que el PC vuelva a estar disponible pero mantiene la reserva en la bitácora.<br>
            Los equipos en mantenimiento (morados) NO se liberarán con esta función.
          </p>
        </div>
      `,
      icon: 'question',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: '🎯 Liberar equipo específico',
      denyButtonText: '🔓 Liberar TODOS los equipos',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ffc107',
      denyButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    });

    if (action === true) {
      // Liberar equipo específico
      const { value: pcNumber } = await Swal.fire({
        title: 'Seleccionar Equipo',
        input: 'select',
        inputOptions: activeReservations.reduce((options, res) => {
          const label = `PC ${res.pcNumber} - ${res.horaInicio} a ${res.horaTermino} ${res.isClassBlock ? '(Bloque)' : '(Individual)'}`;
          options[res.pcNumber] = label;
          return options;
        }, {}),
        inputPlaceholder: 'Selecciona el equipo a liberar',
        showCancelButton: true,
        confirmButtonColor: '#ffc107',
        inputValidator: (value) => {
          if (!value) {
            return 'Debes seleccionar un equipo';
          }
        }
      });

      if (pcNumber) {
        const reservation = activeReservations.find(res => res.pcNumber == pcNumber);
        if (reservation && reservation.id) {
          try {
            // Usar finishReservation en lugar de deleteReservation para preservar la bitácora
            const result = await finishReservation(reservation.id);
            if (!result.error) {
              // Actualizar la vista inmediatamente
              refreshReservations();
              // Refrescar notificaciones inmediatamente
              if (window.refreshNotifications) {
                window.refreshNotifications();
              }
              Swal.fire(
                '¡Liberado!', 
                `El PC ${pcNumber} ha sido liberado exitosamente y vuelve a estar disponible (azul). La reserva se mantiene en la bitácora.`, 
                'success'
              );
            } else {
              Swal.fire('Error', `No se pudo liberar el PC ${pcNumber}: ${result.error}`, 'error');
            }
          } catch (error) {
            Swal.fire('Error', `Error al liberar el PC ${pcNumber}: ${error.message}`, 'error');
          }
        }
      }
    } else if (action === false) {
      // Liberar todos los equipos del laboratorio
      const confirmResult = await Swal.fire({
        title: '⚠️ ¿Estás seguro?',
        html: `
          <div style="text-align: center;">
            <p><strong>Esto liberará TODOS los ${activeReservations.length} equipos reservados en ${labId.toUpperCase()}</strong></p>
            <p style="color: #28a745;">Los equipos volverán a estar disponibles (azules)</p>
            <p style="color: #17a2b8; font-weight: bold;">Las reservas se mantendrán en la bitácora/historial</p>
            <p style="color: #666; font-size: 12px; margin-top: 15px;">
              <strong>Nota:</strong> Los equipos en mantenimiento (morados) NO se verán afectados.
            </p>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, liberar TODOS',
        cancelButtonText: 'Cancelar'
      });

      if (confirmResult.isConfirmed) {
        try {
          // Usar el nuevo endpoint para liberar todos los equipos
          const result = await finishActiveReservations();
          
          if (!result.error) {
            // Actualizar la vista
            refreshReservations();
            // Refrescar notificaciones inmediatamente
            if (window.refreshNotifications) {
              window.refreshNotifications();
            }
            
            const count = result.data?.count || activeReservations.length;
            Swal.fire(
              '¡Todos Liberados!', 
              `Se liberaron exitosamente ${count} equipos en ${labId.toUpperCase()}. Todos los equipos vuelven a estar disponibles (azules). Las reservas se mantienen en la bitácora.`, 
              'success'
            );
          } else {
            Swal.fire('Error', `Error al liberar equipos: ${result.error}`, 'error');
          }
        } catch (error) {
          Swal.fire('Error', `Error al liberar equipos: ${error.message}`, 'error');
        }
      }
    }
  };

  const handleToggleFreeMode = async () => {
  if (!user || user.rol !== 'administrador') {
    Swal.fire('Acceso denegado', 'Solo administradores pueden activar o desactivar modo libre.', 'error');
    return;
  }

  const numericLabId = getNumericLabId();
  const newValue = !freeMode;

  setLoadingFreeMode(true);
  const res = await setLabFreeMode(numericLabId, newValue);
  setLoadingFreeMode(false);

  if (res?.status !== 'Success') {
    Swal.fire('Error', res?.message || 'Error al actualizar modo libre', 'error');
    return;
  }

  setFreeMode(newValue);

  Swal.fire(
    'Modo libre actualizado',
    newValue
      ? `LAB${numericLabId} ahora está en modo libre. Los PCs no pedirán login en la app de escritorio.`
      : `LAB${numericLabId} volvió al modo normal.`,
    'success'
  );
};


  const handlePCClick = (pcNumber) => {
    // Verificar si hay horarios disponibles
    const horariosValidos = getHorariosValidos();
    
    // Verificar si es domingo
    if (horariosValidos.esDomingo) {
      Swal.fire({
        title: 'Laboratorio Cerrado',
        html: `
          <div style="text-align: center;">
            <p><strong>🚫 Los domingos el laboratorio está cerrado</strong></p>
            <p>No se pueden realizar reservas los días domingos.</p>
            <br>
            <p>Los laboratorios están disponibles de:</p>
            <p><strong>Lunes a Sábado</strong></p>
            <p>08:10 - 20:00</p>
          </div>
        `,
        icon: 'info',
        confirmButtonText: 'Entendido'
      });
      return;
    }
    
    if (horariosValidos.inicioValidos.length === 0) {
      // Usar hora local para mostrar al usuario
      const localTime = getLocalDateTime();
      const horaActual = localTime.toLocaleTimeString('es-CL', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      });
      
      Swal.fire({
        title: 'Sin horarios disponibles',
        html: `
          <div style="text-align: center;">
            <p>No hay horarios disponibles para reservar en este momento.</p>
            <p><strong>Hora actual (Chile):</strong> ${horaActual}</p>
            <br>
            <p>Los horarios de laboratorio son:</p>
            <ul style="text-align: left; margin: 10px auto; display: inline-block;">
              <li>08:10 - 09:30</li>
              <li>09:40 - 11:00</li>
              <li>11:10 - 12:30</li>
              <li>12:40 - 14:00</li>
              <li>14:10 - 15:30</li>
              <li>15:40 - 17:00</li>
              <li>17:10 - 18:30</li>
              <li>18:40 - 19:20</li>
              <li>19:20 - 20:00</li>
            </ul>
          </div>
        `,
        icon: 'info',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    if (isInMaintenance(pcNumber)) {
      Swal.fire('Equipo en mantenimiento', 'Este equipo no está disponible temporalmente', 'info');
      return;
    }

    // Verificar si hay una reserva individual (no bloque de clases ni mantenimiento)
    const reserva = reservedPCs.get(pcNumber);
    if (reserva && !reserva.isClassBlock && !reserva.isMaintenance) {
      Swal.fire('Equipo reservado', `Este PC está reservado por otro usuario desde ${reserva.horaInicio} hasta ${reserva.horaTermino}. Por favor selecciona otro.`, 'info');
      return;
    }

    // Verificar si hay un bloque de clases activo (solo informativo para estudiantes/consultores)
    const classBlockStatus = isInClassBlock();
    if (classBlockStatus.active) {
      // Informar sobre el bloque de clases pero permitir la reserva
      Swal.fire({
        title: 'Bloque de Clases en Progreso',
        html: `
          <div style="text-align: center;">
            <p><strong>📚 ${classBlockStatus.block.title}</strong></p>
            <p>Horario: ${classBlockStatus.block.horaInicio} - ${classBlockStatus.block.horaTermino}</p>
            <br>
            <p>Hay un bloque de clases activo, pero puedes reservar este PC para uso individual.</p>
            <p><strong>¿Deseas continuar con la reserva del PC ${pcNumber}?</strong></p>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, reservar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#28a745'
      }).then((result) => {
        if (result.isConfirmed) {
          setSelectedPC(pcNumber);
          setShowForm(true);
        }
      });
      return;
    }

    setSelectedPC(pcNumber);
    setShowForm(true);
  };

  const handleChange = (e) => {
    if (e.target.name === 'carrera') {
      const selectedCarrera = e.target.value;
      
      if (selectedCarrera === 'Otro') {
        setShowOtroCarrera(true);
        setFormData({ 
          ...formData, 
          carrera: '',
          otroCarrera: ''
        });
      } else {
        setShowOtroCarrera(false);
        setFormData({ 
          ...formData, 
          carrera: carrerasMap[selectedCarrera],
          otroCarrera: ''
        });
      }
    } else if (e.target.name === 'otroCarrera') {
      const textoCarrera = e.target.value;
      const abreviacion = abreviarCarrera(textoCarrera);
      setFormData({ 
        ...formData, 
        otroCarrera: textoCarrera,
        carrera: abreviacion
      });
    } else if (e.target.name === 'rut') {
      // Formatear RUT automáticamente
      const rutFormateado = formatearRutInput(e.target.value);
      setFormData({ 
        ...formData, 
        rut: rutFormateado 
      });
    } else if (e.target.name === 'horaInicio') {
      // Al cambiar hora de inicio, limpiar hora de término para que el usuario la vuelva a seleccionar
      setFormData({ 
        ...formData, 
        horaInicio: e.target.value,
        horaTermino: '' // Limpiar para forzar nueva selección
      });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

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

  const validarRut = (rut) => {
    const rutLimpio = rut.replace(/\./g, '').replace(/-/g, '');
    if (rutLimpio.length < 8 || rutLimpio.length > 9) return false;
    
    const cuerpo = rutLimpio.slice(0, -1);
    const dv = rutLimpio.slice(-1).toLowerCase();
    
    // Verificar que el cuerpo sea numérico
    if (!/^\d+$/.test(cuerpo)) return false;
    
    // Calcular dígito verificador
    let suma = 0;
    let multiplo = 2;
    
    for (let i = cuerpo.length - 1; i >= 0; i--) {
      suma += parseInt(cuerpo[i]) * multiplo;
      multiplo = multiplo === 7 ? 2 : multiplo + 1;
    }
    
    const dvCalculado = 11 - (suma % 11);
    const dvEsperado = dvCalculado === 11 ? '0' : dvCalculado === 10 ? 'k' : dvCalculado.toString();
    
    return dv === dvEsperado;
  };

  const formatearRutInput = (rut) => {
    // Remover todos los puntos y guiones
    const rutLimpio = rut.replace(/[.-]/g, '');
    
    // Solo permitir números y k/K
    const rutValido = rutLimpio.replace(/[^0-9kK]/g, '');
    
    if (rutValido.length <= 1) return rutValido;
    
    // Separar cuerpo y dígito verificador
    const cuerpo = rutValido.slice(0, -1);
    const dv = rutValido.slice(-1);
    
    // Agregar puntos al cuerpo
    let cuerpoFormateado = '';
    for (let i = cuerpo.length - 1, j = 0; i >= 0; i--, j++) {
      if (j > 0 && j % 3 === 0) {
        cuerpoFormateado = '.' + cuerpoFormateado;
      }
      cuerpoFormateado = cuerpo[i] + cuerpoFormateado;
    }
    
    // Retornar RUT formateado
    return cuerpoFormateado + '-' + dv;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Para usuarios estudiantes y consultores (@alumnos.ubiobio.cl), usar datos del perfil
    // Para administradores y profesores, usar su ROL como identificador
    // Para otros usuarios, validar campos del formulario
    const esEstudianteOConsultor = user && (user.rol === 'usuario' || user.rol === 'estudiante' || user.rol === 'consultor') && user.email && user.email.endsWith('@alumnos.ubiobio.cl');
    const esAdminOProfesor = user && (user.rol === 'administrador' || user.rol === 'profesor');
    
    let rutAUsar, carreraAUsar;
    
    if (esAdminOProfesor) {
      // Para administradores y profesores, usar su rol y rut del perfil
      rutAUsar = user.rut || '';
      carreraAUsar = user.rol.toUpperCase(); // 'ADMINISTRADOR' o 'PROFESOR'
      
      if (!rutAUsar || rutAUsar.trim() === '') {
        Swal.fire('Error', 'No tienes un RUT registrado en tu perfil. Contacta al administrador.', 'error');
        return;
      }
    } else if (esEstudianteOConsultor) {
      // Usar datos del perfil para estudiantes y consultores
      rutAUsar = user.rut || '';
      carreraAUsar = user.carrera || '';
      
      // Validar que tenga los datos necesarios en su perfil
      if (!rutAUsar || rutAUsar.trim() === '') {
        Swal.fire('Error', 'No tienes un RUT registrado en tu perfil. Contacta al administrador.', 'error');
        return;
      }
      if (!carreraAUsar || carreraAUsar.trim() === '') {
        Swal.fire('Error', 'No tienes una carrera registrada en tu perfil. Contacta al administrador.', 'error');
        return;
      }
      
      // Formatear el RUT del perfil
      rutAUsar = formatRut(rutAUsar);
      // Asegurar que la carrera esté en mayúsculas
      carreraAUsar = carreraAUsar.toUpperCase();
    } else {
      // Validar campos del formulario para otros usuarios
      if (!validarRut(formData.rut)) {
        Swal.fire('Error', 'El RUT ingresado no es válido. Verifique el formato y el dígito verificador.', 'error');
        return;
      }
      
      if (!formData.carrera || formData.carrera.trim() === '') {
        Swal.fire('Error', 'Debe seleccionar o ingresar una carrera.', 'error');
        return;
      }
      
      rutAUsar = formatRut(formData.rut);
      carreraAUsar = formData.carrera.toUpperCase(); // Asegurar que esté en mayúsculas
    }

    // Obtener horarios válidos para validación
    const horariosValidos = getHorariosValidos();

    if (!horariosValidos.inicioValidos.includes(formData.horaInicio)) {
      Swal.fire('Error', 'La hora de inicio seleccionada no es válida o ya ha pasado.', 'error');
      return;
    }

    if (!horariosValidos.terminoValidos.includes(formData.horaTermino)) {
      Swal.fire('Error', 'La hora de término seleccionada no es válida.', 'error');
      return;
    }

    if (horaAMinutos(formData.horaInicio) >= horaAMinutos(formData.horaTermino)) {
      Swal.fire('Error', 'La hora de término debe ser mayor que la hora de inicio.', 'error');
      return;
    }

    if (!pcs.includes(selectedPC)) {
      Swal.fire('Error', 'El PC seleccionado no pertenece al laboratorio.', 'error');
      return;
    }

    // Solo verificar si está reservado individualmente (no por bloque de clases ni mantenimiento)
    const reservaExistente = reservedPCs.get(selectedPC);
    if (reservaExistente && !reservaExistente.isClassBlock && !reservaExistente.isMaintenance) {
      Swal.fire('Error', 'El PC ya está reservado por otro usuario. Por favor selecciona otro.', 'error');
      return;
    }

    try {
      const reservationData = {
        rut: rutAUsar,
        carrera: carreraAUsar,
        horaInicio: formData.horaInicio,
        horaTermino: formData.horaTermino,
        labId: labId === 'lab1' ? 1 : labId === 'lab2' ? 2 : 3,
        pcId: selectedPC
      };

      const result = await handleCreate(reservationData);

      if (result.success) {
        // Verificar si hay un bloque de clases activo para personalizar el mensaje
        const classBlockStatus = isInClassBlock();
        let mensaje = `Tu reserva para el PC ${selectedPC} fue registrada con éxito.`;
        
        if (classBlockStatus.active) {
          mensaje += `\n\nNota: Hay un bloque de clases "${classBlockStatus.block.title}" activo (${classBlockStatus.block.horaInicio} - ${classBlockStatus.block.horaTermino}), pero tu reserva individual tiene prioridad sobre ese PC.`;
        }
        
        Swal.fire('¡Reserva creada!', mensaje, 'success');
        
        // Actualizar las reservas desde el backend
        await refreshReservations();

        setShowForm(false);
        setFormData({ rut: '', carrera: '', otroCarrera: '', horaInicio: '', horaTermino: '' });
        setSelectedPC(null);
        setShowOtroCarrera(false);
        if (onReservaCreada) onReservaCreada();
      } else if (result.error) {
        // Mensajes de error personalizados y claros
        if (result.error.includes('Ya tienes una reserva')) {
          Swal.fire({
            title: 'Reserva Duplicada',
            html: `
              <div style="text-align: center;">
                <p>Ya tienes una reserva activa en este horario.</p>
                <br>
                <p><strong>Por favor:</strong></p>
                <ul style="text-align: left; margin: 10px auto; display: inline-block;">
                  <li>Selecciona otro horario, o</li>
                  <li>Libera tu reserva actual primero</li>
                </ul>
              </div>
            `,
            icon: 'warning',
            confirmButtonText: 'Entendido'
          });
        } else if (result.error.includes('Este horario ya fue utilizado anteriormente')) {
          Swal.fire({
            title: 'Horario No Disponible',
            html: `
              <div style="text-align: center;">
                <p><strong>⚠️ Este horario ya fue reservado anteriormente en este PC</strong></p>
                <br>
                <p>Aunque el equipo esté disponible (azul), el horario está registrado en la bitácora y no puede ser reutilizado el mismo día.</p>
                <br>
                <p><strong>Solución:</strong></p>
                <ul style="text-align: left; margin: 10px auto; display: inline-block;">
                  <li>✅ Selecciona un horario diferente, o</li>
                  <li>✅ Selecciona otro equipo disponible</li>
                </ul>
                <br>
                <p style="font-size: 12px; color: #666;">
                  Esto previene conflictos y duplicados en la bitácora del sistema.
                </p>
              </div>
            `,
            icon: 'info',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#3085d6'
          });
        } else if (result.error.includes('El PC ya está reservado')) {
          Swal.fire({
            title: 'Equipo Reservado',
            html: `
              <div style="text-align: center;">
                <p>Este PC ya está reservado por otro usuario en ese horario.</p>
                <br>
                <p><strong>Por favor:</strong></p>
                <ul style="text-align: left; margin: 10px auto; display: inline-block;">
                  <li>Selecciona otro equipo disponible (azul), o</li>
                  <li>Selecciona un horario diferente</li>
                </ul>
              </div>
            `,
            icon: 'warning',
            confirmButtonText: 'Entendido'
          });
        } else {
          Swal.fire('Error', result.error, 'error');
        }
      }
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      Swal.fire('Error', 'Error en el servidor. Por favor, intenta nuevamente más tarde.', 'error');
    }
  };

  return (
    <div className="pc-selection-container">
      <h3>Computadores Disponibles para {labId.toUpperCase()}</h3>
      <h6>Selecciona Tu PC 👇</h6>
      
      {/* Indicador de sincronización horaria */}
      <div style={{
        backgroundColor: '#e8f5e8',
        color: '#2d5016',
        padding: '8px 12px',
        borderRadius: '5px',
        marginBottom: '15px',
        textAlign: 'center',
        fontSize: '12px',
        border: '1px solid #c3e6c3'
      }}>
        🌍 Sincronizado con zona horaria local | 
        🕐 {getLocalDateTime().toLocaleDateString('es-CL', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric'
        })} - {getLocalDateTime().toLocaleTimeString('es-CL', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false
        })}
      </div>

      {freeMode && (
      <div
        style={{
          backgroundColor: '#fff3cd',
          color: '#856404',
          padding: '8px 12px',
          borderRadius: '5px',
          marginBottom: '15px',
          textAlign: 'center',
          fontSize: '12px',
          border: '1px solid #ffeeba'
        }}
      >
        🔓 Este laboratorio está en <strong>modo libre</strong>.
        Los PCs podrán usarse sin inicio de sesión en la app de escritorio.
      </div>
)}

      
      {/* Indicador de domingo (laboratorio cerrado) */}
      {(() => {
        const horariosInfo = getHorariosValidos();
        if (horariosInfo.esDomingo) {
          return (
            <div className="sunday-indicator" style={{
              backgroundColor: '#dc3545',
              color: 'white',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              textAlign: 'center',
              border: '2px solid #c82333'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>
                🚫 LABORATORIO CERRADO
              </div>
              <div style={{ fontSize: '14px' }}>
                Los domingos no se pueden realizar reservas
              </div>
              <div style={{ fontSize: '12px', marginTop: '5px', opacity: '0.9' }}>
                Horario de atención: Lunes a Sábado, 08:10 - 20:00
              </div>
            </div>
          );
        }
        return null;
      })()}
      
      {/* Indicador de bloque de clases activo */}
      {(() => {
        const classBlockStatus = isInClassBlock();
        if (classBlockStatus.active) {
          return (
            <div className="class-block-indicator">
              <div className="class-block-info">
                <span className="class-block-icon">📚</span>
                <div className="class-block-details">
                  <strong>{classBlockStatus.block.title}</strong>
                  <div>Horario: {classBlockStatus.block.horaInicio} - {classBlockStatus.block.horaTermino}</div>
                </div>
              </div>
              <div className="class-block-message">
                {user && (user.rol === 'administrador' || user.rol === 'profesor') ? 
                  'Bloque de clases activo - Computadoras disponibles para uso libre' :
                  'Bloque de clases activo - Computadoras disponibles para uso libre o reserva individual'
                }
              </div>
            </div>
          );
        }
        return null;
      })()}
      
      <div className="button-container">
        {(user && (user.rol === 'administrador' || user.rol === 'consultor')) && (
          <button 
            onClick={handleMaintenance}
            className="action-button maintenance-button"
          >
            Gestionar Mantenimiento
          </button>
        )}
        {(user && (user.rol === 'administrador' || user.rol === 'consultor')) && (
          <button 
            onClick={handleLibrarEquipos}
            className="action-button liberar-button"
            style={{ backgroundColor: '#dc3545', color: 'white' }}
          >
            🔓 Liberar Equipos
          </button>
        )}
        {user && user.rol === 'administrador' && (
          <button
            onClick={handleToggleFreeMode}
            className="action-button free-mode-button"
            style={{
              backgroundColor: freeMode ? '#ff9800' : '#ffc107',
              color: '#ffffff'
            }}
            disabled={loadingFreeMode}
          >
            {freeMode
              ? 'Desactivar modo libre del laboratorio'
              : 'Activar modo libre del laboratorio'}
          </button>
        )}

        <button 
          onClick={() => navigate('/home')}
          className="action-button back-button"
        >
          Volver a la página principal
        </button>
      </div>

      <div className="pc-grid">
        {pcs.map((pcNumber) => {
          const reserva = reservedPCs.get(pcNumber);
          const pcInMaintenance = reserva && reserva.isMaintenance;
          const pcReservado = reserva && !reserva.isMaintenance; // CUALQUIER reserva que no sea mantenimiento = ROJO
          
          // Verificar si es domingo
          const horariosInfo = getHorariosValidos();
          const esDomingo = horariosInfo.esDomingo;
          
          return (
            <div
              key={pcNumber}
              className={`pc-icon ${pcReservado ? 'reserved' : ''} ${pcInMaintenance ? 'maintenance' : ''} ${esDomingo ? 'sunday-closed' : ''} ${selectedPC === pcNumber ? 'selected' : ''}`}
              onClick={() => handlePCClick(pcNumber)}
              style={{ 
                cursor: (pcInMaintenance || esDomingo) ? 'not-allowed' : 'pointer',
                opacity: esDomingo ? '0.5' : '1'
              }}
            >
              <i className="fas fa-desktop"></i>
              <span>{pcNumber}</span>
              {esDomingo && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#dc3545',
                  textShadow: '1px 1px 1px white'
                }}>
                  CERRADO
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="popup-overlay">
          <div className="popup-form">
            <h4>PC {selectedPC} seleccionado - Confirmación de Reserva</h4>
            
            {/* Indicador de hora actual */}
            <div style={{ 
              marginBottom: '15px', 
              padding: '10px', 
              backgroundColor: '#e8f5e8', 
              borderRadius: '5px', 
              border: '1px solid #c3e6c3',
              textAlign: 'center'
            }}>
              <div style={{ color: '#2d5016', fontSize: '14px', fontWeight: 'bold' }}>
                🕐 Hora actual: {getLocalDateTime().toLocaleTimeString('es-CL', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false
                })}
              </div>
              <div style={{ color: '#666', fontSize: '11px', marginTop: '3px' }}>
                Sincronizado automáticamente con zona horaria local
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Solo mostrar campo RUT si NO es estudiante/consultor/administrador/profesor con datos en perfil */}
              {!(user && (((user.rol === 'usuario' || user.rol === 'estudiante' || user.rol === 'consultor') && user.email && user.email.endsWith('@alumnos.ubiobio.cl')) || (user.rol === 'administrador' || user.rol === 'profesor'))) && (
                <>
                  <label>RUT:</label>
                  <input
                    type="text"
                    name="rut"
                    value={formData.rut}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder="12.345.678-9"
                    maxLength="12"
                  />
                </>
              )}

              {/* Solo mostrar campo carrera si NO es estudiante/consultor/administrador/profesor con datos en perfil */}
              {!(user && (((user.rol === 'usuario' || user.rol === 'estudiante' || user.rol === 'consultor') && user.email && user.email.endsWith('@alumnos.ubiobio.cl')) || (user.rol === 'administrador' || user.rol === 'profesor'))) && (
                <>
                  <label>Carrera:</label>
                  <select
                    name="carrera"
                    value={showOtroCarrera ? 'Otro' : Object.keys(carrerasMap).find(key => carrerasMap[key] === formData.carrera) || ''}
                    onChange={handleChange}
                    required={!showOtroCarrera}
                    disabled={loading}
                  >
                    <option value="">Selecciona tu carrera</option>
                    {carreras.map((carrera) => (
                      <option key={carrera} value={carrera}>
                        {carrera}
                      </option>
                    ))}
                  </select>

                  {showOtroCarrera && (
                    <>
                      <label>Especifica tu carrera:</label>
                      <input
                        type="text"
                        name="otroCarrera"
                        value={formData.otroCarrera}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        placeholder="Escribe tu carrera (se abreviará automáticamente)"
                        maxLength="50"
                      />
                      {formData.otroCarrera && (
                        <small style={{ color: '#666', fontSize: '12px' }}>
                          Abreviación: {formData.carrera}
                        </small>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Mostrar información del perfil para administradores y profesores */}
              {user && (user.rol === 'administrador' || user.rol === 'profesor') && (
                <div style={{ marginBottom: '15px', padding: '12px', backgroundColor: '#fff3cd', borderRadius: '5px', border: '1px solid #ffc107' }}>
                  <div style={{ color: '#856404', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                    👤 RUT: {user.rut || 'No registrado'}
                  </div>
                  <div style={{ color: '#856404', fontSize: '14px', fontWeight: 'bold' }}>
                    🎓 ROL: {user.rol.toUpperCase()}
                  </div>
                </div>
              )}

              {/* Mostrar información del perfil para estudiantes y consultores con correo @alumnos.ubiobio.cl */}
              {user && (user.rol === 'usuario' || user.rol === 'estudiante' || user.rol === 'consultor') && user.email && user.email.endsWith('@alumnos.ubiobio.cl') && (
                <div style={{ marginBottom: '15px', padding: '12px', backgroundColor: '#f0f8ff', borderRadius: '5px', border: '1px solid #cce7ff' }}>
                  <div style={{ color: '#2c5aa0', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                    👤 RUT: {user.rut || 'No registrado'}
                  </div>
                  <div style={{ color: '#2c5aa0', fontSize: '14px', fontWeight: 'bold' }}>
                    📚 Carrera: {user.carrera ? user.carrera.toUpperCase() : 'No registrada'}
                  </div>
                </div>
              )}

              <label>Hora de Inicio:</label>
              <select
                name="horaInicio"
                value={formData.horaInicio}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="">Selecciona hora de inicio</option>
                {getHorariosValidos().inicioValidos.map((hora) => (
                  <option key={hora} value={hora}>{hora}</option>
                ))}
              </select>

              <label>Hora de Término:</label>
              <select
                name="horaTermino"
                value={formData.horaTermino}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="">
                  {formData.horaInicio ? "Selecciona hora de término" : "Primero selecciona hora de inicio"}
                </option>
                {getHorariosTerminoValidos(formData.horaInicio).map((hora) => (
                  <option key={hora} value={hora}>{hora}</option>
                ))}
              </select>

              <div className="form-buttons">
                <button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : 'Confirmar Reserva'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!loading) {
                      setShowForm(false);
                      setFormData({ rut: '', carrera: '', otroCarrera: '', horaInicio: '', horaTermino: '' });
                      setSelectedPC(null);
                      setShowOtroCarrera(false);
                    }
                  }}
                  disabled={loading}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectPC;
