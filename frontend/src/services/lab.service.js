import axios from './root.service.js';

function handleError(error) {
  console.error('Error en la petición (labs):', error);
  return (
    error.response?.data || {
      status: 'Error',
      message: 'Error desconocido al consultar laboratorios',
    }
  );
}

export async function getLabsConfig() {
  try {
    const { data: response } = await axios.get('/labs/config');
    
    return response;
  } catch (error) {
    return handleError(error);
  }
}

export async function getLabFreeMode(numericLabId) {
  const res = await getLabsConfig();

  if (res?.status === 'Success' && Array.isArray(res.data)) {
    const cfg = res.data.find((c) => c.labId === Number(numericLabId));
    return !!cfg?.freeMode;
  }

  return false;
}

export async function setLabFreeMode(numericLabId, freeMode) {
  try {
    const { data: response } = await axios.patch(
      `/labs/${numericLabId}/free-mode`,
      { freeMode }
    );
    
    return response;
  } catch (error) {
    return handleError(error);
  }
}
