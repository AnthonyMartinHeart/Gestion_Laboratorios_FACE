import axios from 'axios';
import cookies from 'js-cookie';

const API_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:3009/api';

console.log('API URL:', API_URL); // Esto ayuda a debuggear problemas de conexión

const instance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  withCredentials: true,
  timeout: 10000, // 10 segundos de timeout para evitar esperas infinitas
  maxRedirects: 5, // Límite de redirecciones
});

// Interceptor para solicitudes
instance.interceptors.request.use(
  (config) => {
    const token = cookies.get('jwt-auth', { path: '/' });
    if(token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Añadir timestamp para evitar caché
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }
    
    return config;
  },
  (error) => {
    console.error('Error en la configuración de la solicitud:', error);
    return Promise.reject(error);
  }
);

// Interceptor para respuestas
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // El servidor respondió con un código de estado de error
      console.log('Error de respuesta:', error.response.status, error.response.data);
    } else if (error.request) {
      // La solicitud se realizó pero no se recibió respuesta
      console.log('No se recibió respuesta del servidor:', error.request);
    } else {
      // Ocurrió un error al configurar la solicitud
      console.log('Error de configuración:', error.message);
    }
    return Promise.reject(error);
  }
);

export default instance;
