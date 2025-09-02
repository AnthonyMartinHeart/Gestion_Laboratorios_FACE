import axios from './root.service.js'; 

// Manejo centralizado de errores
function handleError(error) {
  console.error('Error en la petición:', error);
  return error.response?.data || { error: 'Error desconocido' };
}

export async function createReservation(data) {
  try {
    const { data: response } = await axios.post('/reservas/create', data);
    return response; // Se espera { success: true, ... } o similar
  } catch (error) {
    return handleError(error);
  }
}

export async function getReservationsByPC(pcId, fechaReserva) {
  try {
    const params = {};
    if (pcId) params.pcId = pcId;
    if (fechaReserva) params.fechaReserva = fechaReserva;

    const { data: response } = await axios.get('/reservas/get', { params });
    return response;
  } catch (error) {
    return handleError(error);
  }
}

export async function getAllReservations() {
  try {
    const { data } = await axios.get('/reservas/all', {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    // Si la respuesta tiene una estructura específica, extraer los datos
    const reservations = data.data || data;
    
    console.log('Datos recibidos del servidor:', {
      estructura: data,
      reservas: reservations
    });

    if (!Array.isArray(reservations)) {
      console.error('La respuesta no es un array:', reservations);
      throw new Error('Formato de respuesta inválido');
    }

    return reservations;
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    throw error;
  }
}

export async function updateReservation(id, data) {
  try {
    const { data: response } = await axios.put(`/reservas/${id}`, data);
    return response;
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteReservation(id) {
  try {
    const { data: response } = await axios.delete(`/reservas/${id}`);
    return response;
  } catch (error) {
    return handleError(error);
  }
}

// Nueva función para finalizar una reserva específica (soft delete)
export async function finishReservation(id) {
  try {
    const { data: response } = await axios.patch(`/reservas/${id}/finish`);
    return response;
  } catch (error) {
    return handleError(error);
  }
}

// Nueva función para liberar todos los equipos
export async function finishActiveReservations() {
  try {
    const { data: response } = await axios.patch('/reservas/finish-all');
    return response;
  } catch (error) {
    return handleError(error);
  }
}

// Nueva función para vaciar completamente la bitácora
export async function clearAllReservations() {
  try {
    const { data: response } = await axios.delete('/reservas/clear-all');
    return response;
  } catch (error) {
    return handleError(error);
  }
}
