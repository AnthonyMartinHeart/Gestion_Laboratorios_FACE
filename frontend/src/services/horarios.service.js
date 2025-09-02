import axios from './root.service.js';

// Manejo centralizado de errores
function handleError(error) {
  console.log('Error detallado en servicio de horarios:', error);
  
  if (error.response) {
    const message = error.response.data?.message || error.response.data?.error || 'Error del servidor';
    console.warn(`Error de servidor: ${message} (${error.response.status})`);
    return { 
      error: message, 
      status: error.response.status, 
      // Añadir datos iniciales vacíos para evitar errores en el frontend
      lab1: [],
      lab2: [],
      lab3: [],
      lastModified: new Date().toISOString(),
      modifiedBy: 'Error',
      timestamp: Date.now()
    };
  } else if (error.request) {
    console.warn('Error de conexión al servidor - posible problema de CORS o servidor apagado');
    return { 
      error: 'Error de conexión con el servidor', 
      status: 0,
      // Añadir datos iniciales vacíos para evitar errores en el frontend
      lab1: [],
      lab2: [],
      lab3: [],
      lastModified: new Date().toISOString(),
      modifiedBy: 'Error',
      timestamp: Date.now()
    };
  } else {
    console.warn(`Error desconocido: ${error.message}`);
    return { 
      error: error.message || 'Error desconocido', 
      status: -1,
      // Añadir datos iniciales vacíos para evitar errores en el frontend
      lab1: [],
      lab2: [],
      lab3: [],
      lastModified: new Date().toISOString(),
      modifiedBy: 'Error',
      timestamp: Date.now()
    };
  }
}

// Obtener horarios desde el backend
export async function getHorarios() {
  try {
    const { data: response } = await axios.get('/horarios');
    // Verificar que los datos tengan la estructura correcta
    const responseData = response.data || response;
    
    if (!responseData || !responseData.lab1 || !responseData.lab2 || !responseData.lab3) {
      console.warn('Respuesta del backend mal formada:', responseData);
      // Devolver estructura básica como fallback
      return {
        lab1: [],
        lab2: [],
        lab3: [],
        lastModified: new Date().toISOString(),
        modifiedBy: 'Sistema',
        timestamp: Date.now()
      };
    }
    
    return responseData;
  } catch (error) {
    console.error('Error al obtener horarios:', error);
    return handleError(error);
  }
}

// Guardar horarios en el backend
export async function saveHorarios(horariosData) {
  try {
    const { data: response } = await axios.post('/horarios', horariosData);
    return response;
  } catch (error) {
    console.error('Error al guardar horarios:', error);
    return handleError(error);
  }
}

// Actualizar horarios en el backend
export async function updateHorarios(horariosData) {
  try {
    const { data: response } = await axios.put('/horarios', horariosData);
    return response;
  } catch (error) {
    console.error('Error al actualizar horarios:', error);
    return handleError(error);
  }
}

// Actualizar horarios con clases aprobadas
export async function actualizarHorariosConClases() {
  try {
    const { data: response } = await axios.post('/horarios/actualizar-con-clases');
    return response;
  } catch (error) {
    console.error('Error al actualizar horarios con clases:', error);
    return handleError(error);
  }
}

// Cancelar una clase específica
export const cancelarClase = async (laboratorio, claseIndex, motivo) => {
  try {
    console.log('Enviando solicitud de cancelación:', { laboratorio, claseIndex, motivo });
    
    const response = await axios.patch('/horarios/cancelar-clase', {
      laboratorio,
      claseIndex,
      motivo
    });

    console.log('Clase cancelada exitosamente:', response.data);
    return { success: true, data: response.data.data };
  } catch (error) {
    console.error('Error al cancelar clase:', error);
    const errorData = handleError(error);
    return { success: false, ...errorData };
  }
};
