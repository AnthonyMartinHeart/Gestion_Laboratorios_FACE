import axios from './root.service.js';

export async function getObservacionesByFecha(fecha) {
  try {
    const { data } = await axios.get(`/observaciones/${fecha}`);
    return data.data || [];
  } catch (error) {
    console.error('Error al obtener observaciones:', error);
    return [];
  }
}

export async function saveOrUpdateObservacion(fecha, observacionData) {
  try {
    const { data } = await axios.post(`/observaciones/${fecha}`, observacionData);
    return data.data;
  } catch (error) {
    console.error('Error al guardar observación:', error);
    throw error;
  }
}

export async function debugObservaciones(fecha) {
  try {
    const observaciones = await getObservacionesByFecha(fecha);
    console.log('🔍 Debug de observaciones:', observaciones);
    return observaciones;
  } catch (error) {
    console.error('Error en debug de observaciones:', error);
    return [];
  }
}
