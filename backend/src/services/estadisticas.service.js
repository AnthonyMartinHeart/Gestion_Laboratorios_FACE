"use strict";
import Reservation from "../entity/reservation.entity.js";
import Turno from "../entity/turno.entity.js";
import { AppDataSource } from "../config/configDb.js";

export async function getEstadisticasGeneralesService(filtros = {}) {
  try {
    const repo = AppDataSource.getRepository(Reservation);
    
    // Construir query base
    let query = repo.createQueryBuilder("r")
      .where("r.carrera != :maintenance", { maintenance: "MAINTENANCE" }); // Excluir mantenimiento

    // Aplicar filtros de fecha
    if (filtros.fechaInicio) {
      query.andWhere("r.fechaReserva >= :fechaInicio", { fechaInicio: filtros.fechaInicio });
    }
    if (filtros.fechaFin) {
      query.andWhere("r.fechaReserva <= :fechaFin", { fechaFin: filtros.fechaFin });
    }
    if (filtros.laboratorio && filtros.laboratorio !== 'todos') {
      query.andWhere("r.labId = :labId", { labId: parseInt(filtros.laboratorio) });
    }

    const reservas = await query.getMany();

    // Calcular estadísticas
    const estadisticas = {
      resumenGeneral: calcularResumenGeneral(reservas),
      usoEquipos: calcularUsoEquipos(reservas),
      horariosActivos: calcularHorariosActivos(reservas),
      diasActivos: calcularDiasActivos(reservas),
      laboratoriosDemanda: calcularDemandaLaboratorios(reservas),
      tendencias: calcularTendencias(reservas)
    };

    return [estadisticas, null];
  } catch (error) {
    console.error("Error calculando estadísticas:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function getEstadisticasEquiposService(labId = null) {
  try {
    const repo = AppDataSource.getRepository(Reservation);
    
    let query = repo.createQueryBuilder("r")
      .select([
        "r.pcId",
        "r.labId", 
        "COUNT(*) as total_uso",
        "COUNT(DISTINCT r.fechaReserva) as dias_utilizados"
      ])
      .where("r.carrera != :maintenance", { maintenance: "MAINTENANCE" })
      .groupBy("r.pcId, r.labId")
      .orderBy("total_uso", "DESC");

    if (labId) {
      query.andWhere("r.labId = :labId", { labId });
    }

    const equipos = await query.getRawMany();

    // Procesar datos para incluir información adicional
    const equiposConEstadisticas = equipos.map(equipo => ({
      ...equipo,
      porcentaje_uso: calcularPorcentajeUso(equipo.total_uso),
      estado: determinarEstadoEquipo(equipo.total_uso, equipo.dias_utilizados)
    }));

    return [equiposConEstadisticas, null];
  } catch (error) {
    console.error("Error obteniendo estadísticas de equipos:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function getEstadisticasTemporalesService(tipo = 'mensual') {
  try {
    const repo = AppDataSource.getRepository(Reservation);
    
    let dateFormat;
    switch (tipo) {
      case 'diario':
        dateFormat = "DATE(r.fechaReserva)";
        break;
      case 'semanal':
        dateFormat = "DATE_TRUNC('week', r.fechaReserva)";
        break;
      case 'mensual':
      default:
        dateFormat = "DATE_TRUNC('month', r.fechaReserva)";
    }

    const query = repo.createQueryBuilder("r")
      .select([
        `${dateFormat} as periodo`,
        "COUNT(*) as total_reservas",
        "COUNT(DISTINCT r.pcId) as equipos_utilizados",
        "COUNT(DISTINCT r.rut) as usuarios_unicos"
      ])
      .where("r.carrera != :maintenance", { maintenance: "MAINTENANCE" })
      .groupBy("periodo")
      .orderBy("periodo", "ASC");

    const tendencias = await query.getRawMany();

    return [tendencias, null];
  } catch (error) {
    console.error("Error calculando tendencias temporales:", error);
    return [null, "Error interno del servidor"];
  }
}

// Funciones auxiliares para cálculos
function calcularResumenGeneral(reservas) {
  const equiposUnicos = new Set(reservas.map(r => r.pcId));
  const usuariosUnicos = new Set(reservas.map(r => r.rut));
  const fechasUnicas = new Set(reservas.map(r => r.fechaReserva));
  
  // Calcular capacidad total diaria (Lab1: 40*17 + Lab2: 20*17 + Lab3: 20*17 = 1360)
  const capacidadDiaria = LAB_CONFIG[1].equipos * 17 + LAB_CONFIG[2].equipos * 17 + LAB_CONFIG[3].equipos * 17;

  return {
    totalReservas: reservas.length,
    equiposUtilizados: equiposUnicos.size,
    equiposTotales: 80,
    usuariosActivos: usuariosUnicos.size,
    diasConActividad: fechasUnicas.size,
    promedioReservasPorDia: fechasUnicas.size > 0 ? (reservas.length / fechasUnicas.size).toFixed(1) : 0,
    capacidadDiaria,
    porcentajeUsoGeneral: capacidadDiaria > 0 ? ((reservas.length / (capacidadDiaria * fechasUnicas.size)) * 100).toFixed(1) : 0
  };
}

function calcularUsoEquipos(reservas) {
  const usoEquipos = {};
  reservas.forEach(reserva => {
    const equipoKey = `PC ${reserva.pcId}`;
    usoEquipos[equipoKey] = (usoEquipos[equipoKey] || 0) + 1;
  });
  return usoEquipos;
}

function calcularHorariosActivos(reservas) {
  const horariosActivos = {};
  reservas.forEach(reserva => {
    const horario = reserva.horaInicio.substring(0, 5);
    horariosActivos[horario] = (horariosActivos[horario] || 0) + 1;
  });
  return horariosActivos;
}

function calcularDiasActivos(reservas) {
  const diasActivos = {};
  reservas.forEach(reserva => {
    const fecha = new Date(reserva.fechaReserva);
    const nombreDia = fecha.toLocaleDateString('es-ES', { weekday: 'long' });
    diasActivos[nombreDia] = (diasActivos[nombreDia] || 0) + 1;
  });
  return diasActivos;
}

function calcularDemandaLaboratorios(reservas) {
  const demanda = { 1: 0, 2: 0, 3: 0 };
  const detalles = {};
  
  reservas.forEach(reserva => {
    demanda[reserva.labId] = (demanda[reserva.labId] || 0) + 1;
  });
  
  // Agregar información detallada de cada laboratorio
  Object.keys(demanda).forEach(labId => {
    const labInfo = getLabInfo(parseInt(labId));
    const capacidadLab = labInfo ? labInfo.equipos * 17 : 20 * 17; // 17 bloques por día
    
    detalles[labId] = {
      reservas: demanda[labId],
      equipos: labInfo ? labInfo.equipos : 20,
      capacidadDiaria: capacidadLab,
      nombre: labInfo ? labInfo.nombre : `Laboratorio ${labId}`,
      porcentajeCapacidad: capacidadLab > 0 ? ((demanda[labId] / capacidadLab) * 100).toFixed(1) : 0
    };
  });
  
  return { simple: demanda, detallado: detalles };
}

function calcularTendencias(reservas) {
  // Agrupar por mes para tendencias básicas
  const tendenciasMensuales = {};
  reservas.forEach(reserva => {
    const fecha = new Date(reserva.fechaReserva);
    const mesAno = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    tendenciasMensuales[mesAno] = (tendenciasMensuales[mesAno] || 0) + 1;
  });
  
  return tendenciasMensuales;
}

function calcularPorcentajeUso(totalUso) {
  // Capacidad máxima por equipo: 17 bloques por día * 30 días = 510 bloques máximos por mes
  const maxUsoPosible = 510;
  return ((totalUso / maxUsoPosible) * 100).toFixed(2);
}

function determinarEstadoEquipo(totalUso, diasUtilizados) {
  if (totalUso === 0) return 'Sin uso';
  if (totalUso < 10) return 'Uso bajo';
  if (totalUso < 50) return 'Uso moderado';
  if (totalUso < 100) return 'Uso alto';
  return 'Uso intensivo';
}

// Información de configuración de laboratorios
const LAB_CONFIG = {
  1: { equipos: 40, rango: { min: 1, max: 40 }, nombre: 'Laboratorio 1' },
  2: { equipos: 20, rango: { min: 41, max: 60 }, nombre: 'Laboratorio 2' },
  3: { equipos: 20, rango: { min: 61, max: 80 }, nombre: 'Laboratorio 3' }
};

function getLabInfo(labId) {
  return LAB_CONFIG[labId] || null;
}

export async function getEstadisticasAsistenciaService(filtros = {}) {
  try {
    const repo = AppDataSource.getRepository(Turno);
    
    // Construir query base
    let query = repo.createQueryBuilder("t");

    // Aplicar filtros de fecha
    if (filtros.fechaInicio) {
      query.andWhere("t.fecha >= :fechaInicio", { fechaInicio: filtros.fechaInicio });
    }
    if (filtros.fechaFin) {
      query.andWhere("t.fecha <= :fechaFin", { fechaFin: filtros.fechaFin });
    }
    if (filtros.consultor && filtros.consultor !== 'todos') {
      query.andWhere("LOWER(t.nombre) LIKE :consultor", { 
        consultor: `%${filtros.consultor.toLowerCase()}%` 
      });
    }

    const turnos = await query.getMany();

    // Calcular estadísticas de asistencia
    const estadisticas = {
      resumenGeneral: calcularResumenAsistencia(turnos),
      asistenciaPorConsultor: calcularAsistenciaPorConsultor(turnos),
      puntualidadPorConsultor: calcularPuntualidadPorConsultor(turnos),
      horasPorConsultor: calcularHorasPorConsultor(turnos),
      observacionesPorConsultor: calcularObservacionesPorConsultor(turnos),
      tendenciasAsistencia: calcularTendenciasAsistencia(turnos)
    };

    return [estadisticas, null];
  } catch (error) {
    console.error("Error calculando estadísticas de asistencia:", error);
    return [null, "Error interno del servidor"];
  }
}

// Funciones auxiliares para estadísticas de asistencia
function calcularResumenAsistencia(turnos) {
  const consultoresUnicos = new Set(turnos.map(t => t.nombre));
  const turnosPresentes = turnos.filter(t => t.horaEntradaMarcada);
  const turnosAusentes = turnos.filter(t => !t.horaEntradaMarcada);
  
  let totalRetrasos = 0;
  let contadorRetrasos = 0;
  let totalHoras = 0;
  let contadorHoras = 0;

  turnos.forEach(turno => {
    if (turno.horaEntradaMarcada && turno.horaEntradaAsignada) {
      const retraso = calcularRetraso(turno.horaEntradaAsignada, turno.horaEntradaMarcada);
      if (retraso !== null) {
        totalRetrasos += retraso;
        contadorRetrasos++;
      }
    }
    
    if (turno.horaEntradaMarcada && turno.horaSalidaMarcada) {
      const horas = calcularHorasTrabajadas(turno.horaEntradaMarcada, turno.horaSalidaMarcada);
      if (horas > 0) {
        totalHoras += horas;
        contadorHoras++;
      }
    }
  });

  return {
    totalTurnos: turnos.length,
    totalConsultores: consultoresUnicos.size,
    turnosPresentes: turnosPresentes.length,
    turnosAusentes: turnosAusentes.length,
    porcentajeAsistencia: turnos.length > 0 ? ((turnosPresentes.length / turnos.length) * 100).toFixed(1) : 0,
    promedioRetraso: contadorRetrasos > 0 ? (totalRetrasos / contadorRetrasos).toFixed(1) : 0,
    promedioHoras: contadorHoras > 0 ? (totalHoras / contadorHoras).toFixed(1) : 0
  };
}

function calcularAsistenciaPorConsultor(turnos) {
  const asistencia = {};
  
  turnos.forEach(turno => {
    const nombre = turno.nombre || 'Sin nombre';
    if (!asistencia[nombre]) {
      asistencia[nombre] = { asignados: 0, presentes: 0, ausentes: 0 };
    }
    
    asistencia[nombre].asignados++;
    if (turno.horaEntradaMarcada) {
      asistencia[nombre].presentes++;
    } else {
      asistencia[nombre].ausentes++;
    }
  });
  
  return asistencia;
}

function calcularPuntualidadPorConsultor(turnos) {
  const puntualidad = {};
  
  turnos.forEach(turno => {
    const nombre = turno.nombre || 'Sin nombre';
    if (!puntualidad[nombre]) {
      puntualidad[nombre] = [];
    }
    
    if (turno.horaEntradaMarcada && turno.horaEntradaAsignada) {
      const retraso = calcularRetraso(turno.horaEntradaAsignada, turno.horaEntradaMarcada);
      if (retraso !== null) {
        puntualidad[nombre].push({
          fecha: turno.fecha,
          retraso: retraso,
          estado: retraso <= 0 ? 'puntual' : retraso <= 5 ? 'aceptable' : 'tarde'
        });
      }
    }
  });
  
  return puntualidad;
}

function calcularHorasPorConsultor(turnos) {
  const horas = {};
  
  turnos.forEach(turno => {
    const nombre = turno.nombre || 'Sin nombre';
    if (!horas[nombre]) {
      horas[nombre] = 0;
    }
    
    if (turno.horaEntradaMarcada && turno.horaSalidaMarcada) {
      const horasTrabajadas = calcularHorasTrabajadas(turno.horaEntradaMarcada, turno.horaSalidaMarcada);
      horas[nombre] += horasTrabajadas;
    }
  });
  
  return horas;
}

function calcularObservacionesPorConsultor(turnos) {
  const observaciones = {};
  
  turnos.forEach(turno => {
    const nombre = turno.nombre || 'Sin nombre';
    if (!observaciones[nombre]) {
      observaciones[nombre] = [];
    }
    
    if (turno.observacion && turno.observacion.trim()) {
      observaciones[nombre].push({
        fecha: turno.fecha,
        observacion: turno.observacion
      });
    }
  });
  
  return observaciones;
}

function calcularTendenciasAsistencia(turnos) {
  const tendencias = {};
  
  turnos.forEach(turno => {
    const fecha = new Date(turno.fecha);
    const mesAno = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    
    if (!tendencias[mesAno]) {
      tendencias[mesAno] = { total: 0, presentes: 0, ausentes: 0 };
    }
    
    tendencias[mesAno].total++;
    if (turno.horaEntradaMarcada) {
      tendencias[mesAno].presentes++;
    } else {
      tendencias[mesAno].ausentes++;
    }
  });
  
  return tendencias;
}

function calcularRetraso(horaAsignada, horaMarcada) {
  if (!horaAsignada || !horaMarcada) return null;
  
  const [horaA, minA] = horaAsignada.split(':').map(Number);
  const [horaM, minM] = horaMarcada.split(':').map(Number);
  
  const minutosAsignados = horaA * 60 + minA;
  const minutosMarcados = horaM * 60 + minM;
  
  return minutosMarcados - minutosAsignados; // Positivo = tarde, Negativo = temprano
}

function calcularHorasTrabajadas(horaEntrada, horaSalida) {
  if (!horaEntrada || !horaSalida) return 0;
  
  const [horaE, minE] = horaEntrada.split(':').map(Number);
  const [horaS, minS] = horaSalida.split(':').map(Number);
  
  const minutosEntrada = horaE * 60 + minE;
  const minutosSalida = horaS * 60 + minS;
  
  return Math.max(0, (minutosSalida - minutosEntrada) / 60);
}
