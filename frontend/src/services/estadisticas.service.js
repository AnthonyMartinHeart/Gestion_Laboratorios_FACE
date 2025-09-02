import axios from './root.service.js';

// Manejo centralizado de errores para estadísticas
function handleError(error) {
  console.error('Error en servicio de estadísticas:', error);
  return error.response?.data || { error: 'Error desconocido en estadísticas' };
}

/**
 * Obtiene estadísticas generales del sistema con filtros opcionales
 * @param {Object} filtros - Filtros para aplicar a las estadísticas
 * @param {string} filtros.fechaInicio - Fecha de inicio en formato YYYY-MM-DD
 * @param {string} filtros.fechaFin - Fecha de fin en formato YYYY-MM-DD  
 * @param {string} filtros.laboratorio - ID del laboratorio o 'todos'
 */
export async function getEstadisticasGenerales(filtros = {}) {
  try {
    const params = new URLSearchParams();
    
    if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
    if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
    if (filtros.laboratorio && filtros.laboratorio !== 'todos') {
      params.append('laboratorio', filtros.laboratorio);
    }

    const { data: response } = await axios.get(`/estadisticas/generales?${params.toString()}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    return response.data || response;
  } catch (error) {
    throw new Error(handleError(error).message || 'Error al obtener estadísticas generales');
  }
}

/**
 * Obtiene estadísticas específicas de equipos
 * @param {number} labId - ID del laboratorio (opcional)
 */
export async function getEstadisticasEquipos(labId = null) {
  try {
    const params = labId ? `?labId=${labId}` : '';
    const { data: response } = await axios.get(`/estadisticas/equipos${params}`);
    
    return response.data || response;
  } catch (error) {
    throw new Error(handleError(error).message || 'Error al obtener estadísticas de equipos');
  }
}

/**
 * Obtiene tendencias temporales
 * @param {string} tipo - Tipo de periodo: 'diario', 'semanal', 'mensual'
 */
export async function getEstadisticasTemporales(tipo = 'mensual') {
  try {
    const { data: response } = await axios.get(`/estadisticas/temporales?tipo=${tipo}`);
    
    return response.data || response;
  } catch (error) {
    throw new Error(handleError(error).message || 'Error al obtener tendencias temporales');
  }
}

/**
 * Obtiene un reporte completo con todas las estadísticas
 * @param {Object} filtros - Filtros para aplicar al reporte
 */
export async function getReporteCompleto(filtros = {}) {
  try {
    const params = new URLSearchParams();
    
    if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
    if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
    if (filtros.laboratorio && filtros.laboratorio !== 'todos') {
      params.append('laboratorio', filtros.laboratorio);
    }

    const { data: response } = await axios.get(`/estadisticas/reporte-completo?${params.toString()}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    return response.data || response;
  } catch (error) {
    throw new Error(handleError(error).message || 'Error al obtener reporte completo');
  }
}

/**
 * Función auxiliar para exportar datos a Excel en el frontend
 * @param {Array} datos - Datos a exportar
 * @param {string} nombreArchivo - Nombre del archivo sin extensión
 */
export function exportarDatosExcel(datos, nombreArchivo = 'estadisticas') {
  if (!Array.isArray(datos) || datos.length === 0) {
    throw new Error('No hay datos para exportar');
  }

  // Obtener las columnas de las claves del primer objeto
  const columnas = Object.keys(datos[0]);
  
  // Crear encabezados
  const header = columnas.map(col => 
    col.charAt(0).toUpperCase() + col.slice(1).replace(/([A-Z])/g, ' $1')
  );
  
  // Crear filas de datos
  const rows = datos.map(item => 
    columnas.map(col => item[col] || '')
  );

  // Crear tabla HTML para Excel
  const tableStyle = 'border-collapse: collapse; width: 100%;';
  const cellStyle = 'border: 1px solid black; padding: 8px; text-align: center;';
  const headerStyle = cellStyle + 'background-color: #033163; color: white; font-weight: bold;';

  let table = `<table style="${tableStyle}">`;
  table += '<tr>' + header.map(h => `<th style="${headerStyle}">${h}</th>`).join('') + '</tr>';
  
  rows.forEach(row => {
    table += '<tr>' + row.map(cell => `<td style="${cellStyle}">${cell}</td>`).join('') + '</tr>';
  });
  
  table += '</table>';

  const excelFile = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <style>
        table, th, td { border: 1px solid black; }
        th { background-color: #033163; color: white; }
      </style>
    </head>
    <body>
      ${table}
    </body>
    </html>`;

  const blob = new Blob(['\ufeff' + excelFile], { 
    type: 'application/vnd.ms-excel;charset=utf-8' 
  });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${nombreArchivo}_${new Date().toISOString().split('T')[0]}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Obtiene estadísticas de asistencia de consultores
 * @param {Object} filtros - Filtros para aplicar a las estadísticas de asistencia
 * @param {string} filtros.fechaInicio - Fecha de inicio en formato YYYY-MM-DD
 * @param {string} filtros.fechaFin - Fecha de fin en formato YYYY-MM-DD  
 * @param {string} filtros.consultor - Nombre del consultor o 'todos'
 */
export async function getEstadisticasAsistencia(filtros = {}) {
  try {
    const params = new URLSearchParams();
    
    if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
    if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
    if (filtros.consultor && filtros.consultor !== 'todos') {
      params.append('consultor', filtros.consultor);
    }

    const { data: response } = await axios.get(`/estadisticas/asistencia?${params.toString()}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    return response.data || response;
  } catch (error) {
    throw new Error(handleError(error).message || 'Error al obtener estadísticas de asistencia');
  }
}
