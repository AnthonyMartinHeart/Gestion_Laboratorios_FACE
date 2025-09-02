"use strict";
import Horario from "../entity/horario.entity.js";
import { AppDataSource } from "../config/configDb.js";

// Función para formatear nombre: iniciales + apellido
function formatearNombreProfesor(nombreCompleto) {
  if (!nombreCompleto) return "";
  
  const partes = nombreCompleto.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].substring(0, 8); // Solo un nombre
  
  // Si hay al menos 2 partes, usar primera inicial + apellido(s)
  const primerNombre = partes[0];
  const apellidos = partes.slice(1);
  
  // Crear iniciales del primer nombre
  const inicial = primerNombre.charAt(0).toUpperCase() + ".";
  
  // Tomar los apellidos y limitarlos a máximo 12 caracteres
  const apellidosStr = apellidos.join(" ");
  const apellidosCortos = apellidosStr.length > 12 ? apellidosStr.substring(0, 12) + "..." : apellidosStr;
  
  return `${inicial} ${apellidosCortos}`;
}

// Función para mapear horarios a índices de tabla
function mapearHorarioAIndice(horaInicio) {
  const mapaHorarios = {
    "08:10": 0, "08:50": 1, "09:40": 2, "10:20": 3,
    "11:10": 4, "11:50": 5, "12:40": 6, "13:20": 7,
    "14:10": 8, "14:50": 9, "15:40": 10, "16:20": 11,
    "17:10": 12, "17:50": 13, "18:40": 14, "19:20": 15,
    "20:50": 16
  };
  return mapaHorarios[horaInicio] ?? -1;
}

// Función para mapear día de semana a índice de columna
function mapearDiaAIndice(diaSemana) {
  const mapaDias = {
    1: 1, // Lunes
    2: 2, // Martes  
    3: 3, // Miércoles
    4: 4, // Jueves
    5: 5, // Viernes
    6: 6  // Sábado
  };
  return mapaDias[diaSemana] ?? -1;
}

// Función para generar fechas específicas de solicitudes recurrentes
function generarFechasRecurrentes(fechaInicio, fechaTermino, diasSemana) {
  const fechas = [];
  const inicio = new Date(fechaInicio);
  const termino = new Date(fechaTermino);
  
  // Mapear nombres de días a números
  const diasSemanaMap = {
    'lunes': 1, 'martes': 2, 'miercoles': 3, 'miércoles': 3,
    'jueves': 4, 'viernes': 5, 'sabado': 6, 'sábado': 6
  };
  
  const diasNumeros = diasSemana.map(dia => diasSemanaMap[dia.toLowerCase()]).filter(d => d !== undefined);
  
  const fechaActual = new Date(inicio);
  while (fechaActual <= termino) {
    const diaSemana = fechaActual.getDay();
    if (diasNumeros.includes(diaSemana)) {
      fechas.push(new Date(fechaActual));
    }
    fechaActual.setDate(fechaActual.getDate() + 1);
  }
  
  return fechas;
}

