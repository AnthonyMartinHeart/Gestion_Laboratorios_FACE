import axios from './root.service.js';

export const tareasService = {
  // Crear nueva tarea (solo administradores)
  async createTarea(tareaData) {
    try {
      const response = await axios.post('/tareas', tareaData);
      return response.data;
    } catch (error) {
      console.error('Error al crear tarea:', error);
      throw error;
    }
  },

  // Obtener todas las tareas (filtradas por rol)
  async getTareas(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filtros.fechaLimite) {
        console.log('DEBUG Frontend - Fecha límite original:', filtros.fechaLimite);
        params.append('fechaLimite', filtros.fechaLimite);
      }
      
      if (filtros.fechaAsignacion) {
        console.log('DEBUG Frontend - Fecha asignación original:', filtros.fechaAsignacion);
        params.append('fechaAsignacion', filtros.fechaAsignacion);
      }
      
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.prioridad) params.append('prioridad', filtros.prioridad);

      const response = await axios.get(`/tareas?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener tareas:', error);
      throw error;
    }
  },

  // Obtener tarea por ID
  async getTareaById(id) {
    try {
      const response = await axios.get(`/tareas/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener tarea:', error);
      throw error;
    }
  },

  // Actualizar tarea (solo administradores)
  async updateTarea(id, tareaData) {
    try {
      const response = await axios.put(`/tareas/${id}`, tareaData);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar tarea:', error);
      throw error;
    }
  },

  // Eliminar tarea (solo administradores)
  async deleteTarea(id) {
    try {
      const response = await axios.delete(`/tareas/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
      throw error;
    }
  },

  // Obtener mis tareas asignadas (consultores)
  async getMisTareas(filtros = {}) {
    try {
      const params = new URLSearchParams();
      if (filtros.fecha) params.append('fecha', filtros.fecha);
      if (filtros.estado) params.append('estado', filtros.estado);

      const response = await axios.get(`/tareas/mis-tareas/list?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener mis tareas:', error);
      throw error;
    }
  },

  // Completar tarea (consultores)
  async completarTarea(id, completada, observaciones = '') {
    try {
      const response = await axios.patch(`/tareas/${id}/completar`, {
        completada,
        observaciones
      });
      return response.data;
    } catch (error) {
      console.error('Error al completar tarea:', error);
      throw error;
    }
  },

  // Obtener lista de consultores (para administradores)
  async getConsultores() {
    try {
      const response = await axios.get('/user/consultores');
      return response.data;
    } catch (error) {
      console.error('Error al obtener consultores:', error);
      throw error;
    }
  }
};

export default tareasService;

