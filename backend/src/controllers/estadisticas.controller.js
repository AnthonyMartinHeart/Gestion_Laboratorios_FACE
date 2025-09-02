"use strict";
import {
  getEstadisticasGeneralesService,
  getEstadisticasEquiposService,
  getEstadisticasTemporalesService,
  getEstadisticasAsistenciaService
} from "../services/estadisticas.service.js";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";

/**
 * Controlador para obtener estadísticas generales
 * Permite filtros por fecha y laboratorio
 */
export async function getEstadisticasGenerales(req, res) {
  try {
    // Prevenir caché para datos en tiempo real
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });

    const filtros = {
      fechaInicio: req.query.fechaInicio,
      fechaFin: req.query.fechaFin,
      laboratorio: req.query.laboratorio
    };

    const [estadisticas, error] = await getEstadisticasGeneralesService(filtros);
    
    if (error) {
      return handleErrorClient(res, 500, error);
    }

    handleSuccess(res, 200, "Estadísticas obtenidas exitosamente", estadisticas);
  } catch (error) {
    console.error('Error en getEstadisticasGenerales:', error);
    handleErrorServer(res, 500, error.message);
  }
}

/**
 * Controlador para obtener estadísticas específicas de equipos
 */
export async function getEstadisticasEquipos(req, res) {
  try {
    const labId = req.query.labId ? parseInt(req.query.labId) : null;
    
    const [equipos, error] = await getEstadisticasEquiposService(labId);
    
    if (error) {
      return handleErrorClient(res, 500, error);
    }

    handleSuccess(res, 200, "Estadísticas de equipos obtenidas", equipos);
  } catch (error) {
    console.error('Error en getEstadisticasEquipos:', error);
    handleErrorServer(res, 500, error.message);
  }
}

/**
 * Controlador para obtener tendencias temporales
 */
export async function getEstadisticasTemporales(req, res) {
  try {
    const tipo = req.query.tipo || 'mensual'; // diario, semanal, mensual
    
    if (!['diario', 'semanal', 'mensual'].includes(tipo)) {
      return handleErrorClient(res, 400, "Tipo de periodo inválido. Use: diario, semanal, mensual");
    }

    const [tendencias, error] = await getEstadisticasTemporalesService(tipo);
    
    if (error) {
      return handleErrorClient(res, 500, error);
    }

    handleSuccess(res, 200, `Tendencias ${tipo}s obtenidas`, tendencias);
  } catch (error) {
    console.error('Error en getEstadisticasTemporales:', error);
    handleErrorServer(res, 500, error.message);
  }
}

/**
 * Controlador para generar reporte completo de estadísticas
 * Incluye todos los tipos de análisis en una sola respuesta
 */
export async function getReporteCompleto(req, res) {
  try {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });

    const filtros = {
      fechaInicio: req.query.fechaInicio,
      fechaFin: req.query.fechaFin,
      laboratorio: req.query.laboratorio
    };

    // Obtener todos los tipos de estadísticas en paralelo
    const [
      [estadisticasGenerales, errorGenerales],
      [equipos, errorEquipos],
      [tendencias, errorTendencias]
    ] = await Promise.all([
      getEstadisticasGeneralesService(filtros),
      getEstadisticasEquiposService(filtros.laboratorio),
      getEstadisticasTemporalesService('mensual')
    ]);

    if (errorGenerales || errorEquipos || errorTendencias) {
      const error = errorGenerales || errorEquipos || errorTendencias;
      return handleErrorClient(res, 500, error);
    }

    const reporteCompleto = {
      estadisticasGenerales,
      equipos,
      tendencias,
      filtrosAplicados: filtros,
      fechaGeneracion: new Date().toISOString()
    };

    handleSuccess(res, 200, "Reporte completo generado", reporteCompleto);
  } catch (error) {
    console.error('Error en getReporteCompleto:', error);
    handleErrorServer(res, 500, error.message);
  }
}

/**
 * Controlador para obtener estadísticas de asistencia de consultores
 */
export async function getEstadisticasAsistencia(req, res) {
  try {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });

    const filtros = {
      fechaInicio: req.query.fechaInicio,
      fechaFin: req.query.fechaFin,
      consultor: req.query.consultor
    };

    const [estadisticas, error] = await getEstadisticasAsistenciaService(filtros);
    
    if (error) {
      return handleErrorClient(res, 500, error);
    }

    handleSuccess(res, 200, "Estadísticas de asistencia obtenidas exitosamente", estadisticas);
  } catch (error) {
    console.error('Error en getEstadisticasAsistencia:', error);
    handleErrorServer(res, 500, error.message);
  }
}