// Función para integrar clases aprobadas en los horarios
async function integrarClasesAprobadas(horariosBase) {
  try {
    const solicitudRepository = AppDataSource.getRepository("Solicitud");
    const cancelacionRepository = AppDataSource.getRepository("Cancelacion");
    
    // Obtener todas las solicitudes aprobadas
    const solicitudesAprobadas = await solicitudRepository.find({
      where: { estado: "aprobada" },
      order: { fecha: "ASC" }
    });
    
    // Obtener todas las cancelaciones
    const cancelaciones = await cancelacionRepository.find();
    
    console.log('📚 Integrando clases aprobadas en horarios:', {
      solicitudes: solicitudesAprobadas.length,
      cancelaciones: cancelaciones.length
    });
    
    // Log detallado de todas las solicitudes aprobadas
    solicitudesAprobadas.forEach(s => {
      console.log(`📋 Solicitud ID ${s.id}: ${s.titulo} - ${s.profesorNombre} - ${s.horaInicio}-${s.horaTermino} - Lab: ${s.laboratorio} - Tipo: ${s.tipoSolicitud}`);
    });
    
    // Crear copia de horarios base para no modificar el original
    const horariosConClases = JSON.parse(JSON.stringify(horariosBase));
    
    // Objeto para rastrear clases ya agregadas por posición
    const clasesAgregadas = {};
    
    // Procesar cada solicitud aprobada
    for (const solicitud of solicitudesAprobadas) {
      console.log(`🔍 Procesando solicitud ID: ${solicitud.id}, título: ${solicitud.titulo}, horario: ${solicitud.horaInicio}-${solicitud.horaTermino}, tipo: ${solicitud.tipoSolicitud}`);
      
      const profesorFormateado = formatearNombreProfesor(solicitud.profesorNombre);
      const textoClase = `${solicitud.titulo} - ${profesorFormateado}`;
      
      // Determinar qué laboratorio
      const labKey = solicitud.laboratorio.toLowerCase(); // lab1, lab2, lab3
      if (!horariosConClases[labKey]) {
        console.warn(`Laboratorio ${labKey} no existe en horarios`);
        continue;
      }
      
      // Generar fechas específicas según tipo de solicitud
      let fechasEspecificas = [];
      
      if (solicitud.tipoSolicitud === 'recurrente') {
        fechasEspecificas = generarFechasRecurrentes(
          solicitud.fecha, 
          solicitud.fechaTermino, 
          solicitud.diasSemana || []
        );
        console.log(`📅 Fechas generadas para solicitud ${solicitud.id}:`, fechasEspecificas.map(f => f.toISOString().split('T')[0]));
      } else {
        fechasEspecificas = [new Date(solicitud.fecha)];
        console.log(`📅 Fecha única para solicitud ${solicitud.id}:`, fechasEspecificas[0].toISOString().split('T')[0]);
      }
      
      // Procesar cada fecha específica
      for (const fechaEspecifica of fechasEspecificas) {
        // Verificar si esta fecha específica está cancelada
        const fechaStr = fechaEspecifica.toISOString().split('T')[0];
        const estaCancelada = cancelaciones.some(cancelacion => 
          cancelacion.solicitudId === solicitud.id && 
          cancelacion.fechaEspecifica === fechaStr
        );
        
        if (estaCancelada) {
          console.log(`⚠️ Clase cancelada: ${solicitud.titulo} el ${fechaStr}`);
          continue; // Saltar clases canceladas
        }
        
        // Solo mostrar clases futuras o del día actual
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        if (fechaEspecifica < hoy) {
          continue; // Saltar clases pasadas
        }
        
        // Obtener índices de fila y columna solo para la hora de INICIO
        const filaIndex = mapearHorarioAIndice(solicitud.horaInicio);
        const diaSemana = fechaEspecifica.getDay();
        const columnaIndex = mapearDiaAIndice(diaSemana);
        
        if (filaIndex >= 0 && columnaIndex >= 0) {
          // Crear clave única para esta posición (sin incluir ID de solicitud para evitar duplicados de la misma clase)
          const claveUnica = `${labKey}-${filaIndex}-${columnaIndex}-${solicitud.horaInicio}-${solicitud.horaTermino}-${textoClase}-${fechaStr}`;
          
          // Verificar si ya agregamos esta clase en esta posición para esta fecha
          if (clasesAgregadas[claveUnica]) {
            console.log(`⚠️ Clase ya agregada en esta posición para esta fecha, omitiendo: ${claveUnica}`);
            continue;
          }
          
          // Verificar que los índices sean válidos
          if (horariosConClases[labKey][filaIndex] && horariosConClases[labKey][filaIndex][columnaIndex] !== undefined) {
            const celdaActual = horariosConClases[labKey][filaIndex][columnaIndex];
            
            // Crear el texto con formato: "15:40 -16:20 Clases Metodologia De Desarrollo - M. Elena Gonzal"
            const textoCompleto = `${solicitud.horaInicio} -${solicitud.horaTermino} ${textoClase}`;
            
            console.log(`📝 Agregando a celda [${filaIndex}][${columnaIndex}]: "${textoCompleto}"`);
            console.log(`📝 Contenido actual de la celda: "${celdaActual}"`);
            
            // Si la celda ya tiene contenido manual, agregamos la clase con separador
            if (celdaActual && celdaActual.trim() !== "" && !celdaActual.includes("Asignatura")) {
              // Verificar si ya existe este texto exacto para evitar duplicados
              if (!celdaActual.includes(textoCompleto)) {
                horariosConClases[labKey][filaIndex][columnaIndex] = `${celdaActual}\n${textoCompleto}`;
                console.log(`✅ Clase agregada con separador`);
              } else {
                console.log(`⚠️ Clase ya existe en la celda, omitiendo duplicado`);
              }
            } else {
              // Reemplazar completamente la celda (incluso si tiene "Asignatura")
              horariosConClases[labKey][filaIndex][columnaIndex] = textoCompleto;
              console.log(`✅ Clase agregada reemplazando contenido anterior: "${celdaActual}" -> "${textoCompleto}"`);
            }
            
            // Marcar esta clase como agregada
            clasesAgregadas[claveUnica] = true;
            
            console.log(`✅ Clase integrada: ${textoCompleto} en ${labKey}[${filaIndex}][${columnaIndex}] para ${fechaStr}`);
          }
        }
      }
    }
    
    return horariosConClases;
  } catch (error) {
    console.error('Error al integrar clases aprobadas:', error);
    return horariosBase; // Retornar horarios base si hay error
  }
}

