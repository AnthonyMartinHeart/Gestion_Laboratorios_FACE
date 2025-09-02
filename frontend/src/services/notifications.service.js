import axios from './root.service.js';

export const notificationsService = {
  // Obtener todas las notificaciones
  async getNotifications() {
    try {
      const response = await axios.get('/notificaciones');
      return response.data.data || [];
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      return [];
    }
  },

  // Obtener conteo de notificaciones no leídas
  async getUnreadCount() {
    try {
      const response = await axios.get('/notificaciones/no-leidas/count');
      return response.data.data?.count || 0;
    } catch (error) {
      console.error('Error al obtener conteo de notificaciones:', error);
      return 0;
    }
  },

  // Marcar una notificación como leída
  async markAsRead(notificationId) {
    try {
      const response = await axios.patch(`/notificaciones/${notificationId}/leida`);
      return response.data;
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      throw error;
    }
  },

  // Marcar todas las notificaciones como leídas
  async markAllAsRead() {
    try {
      const response = await axios.patch('/notificaciones/marcar-todas-leidas');
      return response.data;
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
      throw error;
    }
  }
};

export default notificationsService;
