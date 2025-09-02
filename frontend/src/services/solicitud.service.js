import axios from './root.service.js';

export const crearSolicitud = async (solicitudData) => {
  try {
    const response = await axios.post('/solicitudes', solicitudData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error al crear solicitud:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Error al crear la solicitud' 
    };
  }
};

export const obtenerSolicitudes = async () => {
  try {
    const response = await axios.get('/solicitudes');
    return { success: true, data: response.data.data };
  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Error al obtener las solicitudes' 
    };
  }
};

export const actualizarEstadoSolicitud = async (id, estado, motivoRechazo = null) => {
  try {
    const response = await axios.put(`/solicitudes/${id}`, { 
      estado, 
      motivoRechazo 
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error al actualizar solicitud:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Error al actualizar la solicitud' 
    };
  }
};

export const eliminarSolicitud = async (id) => {
  try {
    const response = await axios.delete(`/solicitudes/${id}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error al eliminar solicitud:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Error al eliminar la solicitud' 
    };
  }
};
