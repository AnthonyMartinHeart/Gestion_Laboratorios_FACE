import axios from './root.service.js';

export const clasesService = {
  // Obtener las clases aprobadas del profesor
  async obtenerMisClases() {
    try {
      const response = await axios.get('/clases/mis-clases');
      return response.data;
    } catch (error) {
      console.error('Error al obtener clases:', error);
      throw error.response?.data || { message: 'Error al obtener las clases' };
    }
  },

  // Cancelar una clase específica
  async cancelarClase(solicitudId, fechaEspecifica, motivoCancelacion) {
    try {
      const response = await axios.post('/clases/cancelar-clase', {
        solicitudId,
        fechaEspecifica,
        motivoCancelacion
      });
      return response.data;
    } catch (error) {
      console.error('Error al cancelar clase:', error);
      throw error.response?.data || { message: 'Error al cancelar la clase' };
    }
  },

  // Para administradores: Obtener notificaciones de cancelaciones
  async obtenerNotificacionesCancelaciones() {
    try {
      const response = await axios.get('/clases/notificaciones-cancelaciones');
      return response.data;
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      throw error.response?.data || { message: 'Error al obtener las notificaciones' };
    }
  },

  // Para administradores: Marcar notificación como vista
  async marcarNotificacionVista(notificacionId) {
    try {
      const response = await axios.put(`/clases/notificaciones/${notificacionId}/vista`);
      return response.data;
    } catch (error) {
      console.error('Error al marcar notificación:', error);
      throw error.response?.data || { message: 'Error al marcar la notificación' };
    }
  },

  // Para administradores: Contar notificaciones pendientes
  async contarNotificacionesPendientes() {
    try {
      const response = await axios.get('/clases/notificaciones/count');
      return response.data;
    } catch (error) {
      console.error('Error al contar notificaciones:', error);
      throw error.response?.data || { message: 'Error al contar las notificaciones' };
    }
  }
};

export default clasesService;
