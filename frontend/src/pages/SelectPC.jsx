import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import '@styles/SelectPC.css';
import { useAuth } from '@context/AuthContext';

import useCreateReservation from '@hooks/reservation/useCreateReservation.jsx';
import { formatRut } from '@helpers/rutFormatter.js';

const SelectPC = ({ onReservaCreada }) => {
  const { labId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAuthorized = user && (user.rol === 'administrador' || user.rol === 'consultor');

  const [maintenancePCs, setMaintenancePCs] = useState(() => {
    const saved = localStorage.getItem('maintenancePCs');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  let pcStart = 1, pcEnd = 40;
  if (labId === 'lab2') { pcStart = 41; pcEnd = 60; }
  else if (labId === 'lab3') { pcStart = 61; pcEnd = 80; }

  const pcs = Array.from({ length: pcEnd - pcStart + 1 }, (_, i) => pcStart + i);

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
    "14:10", "15:40", "17:10"
  ];

  const horasTermino = [
    "09:30", "11:00", "12:30", "14:00",
    "15:30", "17:00", "18:30", "20:00"
  ];

  const [showForm, setShowForm] = useState(false);
  const [selectedPC, setSelectedPC] = useState(null);
  const [showOtroCarrera, setShowOtroCarrera] = useState(false);
  const [showClassBlockForm, setShowClassBlockForm] = useState(false);
  const [formData, setFormData] = useState({
    rut: '',
    carrera: '',
    otroCarrera: '',
    horaInicio: '',
    horaTermino: ''
  });

  // Estado para manejar bloques de clases reservados por administradores
  const [reservedClassBlocks, setReservedClassBlocks] = useState(() => {
    try {
      const saved = localStorage.getItem('reservedClassBlocks');
      if (saved) {
        const parsedData = JSON.parse(saved);
        const now = new Date().getTime();
        
        // Filtrar solo las reservas que no han expirado
        const activeBlocks = new Map();
        Object.entries(parsedData).forEach(([blockKey, block]) => {
          const endTime = new Date(block.endTime).getTime();
          if (endTime > now) {
            activeBlocks.set(blockKey, {
              ...block,
              timer: null
            });
          }
        });
        return activeBlocks;
      }
    } catch (error) {
      console.error('Error loading saved class blocks:', error);
    }
    return new Map();
  });

  const [reservedPCs, setReservedPCs] = useState(() => {
    // Intentar cargar las reservas guardadas al iniciar
    try {
      const saved = localStorage.getItem('reservedPCs');
      if (saved) {
        const parsedData = JSON.parse(saved);
        const now = new Date().getTime();
        
        // Filtrar solo las reservas que no han expirado
        const activeReservations = new Map();
        Object.entries(parsedData).forEach(([pcNumber, reservation]) => {
          const endTime = new Date(reservation.endTime).getTime();
          if (endTime > now) {
            activeReservations.set(parseInt(pcNumber), {
              ...reservation,
              timer: null // Los timers se recrearán
            });
          }
        });
        return activeReservations;
      }
    } catch (error) {
      console.error('Error loading saved reservations:', error);
    }
    return new Map();
  });

  const { handleCreate, loading } = useCreateReservation();

  // Guardar reservas en localStorage cuando cambien
  useEffect(() => {
    const reservationsObject = {};
    reservedPCs.forEach((value, key) => {
      reservationsObject[key] = {
        horaInicio: value.horaInicio,
        horaTermino: value.horaTermino,
        endTime: value.endTime,
        isClassBlock: value.isClassBlock || false
      };
    });
    localStorage.setItem('reservedPCs', JSON.stringify(reservationsObject));
  }, [reservedPCs]);

  // Guardar bloques de clases en localStorage
  useEffect(() => {
    const blocksObject = {};
    reservedClassBlocks.forEach((value, key) => {
      blocksObject[key] = {
        horaInicio: value.horaInicio,
        horaTermino: value.horaTermino,
        endTime: value.endTime,
        title: value.title
      };
    });
    localStorage.setItem('reservedClassBlocks', JSON.stringify(blocksObject));
  }, [reservedClassBlocks]);

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

  // Configurar timers para todas las reservas activas al cargar el componente
  useEffect(() => {
    reservedPCs.forEach((reserva, pcNumber) => {
      if (!reserva.timer) {
        const now = new Date().getTime();
        const endTime = new Date(reserva.endTime).getTime();
        if (endTime > now) {
          const remainingTime = endTime - now;
          const timer = setTimeout(() => {
            setReservedPCs(prev => {
              const newMap = new Map(prev);
              newMap.delete(pcNumber);
              return newMap;
            });
          }, remainingTime);
          
          // Actualizar la reserva con el nuevo timer
          setReservedPCs(prev => {
            const newMap = new Map(prev);
            newMap.set(pcNumber, { ...reserva, timer });
            return newMap;
          });
        }
      }
    });

    // Limpiar todos los timers al desmontar
    return () => {
      reservedPCs.forEach(reserva => {
        if (reserva.timer) {
          clearTimeout(reserva.timer);
        }
      });
    };
  }, []); // Solo se ejecuta al montar el componente

  // Configurar timers para bloques de clases activos al cargar el componente
  useEffect(() => {
    reservedClassBlocks.forEach((block, blockKey) => {
      if (!block.timer) {
        const now = new Date().getTime();
        const endTime = new Date(block.endTime).getTime();
        if (endTime > now) {
          const remainingTime = endTime - now;
          const timer = setTimeout(() => {
            setReservedClassBlocks(prev => {
              const newMap = new Map(prev);
              newMap.delete(blockKey);
              return newMap;
            });
          }, remainingTime);
          
          // Actualizar el bloque con el nuevo timer
          setReservedClassBlocks(prev => {
            const newMap = new Map(prev);
            newMap.set(blockKey, { ...block, timer });
            return newMap;
          });
        }
      }
    });

    // Limpiar todos los timers al desmontar
    return () => {
      reservedClassBlocks.forEach(block => {
        if (block.timer) {
          clearTimeout(block.timer);
        }
      });
    };
  }, []); // Solo se ejecuta al montar el componente

  const calcularDuracionReserva = (horaInicio, horaTermino) => {
    const inicioMs = horaAMilisegundos(horaInicio);
    const terminoMs = horaAMilisegundos(horaTermino);
    return terminoMs - inicioMs;
  };

  const isReserved = useCallback((pcNumber) => {
    // Verificar si está reservado individualmente por otro usuario (RUT específico)
    // Los bloques de clases (ADMIN) NO bloquean reservas individuales
    const individualReservation = reservedPCs.get(pcNumber);
    if (individualReservation && !individualReservation.isClassBlock) {
      return true;
    }
    
    return false;
  }, [reservedPCs]);

  const isInClassBlock = useCallback(() => {
    // Verificar si actualmente hay un bloque de clases activo
    const now = new Date().getTime();
    for (const [blockKey, block] of reservedClassBlocks) {
      const [labKey, horaInicio, horaTermino] = blockKey.split('_');
      if (labKey === labId) {
        const blockStart = horaAMilisegundos(horaInicio);
        const blockEnd = horaAMilisegundos(horaTermino);
        
        // Si estamos dentro del horario del bloque
        if (now >= blockStart && now <= blockEnd) {
          return { active: true, block };
        }
      }
    }
    return { active: false, block: null };
  }, [reservedClassBlocks, labId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!selectedPC) {
        navigate('/home');
      }
    }, 60000);

    return () => clearTimeout(timeout);
  }, [selectedPC, navigate]);

  // Limpiar los timers cuando el componente se desmonta
  useEffect(() => {
    return () => {
      reservedPCs.forEach(reserva => {
        if (reserva.timer) {
          clearTimeout(reserva.timer);
        }
      });
      reservedClassBlocks.forEach(block => {
        if (block.timer) {
          clearTimeout(block.timer);
        }
      });
    };
  }, [reservedPCs, reservedClassBlocks]);

  const handleMaintenance = async () => {
    // Mostrar lista de PCs en mantenimiento primero
    const pcsEnMantenimiento = [...maintenancePCs].map(pc => `Equipo ${pc}`).join(', ');
    const currentPCs = pcsEnMantenimiento.length > 0 ? `\n\nEquipos actualmente en mantenimiento: ${pcsEnMantenimiento}` : '';

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
          if (maintenancePCs.has(num)) {
            return 'Este PC ya está en mantenimiento';
          }
          if (reservedPCs.has(num)) {
            return 'No se puede marcar en mantenimiento un PC reservado';
          }
        } else { // Si vamos a desmarcar
          if (!maintenancePCs.has(num)) {
            return 'Este PC no está en mantenimiento';
          }
        }
      }
    });

    if (pcNumber) {
      const pc = parseInt(pcNumber);
      setMaintenancePCs(prev => {
        const newSet = new Set(prev);
        if (action) {
          newSet.add(pc);
          Swal.fire('¡Listo!', `PC ${pc} ha sido marcado en mantenimiento`, 'success');
        } else {
          newSet.delete(pc);
          Swal.fire('¡Listo!', `PC ${pc} ha sido desmarcado de mantenimiento`, 'success');
        }
        localStorage.setItem('maintenancePCs', JSON.stringify([...newSet]));
        return newSet;
      });
    }
  };

  const handleClassBlockReservation = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Reservar Bloque de Clases',
      html: `
        <div style="text-align: left;">
          <label for="blockType" style="display: block; margin-bottom: 5px; font-weight: bold;">Tipo de bloque:</label>
          <select id="blockType" class="swal2-input" style="margin-bottom: 15px;">
            <option value="">Seleccionar tipo</option>
            <option value="CLASES">CLASES</option>
            <option value="OTRO">OTRO</option>
          </select>
          
          <div id="customTitleContainer" style="display: none;">
            <label for="blockTitle" style="display: block; margin-bottom: 5px; font-weight: bold;">Título personalizado:</label>
            <input id="blockTitle" class="swal2-input" placeholder="Ej: Reunión de profesores" style="margin-bottom: 15px;">
          </div>
          
          <label for="blockStart" style="display: block; margin-bottom: 5px; font-weight: bold;">Hora de inicio:</label>
          <select id="blockStart" class="swal2-input" style="margin-bottom: 15px;">
            <option value="">Seleccionar hora de inicio</option>
            ${horasInicio.map(hora => `<option value="${hora}">${hora}</option>`).join('')}
          </select>
          
          <label for="blockEnd" style="display: block; margin-bottom: 5px; font-weight: bold;">Hora de término:</label>
          <select id="blockEnd" class="swal2-input" style="margin-bottom: 15px;">
            <option value="">Seleccionar hora de término</option>
            ${horasTermino.map(hora => `<option value="${hora}">${hora}</option>`).join('')}
          </select>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Reservar Bloque',
      cancelButtonText: 'Cancelar',
      didOpen: () => {
        // Configurar el evento después de que el modal se renderice
        const blockTypeSelect = document.getElementById('blockType');
        const customContainer = document.getElementById('customTitleContainer');
        const customInput = document.getElementById('blockTitle');
        
        const toggleCustomTitle = () => {
          const blockType = blockTypeSelect.value;
          
          if (blockType === 'OTRO') {
            customContainer.style.display = 'block';
            customInput.required = true;
          } else {
            customContainer.style.display = 'none';
            customInput.required = false;
            customInput.value = '';
          }
        };
        
        // Agregar el event listener
        blockTypeSelect.addEventListener('change', toggleCustomTitle);
      },
      preConfirm: () => {
        const blockType = document.getElementById('blockType').value;
        const customTitle = document.getElementById('blockTitle').value;
        const horaInicio = document.getElementById('blockStart').value;
        const horaTermino = document.getElementById('blockEnd').value;
        
        if (!blockType || !horaInicio || !horaTermino) {
          Swal.showValidationMessage('Todos los campos obligatorios deben ser completados');
          return false;
        }
        
        if (blockType === 'OTRO' && !customTitle.trim()) {
          Swal.showValidationMessage('Debe ingresar un título personalizado');
          return false;
        }
        
        if (horaAMinutos(horaInicio) >= horaAMinutos(horaTermino)) {
          Swal.showValidationMessage('La hora de término debe ser mayor que la hora de inicio');
          return false;
        }
        
        const finalTitle = blockType === 'CLASES' ? 'CLASES' : customTitle.trim();
        return { title: finalTitle, horaInicio, horaTermino };
      }
    });

    if (formValues) {
      try {
        // Crear una reserva para cada PC del laboratorio
        const reservationPromises = pcs.map(async (pcNumber) => {
          const reservationData = {
            rut: user.rut || '12.345.678-9', // RUT válido por defecto
            carrera: 'ADMIN', // Identificador especial para bloques de clases
            horaInicio: formValues.horaInicio,
            horaTermino: formValues.horaTermino,
            labId: labId === 'lab1' ? 1 : labId === 'lab2' ? 2 : 3,
            pcId: pcNumber
          };

          console.log('Enviando datos de reserva:', reservationData); // Debug
          return handleCreate(reservationData, false); // No mostrar alertas automáticas
        });

        const results = await Promise.all(reservationPromises);
        
        // Verificar si todas las reservas fueron exitosas
        const allSuccessful = results.every(result => result.success);
        
        if (allSuccessful) {
          // Agregar el bloque a la lista de bloques reservados
          const blockKey = `${labId}_${formValues.horaInicio}_${formValues.horaTermino}`;
          const endTime = horaAMilisegundos(formValues.horaTermino);
          
          setReservedClassBlocks(prev => {
            const newMap = new Map(prev);
            newMap.set(blockKey, {
              horaInicio: formValues.horaInicio,
              horaTermino: formValues.horaTermino,
              endTime: endTime,
              title: formValues.title,
              timer: setTimeout(() => {
                setReservedClassBlocks(prevBlocks => {
                  const newBlocks = new Map(prevBlocks);
                  newBlocks.delete(blockKey);
                  return newBlocks;
                });
              }, endTime - new Date().getTime())
            });
            return newMap;
          });

          Swal.fire(
            '¡Bloque Reservado!', 
            `El bloque "${formValues.title}" ha sido reservado exitosamente para todo el ${labId.toUpperCase()} de ${formValues.horaInicio} a ${formValues.horaTermino}.`, 
            'success'
          );
        } else {
          const failedResults = results.filter(result => !result.success);
          console.error('Resultados fallidos:', failedResults);
          throw new Error(`Falló la creación de ${failedResults.length} reservas`);
        }
      } catch (error) {
        console.error('Error al reservar bloque:', error);
        Swal.fire('Error', `No se pudo reservar el bloque de clases: ${error.message}. Por favor, intenta nuevamente.`, 'error');
      }
    }
  };

  const handlePCClick = (pcNumber) => {
    // Verificar si el usuario es administrador y no permitir reservas individuales
    if (user && user.rol === 'administrador') {
      const classBlockStatus = isInClassBlock();
      if (classBlockStatus.active) {
        Swal.fire(
          'Bloque de Clases Activo', 
          `Actualmente hay un bloque de clases "${classBlockStatus.block.title}" reservado de ${classBlockStatus.block.horaInicio} a ${classBlockStatus.block.horaTermino}.`, 
          'info'
        );
      } else {
        Swal.fire('Acceso restringido', 'Los administradores solo pueden reservar bloques de clases completos usando el botón correspondiente.', 'warning');
      }
      return;
    }

    if (maintenancePCs.has(pcNumber)) {
      Swal.fire('Equipo en mantenimiento', 'Este equipo no está disponible temporalmente', 'info');
      return;
    }

    if (isReserved(pcNumber)) {
      const reserva = reservedPCs.get(pcNumber);
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

  const configurarTimerReserva = (pcNumber, horaInicio, horaTermino) => {
    const startTime = horaAMilisegundos(horaInicio);
    const endTime = horaAMilisegundos(horaTermino);
    const now = new Date().getTime();
    
    if (endTime < now) {
      return { timer: null, endTime };
    }

    const duracion = endTime - now;
    const timer = setTimeout(() => {
      setReservedPCs(prev => {
        const newMap = new Map(prev);
        newMap.delete(pcNumber);
        return newMap;
      });
    }, duracion);

    return { timer, endTime };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Para usuarios estudiantes y consultores (@alumnos.ubiobio.cl), usar datos del perfil
    // Para otros usuarios, validar campos del formulario
    const esEstudianteOConsultor = user && (user.rol === 'usuario' || user.rol === 'consultor') && user.email && user.email.endsWith('@alumnos.ubiobio.cl');
    
    let rutAUsar, carreraAUsar;
    
    if (esEstudianteOConsultor) {
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

    if (!horasInicio.includes(formData.horaInicio)) {
      Swal.fire('Error', 'La hora de inicio seleccionada no es válida.', 'error');
      return;
    }

    if (!horasTermino.includes(formData.horaTermino)) {
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

    // Solo verificar si está reservado por otro usuario (no por bloque de clases)
    if (isReserved(selectedPC)) {
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
        
        // Actualizar estado de reservas (marcar como reserva individual, no bloque de clases)
        const timerConfig = configurarTimerReserva(selectedPC, formData.horaInicio, formData.horaTermino);
        setReservedPCs(prev => {
          const newMap = new Map(prev);
          newMap.set(selectedPC, {
            horaInicio: formData.horaInicio,
            horaTermino: formData.horaTermino,
            endTime: timerConfig.endTime,
            isClassBlock: false, // Marcar explícitamente como reserva individual
            timer: timerConfig.timer
          });
          return newMap;
        });

        setShowForm(false);
        setFormData({ rut: '', carrera: '', otroCarrera: '', horaInicio: '', horaTermino: '' });
        setSelectedPC(null);
        setShowOtroCarrera(false);
        if (onReservaCreada) onReservaCreada();
      } else if (result.error) {
        if (result.error.includes('Ya tienes una reserva')) {
          Swal.fire('Error', 'Ya hay una reserva en ese horario. Intenta con otro equipo.', 'error');
        } else if (result.error.includes('El PC ya está reservado')) {
          Swal.fire('Error', 'El PC ya está reservado por otro usuario en ese horario. Intenta con otro equipo.', 'error');
        } else {
          Swal.fire('Error', result.error, 'error');
        }
      }
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      Swal.fire('Error', 'Error en el servidor. Por favor, intenta nuevamente más tarde.', 'error');
    }
  };

  const resetAllReservations = () => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esto reiniciará todas las reservas individuales y bloques de clases, todos los computadores volverán a estar disponibles',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, reiniciar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Limpiar todas las reservas individuales
        reservedPCs.forEach((reserva) => {
          if (reserva.timer) {
            clearTimeout(reserva.timer);
          }
        });
        setReservedPCs(new Map());
        localStorage.removeItem('reservedPCs');

        // Limpiar todos los bloques de clases
        reservedClassBlocks.forEach((block) => {
          if (block.timer) {
            clearTimeout(block.timer);
          }
        });
        setReservedClassBlocks(new Map());
        localStorage.removeItem('reservedClassBlocks');
        
        Swal.fire(
          '¡Reiniciado!',
          'Todas las reservas individuales y bloques de clases han sido eliminados.',
          'success'
        );
      }
    });
  };

  return (
    <div className="pc-selection-container">
      <h3>Computadores Disponibles para {labId.toUpperCase()}</h3>
      <h6>Selecciona Tu PC 👇</h6>
      
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
                {user && user.rol === 'administrador' ? 
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
        {isAuthorized && (
          <>
            <button 
              onClick={resetAllReservations}
              className="action-button reset-button"
            >
              Reiniciar todas las reservas
            </button>
            <button 
              onClick={handleMaintenance}
              className="action-button maintenance-button"
            >
              Gestionar Mantenimiento
            </button>
          </>
        )}
        {user && user.rol === 'administrador' && (
          <button 
            onClick={handleClassBlockReservation}
            className="action-button class-block-button"
            style={{ backgroundColor: '#28a745', color: 'white' }}
          >
            🏫 Reservar Bloque de Clases
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
          const isIndividuallyReserved = reserva && !reserva.isClassBlock;
          const classBlockStatus = isInClassBlock();
          const isInActiveClassBlock = classBlockStatus.active;
          
          return (
            <div
              key={pcNumber}
              className={`pc-icon ${isIndividuallyReserved ? 'reserved' : ''} ${isInActiveClassBlock ? 'class-block' : ''} ${maintenancePCs.has(pcNumber) ? 'maintenance' : ''} ${selectedPC === pcNumber ? 'selected' : ''}`}
              onClick={() => handlePCClick(pcNumber)}
              style={{ cursor: maintenancePCs.has(pcNumber) ? 'not-allowed' : 'pointer' }}
            >
              <i className="fas fa-desktop"></i>
              <span>{pcNumber}</span>
              {isInActiveClassBlock && (
                <div className="class-block-label">
                  📚 {classBlockStatus.block.title}
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
            <form onSubmit={handleSubmit}>
              {/* Solo mostrar campo RUT si NO es estudiante/consultor con correo @alumnos.ubiobio.cl */}
              {!(user && (user.rol === 'usuario' || user.rol === 'consultor') && user.email && user.email.endsWith('@alumnos.ubiobio.cl')) && (
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

              {/* Solo mostrar campo carrera si NO es estudiante o consultor con correo @alumnos.ubiobio.cl */}
              {!(user && (user.rol === 'usuario' || user.rol === 'consultor') && user.email && user.email.endsWith('@alumnos.ubiobio.cl')) && (
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

              {/* Mostrar información del perfil para estudiantes y consultores con correo @alumnos.ubiobio.cl */}
              {user && (user.rol === 'usuario' || user.rol === 'consultor') && user.email && user.email.endsWith('@alumnos.ubiobio.cl') && (
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
                {horasInicio.map((hora) => (
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
                <option value="">Selecciona hora de término</option>
                {horasTermino.map((hora) => (
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
