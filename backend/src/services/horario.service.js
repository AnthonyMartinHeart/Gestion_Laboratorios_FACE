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
    "20:00": 16
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
        "17:10 -17:50", "17:50 -18:30", "18:40 -19:20", "19:20 -20:00",
        "20:00 -20:50"
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
      
      // NO integrar clases en el backend - el frontend se encarga del filtrado por fecha
      
      // Crear el registro en la base de datos para evitar generarlo en cada consulta
      try {
        const newHorario = repo.create({
          data: initialData,
          lastModified: new Date(),
          modifiedBy: 'Sistema'
        });
        
        await repo.save(newHorario);
        console.log('Horario inicial creado en la base de datos');
      } catch (dbError) {
        console.error('Error al crear horario inicial:', dbError);
        // Si hay error al guardar, continuamos retornando los datos iniciales
      }
      
      return [initialData, null];
    }
    
    // Devolver solo los horarios base sin integrar clases
    // El frontend se encargará de pintar las clases según la fecha seleccionada
    return [horario.data, null];
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
