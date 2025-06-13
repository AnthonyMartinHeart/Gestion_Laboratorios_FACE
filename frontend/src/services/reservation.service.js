import axios from './root.service.js'; // Ya con baseURL y token

// Manejo centralizado de errores
function handleError(error) {
  // Retorna error del backend si existe, si no, mensaje genérico
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
    const { data: response } = await axios.get('/reservas/all');
    return response;
  } catch (error) {
    return handleError(error);
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