export async function getHorariosService() {
  try {
    const repo = AppDataSource.getRepository(Horario);
    // Obtener el horario más reciente (solo debería haber uno)
    const horarios = await repo.find({
      order: { lastModified: "DESC" },
      take: 1
    });
    
    const horario = horarios[0]; // Obtiene el primer elemento (el más reciente) o undefined si no hay registros
    
    if (!horario) {
      // Si no existe, crear estructura inicial con tabla de horarios vacía
      const horas = [
        "08:10 -08:50", "08:50 -09:30", "09:40 -10:20", "10:20 -11:00",
        "11:10 -11:50", "11:50 -12:30", "12:40 -13:20", "13:20 -14:00",
        "14:10 -14:50", "14:50 -15:30", "15:40 -16:20", "16:20 -17:00",
        "17:10 -17:50", "17:50 -18:30", "18:40 -19:10", "19:20 -20:50",
        "20:50 -21:30"
      ];
      
      const dias = ["LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"];
      
      // Generar tabla inicial vacía
      const tablaInicial = horas.map(hora => [hora, ...Array(dias.length).fill("")]);
      
      const initialData = {
        lab1: tablaInicial,
        lab2: tablaInicial,
        lab3: tablaInicial,
        lastModified: new Date().toISOString(),
        modifiedBy: 'Sistema',
        timestamp: Date.now()
      };
      
      // Integrar clases aprobadas en la estructura inicial
      const horariosConClases = await integrarClasesAprobadas(initialData);
      
      // Crear el registro en la base de datos para evitar generarlo en cada consulta
      try {
        const newHorario = repo.create({
          data: horariosConClases,
          lastModified: new Date(),
          modifiedBy: 'Sistema'
        });
        
        await repo.save(newHorario);
        console.log('Horario inicial creado en la base de datos con clases integradas');
      } catch (dbError) {
        console.error('Error al crear horario inicial:', dbError);
        // Si hay error al guardar, continuamos retornando los datos iniciales
      }
      
      return [horariosConClases, null];
    }
    
    // Integrar clases aprobadas en los horarios existentes
    const horariosConClases = await integrarClasesAprobadas(horario.data);
    
    return [horariosConClases, null];
  } catch (error) {
    console.error("Error al obtener horarios:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function saveHorariosService(data, modifiedBy) {
  try {
    const repo = AppDataSource.getRepository(Horario);
    
    // Verificar si ya existe un registro de horarios
    const existingHorarios = await repo.find({
      order: { lastModified: "DESC" },
      take: 1
    });
    const existingHorario = existingHorarios[0]; // Obtiene el primer elemento (el más reciente) o undefined si no hay registros
    
    const horarioData = {
      ...data,
      lastModified: new Date().toISOString(),
      modifiedBy: modifiedBy || 'Administrador',
      timestamp: Date.now()
    };
    
    if (existingHorario) {
      // Actualizar el registro existente
      existingHorario.data = horarioData;
      existingHorario.lastModified = new Date();
      existingHorario.modifiedBy = modifiedBy || 'Administrador';
      
      const saved = await repo.save(existingHorario);
      return [saved.data, null];
    } else {
      // Crear nuevo registro
      const newHorario = repo.create({
        data: horarioData,
        lastModified: new Date(),
        modifiedBy: modifiedBy || 'Administrador'
      });
      
      const saved = await repo.save(newHorario);
      return [saved.data, null];
    }
  } catch (error) {
    console.error("Error al guardar horarios:", error);
    return [null, "Error interno del servidor"];
  }
}
