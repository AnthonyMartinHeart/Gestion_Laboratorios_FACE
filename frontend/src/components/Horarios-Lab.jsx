import { useState, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from "react";
import useClasesAprobadas from "@hooks/solicitudes/useClasesAprobadas";
import { useAuth } from "@context/AuthContext";
import useHorarioSync from "@hooks/useHorarioSync.jsx";
import Swal from "sweetalert2";
import "@styles/Horarios.css";

const horas = [
  "08:10-08:50", "08:50-09:30", "09:40-10:20", "10:20-11:00",
  "11:10-11:50", "11:50-12:30", "12:40-13:20", "13:20-14:00",
  "14:10-14:50", "14:50-15:30", "15:40-16:20", "16:20-17:00",
  "17:10-17:50", "17:50-18:30", "18:40-19:20", "19:20-20:00",
  "20:00-20:50"
];

const dias = ["LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"];

function generarTablaInicial() {
  // Convertir el formato de horas para display (agregar espacio antes del guión)
  const horasDisplay = horas.map(h => h.replace('-', ' -'));
  const tabla = horasDisplay.map(hora => [hora, ...Array(dias.length).fill("")]);
  console.log('Tabla inicial generada:', tabla);
  return tabla;
}

// Función para determinar si un texto es largo y necesita clase especial
function isLongText(text) {
  return text && (text.length > 15 || text.includes(" ") && text.length > 12);
}

const HorarioLaboratorios = forwardRef(({ laboratorio, selectedDate: propSelectedDate, viewMode = 'daily', renderButtons, onStateChange }, ref) => {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'administrador';
  
  console.log('🔍 HorarioLaboratorios recibió viewMode:', viewMode);
  
  // Hook para sincronización automática (EXACTAMENTE como useReservationSync)
  const { 
    horarios, 
    lastModified, 
    modifiedBy, 
    isLoading, 
    saveHorarios, 
    refreshHorarios 
  } = useHorarioSync();
  
  const [lab1, setLab1] = useState(generarTablaInicial());
  const [lab2, setLab2] = useState(generarTablaInicial());
  const [lab3, setLab3] = useState(generarTablaInicial());
  const [hasChanges, setHasChanges] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // Notificar al padre cuando cambien los estados
  useEffect(() => {
    if (onStateChange) {
      onStateChange({ hasChanges, isLoading });
    }
  }, [hasChanges, isLoading, onStateChange]);
  
  // Usar la fecha de la prop o la fecha actual (como string YYYY-MM-DD)
  const selectedDateString = useMemo(() => {
    if (propSelectedDate) {
      return propSelectedDate; // Ya viene en formato YYYY-MM-DD
    }
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [propSelectedDate]);
  
  // Crear objeto Date solo cuando sea necesario, evitando problemas de timezone
  const selectedDate = useMemo(() => {
    const [year, month, day] = selectedDateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }, [selectedDateString]);

  // Función para ajustar la clase de las textareas con texto largo
  const adjustAllTextareas = useCallback(() => {
    setTimeout(() => {
      const textareas = document.querySelectorAll('.editable-cell');
      textareas.forEach(textarea => {
        // Aplicar clase para texto largo en lugar de ajustar altura
        if (textarea.value && textarea.value.trim().length > 0) {
          if (isLongText(textarea.value)) {
            textarea.classList.add('long-text');
          } else {
            textarea.classList.remove('long-text');
          }
        }
      });
    }, 200); // Pequeño retraso para asegurar que los elementos están renderizados
  }, []);

  // Detectar cambios de tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      adjustAllTextareas();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [adjustAllTextareas]);

  // Cargar datos iniciales desde el hook de sincronización y pintar clases aprobadas
  const { clasesAprobadas, fetchSolicitudes } = useClasesAprobadas();
  
  // Función para marcar una clase específica como cancelada en las tablas
  const marcarClaseCancelada = useCallback((solicitudId, fecha) => {
    console.log('🚫 Marcando clase como cancelada:', { solicitudId, fecha });
    
    const marcarEnLab = (labData) => {
      return labData.map(row => 
        row.map(cell => {
          if (!cell) return cell;
          try {
            const parsed = JSON.parse(cell);
            // Si es una clase automática con el mismo solicitudId y fecha, marcarla como cancelada
            if (parsed.auto && 
                String(parsed.solicitudId) === String(solicitudId) && 
                parsed.date === fecha) {
              console.log('✅ Marcando como CANCELADA:', parsed.content);
              // Agregar "CANCELADA" al contenido
              return JSON.stringify({
                ...parsed,
                content: `❌ CANCELADA - ${parsed.content}`,
                cancelada: true
              });
            }
            return cell;
          } catch {
            // No es JSON, dejar como está
            return cell;
          }
        })
      );
    };
    
    setLab1(prev => marcarEnLab(prev));
    setLab2(prev => marcarEnLab(prev));
    setLab3(prev => marcarEnLab(prev));
  }, []);
  
  // Exponer función de refresco global para que otros componentes puedan actualizar
  useEffect(() => {
    window.refreshClases = () => {
      console.log('🔄 Refrescando clases desde componente externo...');
      // Simplemente actualizar las solicitudes, el useEffect hará el resto
      fetchSolicitudes();
    };
    
    // Exponer función para marcar clase como cancelada
    window.marcarClaseCancelada = marcarClaseCancelada;
    
    return () => {
      window.refreshClases = null;
      window.marcarClaseCancelada = null;
    };
  }, [fetchSolicitudes, marcarClaseCancelada]);
  
  useEffect(() => {
    // Función para clonar y pintar clases aprobadas en la tabla
    // console.log('Actualizando horarios para fecha:', selectedDate.toISOString());
    function getDiaSemanaFromFecha(fecha) {
      // Devuelve el nombre del día en español en mayúsculas (ej: 'LUNES')
      const diasES = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
      
      // Parsear fecha sin conversión de timezone
      if (typeof fecha === 'string') {
        const [year, month, day] = fecha.split('-').map(Number);
        const d = new Date(year, month - 1, day);
        const diaNumero = d.getDay();
        const diaNombre = diasES[diaNumero];
        
        console.log('🔍 getDiaSemanaFromFecha:', {
          fechaString: fecha,
          year, month, day,
          dateCreado: d.toString(),
          diaNumero: diaNumero,
          diaNombre: diaNombre
        });
        
        return diaNombre;
      }
      
      // Si ya es un objeto Date, usarlo directamente
      return diasES[fecha.getDay()];
    }

    // Función para calcular el rango de semana (lunes a sábado) de una fecha dada
    function getWeekRange(dateString) {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado
      
      // Calcular cuántos días hay que restar para llegar al lunes
      // Si es domingo (0), restar 6 días; si es lunes (1), restar 0; etc.
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      // Calcular la fecha del lunes de esta semana
      const monday = new Date(year, month - 1, day);
      monday.setDate(monday.getDate() - daysToMonday);
      
      // Calcular la fecha del sábado de esta semana (lunes + 5 días)
      const saturday = new Date(monday);
      saturday.setDate(monday.getDate() + 5);
      
      // Convertir a strings en formato YYYY-MM-DD
      const formatDate = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dy = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dy}`;
      };
      
      const mondayStr = formatDate(monday);
      const saturdayStr = formatDate(saturday);
      
      console.log('📆 Calculando rango de semana:', {
        fechaSeleccionada: dateString,
        diaDeLaSemana: dayOfWeek,
        diasHastaLunes: daysToMonday,
        lunesDeEstaSemana: mondayStr,
        sabadoDeEstaSemana: saturdayStr
      });
      
      return { start: mondayStr, end: saturdayStr };
    }

    function pintarClasesEnTabla(tabla, clases, labNumber) {
      // Clonar la tabla para no mutar el estado original
      const nuevaTabla = tabla.map(row => [...row]);
      console.log(`\n=== 🎨 PINTANDO CLASES PARA LAB ${labNumber} ===`);
      console.log('📅 Fecha seleccionada:', selectedDateString);
      console.log('� Modo de vista:', viewMode);
      console.log('�📚 Total de clases aprobadas:', clases.length);
      
      clases.forEach((clase, index) => {
        console.log(`\n--- 🔍 Procesando clase ${index + 1}/${clases.length} ---`);
        console.log('📋 Título:', clase.titulo);
        console.log('🔄 Tipo:', clase.tipoSolicitud);
        console.log('🏢 Laboratorio:', clase.laboratorio);
        console.log('📅 Fecha:', clase.fecha);
        console.log('📅 Fecha Término:', clase.fechaTermino);
        console.log('🗓️ Días Semana (raw):', JSON.stringify(clase.diasSemana)); // Usar JSON.stringify para ver el contenido
        console.log('⏰ Hora inicio:', clase.horaInicio);
        console.log('⏰ Hora término:', clase.horaTermino);

        // Verificar que la clase es para este laboratorio
        const labClase = Number(clase.laboratorio?.replace('lab', ''));
        console.log('🔍 Comparando laboratorios: clase es para LAB', labClase, ', pintando en LAB', labNumber);
        if (labClase !== labNumber) {
          console.log('❌ No es para este laboratorio (esperado:', labNumber, ', recibido:', labClase, ')');
          return;
        }
        
        console.log('✅ Laboratorio correcto - CONTINUANDO con validaciones de fecha...');

        // --- VALIDACIÓN DE FECHAS ---
        // Trabajar con strings de fecha para evitar problemas de timezone
        let estaCancelada = false; // Flag para marcar si está cancelada
        
        // Calcular el rango de semana si estamos en modo semanal
        const weekRange = viewMode === 'weekly' ? getWeekRange(selectedDateString) : null;
        console.log(`🔍 Modo de vista: ${viewMode}`, weekRange ? `(Semana: ${weekRange.start} - ${weekRange.end})` : '');
        
        if (clase.tipoSolicitud === 'unica') {
          // Para clases únicas, solo mostrar en la fecha exacta
          // Validar que la fecha exista
          if (!clase.fecha) {
            console.log('❌ Clase única sin fecha');
            return;
          }
          
          console.log('📋 Validando clase ÚNICA:', {
            titulo: clase.titulo,
            fechaClase: clase.fecha,
            fechaSeleccionada: selectedDateString,
            modo: viewMode,
            rangoSemana: weekRange
          });
          
          // En modo diario: comparar fecha exacta
          // En modo semanal: verificar que la fecha esté dentro de la semana
          let fechaValida = false;
          if (viewMode === 'daily') {
            fechaValida = clase.fecha === selectedDateString;
            console.log(`Modo diario: ${clase.fecha} === ${selectedDateString} = ${fechaValida}`);
          } else {
            fechaValida = clase.fecha >= weekRange.start && clase.fecha <= weekRange.end;
            console.log(`Modo semanal: ${clase.fecha} en rango [${weekRange.start}, ${weekRange.end}] = ${fechaValida}`);
          }
          
          if (!fechaValida) {
            console.log('❌ Fecha no válida para este modo de vista');
            return;
          }
          
          console.log('✅ Fecha válida - clase única será visible');
          
          // Verificar si la clase única fue cancelada
          const cancelaciones = clase.clasesCanceladas || clase.cancelaciones || [];
          if (cancelaciones.length > 0) {
            console.log(`🔍 Verificando cancelaciones para clase única "${clase.titulo}":`, cancelaciones);
            const cancelada = cancelaciones.some(c => {
              // La fecha puede venir en c.fecha o c.fechaEspecifica
              const fechaCancelStr = c.fecha || c.fechaEspecifica;
              if (!fechaCancelStr) return false;
              
              // Comparar strings directamente en formato YYYY-MM-DD
              const fechaCancelFormat = fechaCancelStr.split('T')[0];
              const coincide = fechaCancelFormat === clase.fecha;
              console.log(`Comparando cancelación: ${fechaCancelFormat} vs ${clase.fecha} = ${coincide}`);
              return coincide;
            });
            
            if (cancelada) {
              estaCancelada = true; // Marcar como cancelada en lugar de return
              console.log('⚠️ CLASE MARCADA COMO CANCELADA:', clase.titulo);
            }
          }
          
        } else if (clase.tipoSolicitud === 'recurrente') {
          // Para clases recurrentes, validar rango de fechas Y día de semana
          // Validar que las fechas existan
          if (!clase.fecha) {
            console.log('❌ Clase recurrente sin fecha de inicio');
            return;
          }
          
          // Comparar strings de fechas directamente
          const fechaInicioStr = clase.fecha;
          const fechaTerminoStr = clase.fechaTermino || clase.fecha;
          
          console.log('🔄 Validando clase RECURRENTE:', {
            titulo: clase.titulo,
            modo: viewMode,
            fechaSeleccionada: selectedDateString,
            rangoSemana: weekRange,
            fechaInicio: fechaInicioStr,
            fechaTermino: fechaTerminoStr,
            diasSemana: clase.diasSemana
          });
          
          // En modo diario: verificar que selectedDate esté dentro del rango de la clase
          // En modo semanal: verificar que haya solapamiento entre la semana seleccionada y el rango de la clase
          let rangoValido = false;
          if (viewMode === 'daily') {
            rangoValido = selectedDateString >= fechaInicioStr && selectedDateString <= fechaTerminoStr;
            console.log(`Modo diario: ${selectedDateString} en [${fechaInicioStr}, ${fechaTerminoStr}] = ${rangoValido}`);
          } else {
            // Verificar si hay solapamiento entre la semana y el rango de la clase
            rangoValido = !(weekRange.end < fechaInicioStr || weekRange.start > fechaTerminoStr);
            console.log(`Modo semanal: semana [${weekRange.start}, ${weekRange.end}] solapa con clase [${fechaInicioStr}, ${fechaTerminoStr}] = ${rangoValido}`);
          }
          
          if (!rangoValido) {
            console.log('❌ Fecha/semana fuera del rango de la clase');
            return;
          }
          
          // En modo diario: validar que selectedDate sea un día de clase
          // En modo semanal: la clase se mostrará en todos sus días de la semana que caigan dentro del rango
          if (viewMode === 'daily') {
            const diaSemanaSeleccionado = getDiaSemanaFromFecha(selectedDateString);
            
            // Normalizar ambos lados: eliminar acentos de los días de la clase Y del día seleccionado
            const diasSemanaFormateados = clase.diasSemana.map(d => 
              d.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            );
            
            const diaSemanaSeleccionadoNormalizado = diaSemanaSeleccionado
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, ''); // Eliminar acentos del día seleccionado también
            
            console.log('🗓️ Validando día de semana (modo diario):', {
              diaSeleccionadoOriginal: diaSemanaSeleccionado,
              diaSeleccionadoNormalizado: diaSemanaSeleccionadoNormalizado,
              diasClaseOriginales: clase.diasSemana,
              diasClaseFormateados: diasSemanaFormateados,
              coincide: diasSemanaFormateados.includes(diaSemanaSeleccionadoNormalizado)
            });
            
            if (!diasSemanaFormateados.includes(diaSemanaSeleccionadoNormalizado)) {
              console.log('❌ No es un día de clase recurrente');
              return;
            }
            
            console.log('✅ Clase recurrente válida para este día');
            
            // Verificar si esta fecha específica de la clase recurrente fue cancelada
            const cancelaciones = clase.clasesCanceladas || clase.cancelaciones || [];
            if (cancelaciones.length > 0) {
              console.log('🔍 Verificando cancelaciones para clase recurrente:', cancelaciones);
              const cancelada = cancelaciones.some(c => {
                // La fecha puede venir en c.fecha o c.fechaEspecifica
                const fechaCancelStr = c.fecha || c.fechaEspecifica;
                if (!fechaCancelStr) return false;
                
                // Comparar strings directamente en formato YYYY-MM-DD
                const fechaCancelFormat = fechaCancelStr.split('T')[0];
                const coincide = fechaCancelFormat === selectedDateString;
                console.log(`Comparando cancelación recurrente: ${fechaCancelFormat} vs ${selectedDateString} = ${coincide}`);
                return coincide;
              });
              
              if (cancelada) {
                estaCancelada = true; // Marcar como cancelada en lugar de return
                console.log('⚠️ Esta fecha de la clase recurrente fue cancelada - se pintará con marca de CANCELADA');
              }
            }
          } else {
            // En modo semanal, no validamos el día específico aquí
            // La clase se pintará en todos sus días de la semana
            console.log('✅ Modo semanal - la clase se mostrará en sus días correspondientes');
          }
          
          // console.log('✅ Día válido');
        }

        // --- DETERMINAR DÍA DE LA TABLA (MODIFICADO PARA MODO SEMANAL) ---
        // En modo diario: usar la fecha como antes
        // En modo semanal: para clases recurrentes, pintar en TODOS sus días de la semana
        
        console.log(`🎯 Antes de decidir cómo pintar - viewMode: ${viewMode}, tipo: ${clase.tipoSolicitud}`);
        
        // MODO SEMANAL - Pintar clases recurrentes en todos sus días
        if (viewMode === 'weekly' && clase.tipoSolicitud === 'recurrente') {
          console.log('🚀 ENTRANDO EN MODO SEMANAL RECURRENTE');
          if (!weekRange) {
            console.error('❌ weekRange es null en modo semanal!');
            return;
          }
          // Para clases recurrentes en modo semanal, pintar en cada día especificado
          const diasSemanaFormateados = clase.diasSemana.map(d => 
            d.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          );
          
          console.log(`🗓️ Modo semanal - pintando clase recurrente en días: ${diasSemanaFormateados.join(', ')}`);
          
          diasSemanaFormateados.forEach(diaClase => {
            const diaIndexClase = dias.map(d => 
              d.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            ).indexOf(diaClase);
            
            if (diaIndexClase === -1) {
              console.warn(`❌ Día no encontrado en tabla: ${diaClase}`);
              return;
            }
            
            // Calcular la fecha específica de este día en la semana actual
            const diasDesdeInicio = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO']
              .map(d => d.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
              .indexOf(diaClase);
            
            const [yearStart, monthStart, dayStart] = weekRange.start.split('-').map(Number);
            const fechaEspecifica = new Date(yearStart, monthStart - 1, dayStart);
            fechaEspecifica.setDate(fechaEspecifica.getDate() + diasDesdeInicio);
            
            const formatDateStr = (d) => {
              const y = d.getFullYear();
              const m = String(d.getMonth() + 1).padStart(2, '0');
              const dy = String(d.getDate()).padStart(2, '0');
              return `${y}-${m}-${dy}`;
            };
            
            const fechaEspecificaStr = formatDateStr(fechaEspecifica);
            
            // Verificar que esta fecha específica esté dentro del rango de la clase
            if (fechaEspecificaStr < clase.fecha || fechaEspecificaStr > (clase.fechaTermino || clase.fecha)) {
              console.log(`❌ Fecha ${fechaEspecificaStr} (${diaClase}) está fuera del rango de la clase`);
              return;
            }
            
            // Verificar si esta fecha específica está cancelada
            let estaCanceladaEspecifica = false;
            const cancelaciones = clase.clasesCanceladas || clase.cancelaciones || [];
            if (cancelaciones.length > 0) {
              estaCanceladaEspecifica = cancelaciones.some(c => {
                const fechaCancelStr = c.fecha || c.fechaEspecifica;
                if (!fechaCancelStr) return false;
                const fechaCancelFormat = fechaCancelStr.split('T')[0];
                return fechaCancelFormat === fechaEspecificaStr;
              });
            }
            
            console.log(`✅ Pintando en ${dias[diaIndexClase]} (columna ${diaIndexClase + 1}) - fecha: ${fechaEspecificaStr}${estaCanceladaEspecifica ? ' [CANCELADA]' : ''}`);
            
            // Abreviar nombre del profesor
            let profe = '';
            if (clase.profesorNombre) {
              const partes = clase.profesorNombre.trim().split(' ');
              const nombre = partes[0] ? partes[0][0].toUpperCase() + partes[0].slice(1).toLowerCase() : '';
              const apellido = partes[1] ? partes[1][0].toUpperCase() + '.' : '';
              profe = nombre + (apellido ? ' ' + apellido : '');
            }

            // Construir nombre de la clase, agregando carrera y "CANCELADA" si aplica
            let nombreClaseEspecifica = `${clase.titulo || clase.descripcion || 'Clase'}${profe ? ' - ' + profe : ''}${clase.carrera ? ' [' + clase.carrera + ']' : ''}`;
            if (estaCanceladaEspecifica) {
              nombreClaseEspecifica = `❌ CANCELADA - ${nombreClaseEspecifica}`;
            }
            
            // Pintar en este día de la tabla
            const horaInicio = (clase.horaInicio || '').trim();
            const horaTermino = (clase.horaTermino || '').trim();
            
            if (!horaInicio || !horaTermino) {
              console.warn('❌ Faltan horas en clase');
              return;
            }
            
            // Pintar todos los bloques en el rango
            let dentroRango = false;
            for (let i = 0; i < horas.length; i++) {
              const [bloqueInicio, bloqueFin] = horas[i].split('-');
              
              // Empezar a pintar
              if (bloqueInicio === horaInicio) {
                dentroRango = true;
              }
              
              // Pintar si estamos en el rango
              if (dentroRango) {
                const celdaActual = nuevaTabla[i][diaIndexClase + 1];
                
                // Verificar si la celda tiene contenido manual
                let esManual = false;
                try {
                  if (celdaActual && celdaActual.trim().startsWith('{')) {
                    const data = JSON.parse(celdaActual);
                    if (data.content && !data.auto) {
                      esManual = true;
                      console.log(`⚠️ Celda ${i} tiene contenido manual, se respeta: "${data.content}"`);
                    }
                  }
                } catch (e) {
                  if (celdaActual && celdaActual.trim() !== '') {
                    esManual = true;
                    console.log(`⚠️ Celda ${i} tiene contenido manual (texto plano), se respeta: "${celdaActual}"`);
                  }
                }
                
                // Solo pintar si NO es manual
                if (!esManual) {
                  nuevaTabla[i][diaIndexClase + 1] = JSON.stringify({
                    content: nombreClaseEspecifica,
                    auto: true,
                    cancelada: estaCanceladaEspecifica,
                    solicitudId: clase.id,
                    date: fechaEspecificaStr
                  });
                  console.log(`✅ Pintado bloque ${i}: ${horas[i]}${estaCanceladaEspecifica ? ' (CANCELADA)' : ''}`);
                }
                
                // Terminar de pintar DESPUÉS de pintar este bloque
                if (bloqueFin === horaTermino) {
                  break;
                }
              }
            }
          });
          
          // En modo semanal recurrente, ya pintamos todo en el forEach, así que no seguir
          console.log('✅ Terminado de pintar clase recurrente en modo semanal');
          return;
        }
        
        console.log('📍 Continuando con flujo normal (modo diario o clase única)');
        
        // MODO DIARIO o CLASE ÚNICA (ambos modos)
        // Para clases únicas, usar la fecha de la clase directamente
        // Para clases recurrentes en modo diario, usar la fecha seleccionada
        const fechaParaDia = clase.tipoSolicitud === 'unica' ? clase.fecha : selectedDateString;
        const diaSemana = getDiaSemanaFromFecha(fechaParaDia);
        const diaIndex = dias.indexOf(diaSemana);
        
        console.log('🗓️ DEBUG - Determinando día de tabla:', {
          titulo: clase.titulo,
          tipo: clase.tipoSolicitud,
          fechaClase: clase.fecha,
          fechaSeleccionada: selectedDateString,
          fechaUsadaParaDia: fechaParaDia,
          diaSemanaCalculado: diaSemana,
          diaIndex: diaIndex,
          columnaDia: dias[diaIndex]
        });
        
        if (diaIndex === -1) {
          console.warn('❌ Día no encontrado en tabla:', diaSemana);
          return;
        }

        // --- PINTAR EN LA TABLA ---
        const horaInicio = (clase.horaInicio || '').trim();
        const horaTermino = (clase.horaTermino || '').trim();
        
        if (!horaInicio || !horaTermino) {
          console.warn('❌ Faltan horas en clase');
          return;
        }

        // console.log('Pintando desde', horaInicio, 'hasta', horaTermino);

        // Abreviar nombre del profesor
        let profe = '';
        if (clase.profesorNombre) {
          const partes = clase.profesorNombre.trim().split(' ');
          const nombre = partes[0] ? partes[0][0].toUpperCase() + partes[0].slice(1).toLowerCase() : '';
          const apellido = partes[1] ? partes[1][0].toUpperCase() + '.' : '';
          profe = nombre + (apellido ? ' ' + apellido : '');
        }

        // Construir nombre de la clase, agregando carrera y "CANCELADA" si aplica
        let nombreClase = `${clase.titulo || clase.descripcion || 'Clase'}${profe ? ' - ' + profe : ''}${clase.carrera ? ' [' + clase.carrera + ']' : ''}`;
        if (estaCancelada) {
          nombreClase = `❌ CANCELADA - ${nombreClase}`;
        }

        // Pintar todos los bloques en el rango
        let dentroRango = false;
        for (let i = 0; i < horas.length; i++) {
          const [bloqueInicio, bloqueFin] = horas[i].split('-');
          
          // Empezar a pintar
          if (bloqueInicio === horaInicio) {
            dentroRango = true;
          }
          
          // Pintar si estamos en el rango
          if (dentroRango) {
            const celdaActual = nuevaTabla[i][diaIndex + 1];
            
            // Verificar si la celda tiene contenido manual (JSON con 'content') o automático (JSON con 'auto')
            let esManual = false;
            try {
              if (celdaActual && celdaActual.trim().startsWith('{')) {
                const data = JSON.parse(celdaActual);
                // Si tiene 'content' y NO tiene 'auto', es manual
                if (data.content && !data.auto) {
                  esManual = true;
                  console.log(`⚠️ Celda ${i} tiene contenido manual, se respeta: "${data.content}"`);
                }
              }
            } catch (e) {
              // Si no es JSON, verificar si tiene contenido de texto plano
              if (celdaActual && celdaActual.trim() !== '') {
                esManual = true;
                console.log(`⚠️ Celda ${i} tiene contenido manual (texto plano), se respeta: "${celdaActual}"`);
              }
            }
            
            // Solo pintar si NO es manual
            if (!esManual) {
              // Marcar como contenido automático
              // En modo semanal, usar fechaParaDia para que cada clase tenga su fecha correcta
              nuevaTabla[i][diaIndex + 1] = JSON.stringify({
                content: nombreClase,
                auto: true,
                cancelada: estaCancelada, // Marcar si está cancelada
                solicitudId: clase.id,
                date: fechaParaDia // Usar fechaParaDia en lugar de selectedDateString
              });
              console.log(`✅ Pintado bloque ${i}: ${horas[i]} - Fecha: ${fechaParaDia}${estaCancelada ? ' (CANCELADA)' : ''}`);
            }
            
            // Terminar de pintar DESPUÉS de pintar este bloque
            if (bloqueFin === horaTermino) {
              // console.log('🛑 Fin del rango de pintado');
              break;
            }
          }
        }
      });
      
      return nuevaTabla;
    }

    // No sobrescribir si hay cambios locales sin guardar
    // Leer hasChanges sin que sea dependencia para evitar loops
    const shouldUpdate = !hasChanges;
    
    console.log('🔍 Estado de actualización:', {
      shouldUpdate,
      hasChanges,
      horarios: !!horarios,
      clasesAprobadas: clasesAprobadas?.length || 0
    });
    
    if (!shouldUpdate) {
      console.log('⚠️ Hay cambios sin guardar, no se sobrescriben las tablas');
      return;
    }

    if (horarios) {
      // Primero cargar los horarios guardados manualmente (si existen)
      let tabla1 = horarios.lab1 || generarTablaInicial();
      let tabla2 = horarios.lab2 || generarTablaInicial();
      let tabla3 = horarios.lab3 || generarTablaInicial();

      console.log('🔍 Verificando clases aprobadas:', {
        existe: !!clasesAprobadas,
        cantidad: clasesAprobadas?.length || 0,
        clases: clasesAprobadas,
        viewMode: viewMode,
        selectedDate: selectedDateString
      });

      if (clasesAprobadas && clasesAprobadas.length > 0) {
        console.log('✅ Procesando clases aprobadas para fecha:', selectedDate);
        
        // Pintar las clases aprobadas ENCIMA de los horarios guardados
        tabla1 = pintarClasesEnTabla(tabla1, clasesAprobadas, 1);
        tabla2 = pintarClasesEnTabla(tabla2, clasesAprobadas, 2);
        tabla3 = pintarClasesEnTabla(tabla3, clasesAprobadas, 3);
      } else {
        console.log('❌ NO hay clases aprobadas para pintar');
      }
      
      setLab1(tabla1);
      setLab2(tabla2);
      setLab3(tabla3);
      adjustAllTextareas();
    } else {
      setLab1(generarTablaInicial());
      setLab2(generarTablaInicial());
      setLab3(generarTablaInicial());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [horarios, clasesAprobadas, selectedDateString, viewMode, adjustAllTextareas]); // Agregar viewMode a las dependencias

  const handleSave = async () => {
    if (!isAdmin) {
      Swal.fire({
        title: "Acceso denegado",
        text: "Solo los administradores pueden guardar horarios.",
        icon: "error",
        confirmButtonText: "Aceptar",
      });
      return;
    }

    try {
      // Usar el hook para guardar (ahora es async como refreshReservations)
      await saveHorarios(lab1, lab2, lab3, user);
      setHasChanges(false);
      
      Swal.fire({
        title: "✅ Guardado exitoso",
        text: "Los horarios han sido actualizados y sincronizados en todos los dispositivos.",
        icon: "success",
        confirmButtonText: "Aceptar",
        timer: 2000,
        timerProgressBar: true
      });
    } catch (error) {
      // El error ya se maneja en el hook
      setHasChanges(true); // Mantener los cambios si hubo error
    }
  };

  const handleClear = async () => {
    if (!isAdmin) return;
    
    Swal.fire({
      title: "¿Limpiar todos los horarios?",
      text: "Esta acción eliminará toda la información de horarios. ¿Está seguro?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, limpiar",
      cancelButtonText: "Cancelar"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Generar tablas completamente vacías
          const tablasVacias = generarTablaInicial();
          
          // Verificar que las tablas estén realmente vacías
          // console.log('Tablas vacías generadas:', tablasVacias);
          
          // Limpiar localStorage primero
          localStorage.removeItem("horarios");
          // console.log('LocalStorage limpiado');
          
          // Actualizar estado local
          setLab1(tablasVacias);
          setLab2(tablasVacias);
          setLab3(tablasVacias);
          
          // Guardar inmediatamente para evitar problemas de sincronización
          await saveHorarios(tablasVacias, tablasVacias, tablasVacias, user);
          
          // Forzar refresco de todas las textareas
          setTimeout(() => {
            adjustAllTextareas();
            // Limpiar manualmente todas las textareas visibles
            document.querySelectorAll('.editable-cell').forEach(textarea => {
              if (textarea.value.trim() !== '') {
                textarea.value = '';
                textarea.classList.remove('long-text');
              }
            });
          }, 100);
          
          setHasChanges(false); // Ya se guardó
          
          Swal.fire(
            "✅ Limpiado y Guardado",
            "Los horarios han sido completamente limpiados y guardados.",
            "success"
          );
          
        } catch (error) {
          console.error('Error al limpiar horarios:', error);
          
          Swal.fire(
            "❌ Error",
            "Hubo un problema al limpiar los horarios. Intente nuevamente.",
            "error"
          );
          
          // En caso de error, marcar cambios pendientes
          setHasChanges(true);
        }
      }
    });
  };

  // Función de reset completo para casos extremos
  const handleForceReset = () => {
    if (!isAdmin) return;
    
    Swal.fire({
      title: "🔄 Reset Completo del Sistema",
      text: "Esto limpiará TODO: localStorage, estado y forzará recarga. Solo para debugging.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Reset Completo",
      cancelButtonText: "Cancelar"
    }).then((result) => {
      if (result.isConfirmed) {
        // Limpiar todo
        localStorage.removeItem("horarios");
        sessionStorage.clear();
        
        // Recargar página completa
        window.location.reload();
      }
    });
  };

  // Función para actualizar horarios con clases aprobadas
  // FUNCIÓN ELIMINADA POR SOLICITUD DEL USUARIO

  const laboratorios = [
    { nombre: "CLASES LABORATORIO 1", data: lab1, setData: setLab1 },
    { nombre: "CLASES LABORATORIO 2", data: lab2, setData: setLab2 },
    { nombre: "CLASES LABORATORIO 3", data: lab3, setData: setLab3 }
  ];

  // Filtrar laboratorios según la prop
  const laboratoriosAMostrar = laboratorio 
    ? [laboratorios[laboratorio - 1]] // Mostrar solo el laboratorio específico (laboratorio es 1-indexed)
    : laboratorios; // Mostrar todos los laboratorios

  // Exponer métodos al componente padre mediante ref
  useImperativeHandle(ref, () => ({
    handleSave,
    handleClear,
    hasChanges,
    isLoading
  }), [hasChanges, isLoading]);

  const handleCellChange = useCallback((labIndex, rowIndex, colIndex, value) => {
    // Verificar rol primero
    if (!isAdmin) {
      Swal.fire({
        title: "Acceso denegado",
        text: "Solo los administradores pueden modificar horarios.",
        icon: "error",
        confirmButtonText: "Aceptar",
      });
      return;
    }
    
    // Seguridad para asegurar que datos existen
    try {
      const lab = laboratorios[labIndex];
      
      // Si el array no existe o está mal formado, inicializar
      if (!lab.data || !Array.isArray(lab.data) || lab.data.length === 0) {
        console.warn(`Datos del laboratorio ${labIndex} estaban vacíos o inválidos, reinicializando`);
        lab.setData(generarTablaInicial());
        return; // Salir y esperar a que el useEffect actualice los datos
      }
      
      // Actualizar la celda con información de fecha
      const newData = [...lab.data];
      if (value.trim() !== '') {
        // Si se está agregando contenido, guardarlo con la fecha
        newData[rowIndex][colIndex] = JSON.stringify({
          content: value,
          date: selectedDateString
        });
      } else {
        // Si se está borrando, guardar string vacío
        newData[rowIndex][colIndex] = '';
      }
      lab.setData(newData);
      setHasChanges(true);
    } catch (error) {
      console.error('Error al modificar celda:', error);
      // Mostrar mensaje de error pero no bloquear la aplicación
      Swal.fire({
        title: "Error al editar",
        text: "Hubo un problema al modificar la celda. Intente recargar la página.",
        icon: "warning",
        confirmButtonText: "Aceptar",
      });
    }
  }, [isAdmin, laboratorios]);

  return (
    <div className="horario-container">
      {/* Información de última modificación */}
      {lastModified && (
        <div className="last-modified-info">
          <p>
            <span>Última actualización:</span> {new Date(lastModified).toLocaleString('es-CL')}
            {modifiedBy && <span> por <span>{modifiedBy}</span></span>}
            {isLoading && <span>🔄 Sincronizando...</span>}
          </p>
        </div>
      )}
      
      <div className="space-y-8">
        {laboratoriosAMostrar.map((lab, index) => {
          // Obtener el índice real del laboratorio en el array original
          const labIndex = laboratorio ? laboratorio - 1 : index;
          
          return (
            <div key={labIndex} className="lab-section">
              <h2 className="lab-title">{lab.nombre}</h2>
            
            {/* Vista de tabla para pantallas grandes */}
            <div className="table-responsive desktop-view">
              <table className="horario-table">
                <thead>
                  <tr>
                    <th className="hora-column">HORARIO</th>
                    {dias.map((dia, idx) => (
                      <th key={idx} className="pc-column">{dia}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lab.data.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, colIndex) => (
                        <td key={colIndex} className={colIndex === 0 ? "hora-cell" : "data-cell"}>
                          {colIndex === 0 ? (
                            <span className="hora-text">{cell}</span>
                          ) : (
                            <textarea
                              value={(() => {
                                try {
                                  if (!cell) return '';
                                  const parsed = JSON.parse(cell);
                                  
                                  // En modo semanal, mostrar si la fecha está dentro del rango de la semana
                                  // En modo diario, mostrar solo si la fecha coincide exactamente
                                  if (viewMode === 'weekly') {
                                    // Calcular el rango de la semana
                                    const [year, month, day] = selectedDateString.split('-').map(Number);
                                    const date = new Date(year, month - 1, day);
                                    const dayOfWeek = date.getDay();
                                    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                                    
                                    const monday = new Date(year, month - 1, day);
                                    monday.setDate(monday.getDate() - daysToMonday);
                                    
                                    const saturday = new Date(monday);
                                    saturday.setDate(monday.getDate() + 5);
                                    
                                    const formatDate = (d) => {
                                      const y = d.getFullYear();
                                      const m = String(d.getMonth() + 1).padStart(2, '0');
                                      const dy = String(d.getDate()).padStart(2, '0');
                                      return `${y}-${m}-${dy}`;
                                    };
                                    
                                    const mondayStr = formatDate(monday);
                                    const saturdayStr = formatDate(saturday);
                                    
                                    // Mostrar si la fecha de la clase está dentro de la semana
                                    if (parsed.date >= mondayStr && parsed.date <= saturdayStr) {
                                      return parsed.content || '';
                                    }
                                  } else {
                                    // Modo diario: mostrar solo si la fecha coincide exactamente
                                    if (parsed.date === selectedDateString) {
                                      return parsed.content || '';
                                    }
                                  }
                                  return '';
                                } catch {
                                  // Si no es JSON (contenido antiguo), mostrar directamente
                                  const cleanCell = cell ? String(cell).replace(/^\d{1,2}:\d{2}\s*-\d{1,2}:\d{2}\s*/, '') : '';
                                  return cleanCell;
                                }
                              })()}
                              onChange={(e) => {
                                handleCellChange(labIndex, rowIndex, colIndex, e.target.value);
                              }}
                              className={`editable-cell ${!isAdmin ? 'readonly' : ''} ${isLongText(cell) ? 'long-text' : ''}`}
                              readOnly={!isAdmin}
                              placeholder={isAdmin ? "Asignatura..." : ""}
                              title={cell || (!isAdmin ? "Solo lectura - Contacte al administrador para modificar" : "")}
                            />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista de cards para móviles */}
            <div className="mobile-view">
              {lab.data.map((row, rowIndex) => (
                <div key={rowIndex} className="horario-card">
                  <div className="card-header">
                    <h4 className="hora-mobile">{row[0]}</h4>
                  </div>
                  <div className="card-content">
                    {dias.map((dia, diaIndex) => (
                      <div key={diaIndex} className="dia-row">
                        <label className="dia-label">{dia}</label>
                        <textarea
                          value={(() => {
                            try {
                              if (!row[diaIndex + 1]) return '';
                              const parsed = JSON.parse(row[diaIndex + 1]);
                              
                              // En modo semanal, mostrar si la fecha está dentro del rango de la semana
                              // En modo diario, mostrar solo si la fecha coincide exactamente
                              if (viewMode === 'weekly') {
                                // Calcular el rango de la semana
                                const [year, month, day] = selectedDateString.split('-').map(Number);
                                const date = new Date(year, month - 1, day);
                                const dayOfWeek = date.getDay();
                                const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                                
                                const monday = new Date(year, month - 1, day);
                                monday.setDate(monday.getDate() - daysToMonday);
                                
                                const saturday = new Date(monday);
                                saturday.setDate(monday.getDate() + 5);
                                
                                const formatDate = (d) => {
                                  const y = d.getFullYear();
                                  const m = String(d.getMonth() + 1).padStart(2, '0');
                                  const dy = String(d.getDate()).padStart(2, '0');
                                  return `${y}-${m}-${dy}`;
                                };
                                
                                const mondayStr = formatDate(monday);
                                const saturdayStr = formatDate(saturday);
                                
                                // Mostrar si la fecha de la clase está dentro de la semana
                                if (parsed.date >= mondayStr && parsed.date <= saturdayStr) {
                                  return parsed.content || '';
                                }
                              } else {
                                // Modo diario: mostrar solo si la fecha coincide exactamente
                                if (parsed.date === selectedDateString) {
                                  return parsed.content || '';
                                }
                              }
                              return '';
                            } catch {
                              // Si no es JSON (contenido antiguo), mostrar directamente
                              const cleanCell = row[diaIndex + 1] ? String(row[diaIndex + 1]).replace(/^\d{1,2}:\d{2}\s*-\d{1,2}:\d{2}\s*/, '') : '';
                              return cleanCell;
                            }
                          })()}
                          onChange={(e) => {
                            handleCellChange(labIndex, rowIndex, diaIndex + 1, e.target.value);
                          }}
                          className={`editable-cell mobile-input ${!isAdmin ? 'readonly' : ''} ${isLongText(row[diaIndex + 1]) ? 'long-text' : ''}`}
                          readOnly={!isAdmin}
                          placeholder={isAdmin ? "Asignatura..." : ""}
                          title={row[diaIndex + 1] || ""}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          );
        })}
      </div>
      
      {/* Los botones se renderizan donde se llame renderButtons */}
      {isAdmin && !renderButtons && (
        <div className="save-section mt-6">
          <div className="button-group flex gap-3 justify-center">
            <button 
              onClick={handleSave} 
              className={`save-button ${hasChanges ? 'has-changes' : ''}`}
              disabled={!hasChanges || isLoading}
            >
              {isLoading ? '⏳ Guardando...' : hasChanges ? '💾 Guardar Cambios' : '✅ Guardado'}
            </button>
            <button 
              onClick={handleClear} 
              className="clear-button"
              disabled={isLoading}
            >
              🗑️ Limpiar y Guardar
            </button>
          </div>
          {hasChanges && (
            <p className="text-center text-orange-600 mt-2 text-sm">
              ⚠️ Hay cambios sin guardar
            </p>
          )}
        </div>
      )}
      
      {/*  */}
    </div>
  );
});

HorarioLaboratorios.displayName = 'HorarioLaboratorios';

export default HorarioLaboratorios;

