import axios from 'axios';
import cookies from 'js-cookie';

<<<<<<< HEAD
const API_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:3006/api';
=======
const API_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:3008/api';
>>>>>>> e7a17904b413b5f100201b433da5f612b375b052

const instance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

instance.interceptors.request.use(
  (config) => {
    const token = cookies.get('jwt-auth', { path: '/' });
    if(token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;
