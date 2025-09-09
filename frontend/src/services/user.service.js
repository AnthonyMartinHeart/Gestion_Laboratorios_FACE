import axios from './root.service.js';
import { formatUserData } from '@helpers/formatData.js';

export async function getUsers() {
    try {
        const { data } = await axios.get('/user/');
        const formattedData = data.data.map(formatUserData);
        return formattedData;
    } catch (error) {
        if (error.response) {
            // La solicitud fue hecha y el servidor respondió con un código de error
            console.log('Error al obtener usuarios:', error.response.status);
            return error.response.data;
        } else if (error.request) {
            // La solicitud fue hecha pero no se recibió respuesta
            console.log('Error: No se recibió respuesta del servidor');
            throw new Error('No se recibió respuesta del servidor. Verifique su conexión.');
        } else {
            // Ocurrió un error al configurar la solicitud
            console.log('Error de configuración:', error.message);
            throw new Error(`Error al configurar la solicitud: ${error.message}`);
        }
    }
}

export async function getUserByRut(rut) {
    try {
        const { data } = await axios.get(`/user/detail/?rut=${rut}`);
        return formatUserData(data.data);
    } catch (error) {
        if (error.response) {
            // La solicitud fue hecha y el servidor respondió con un código de error
            return error.response.data;
        } else if (error.request) {
            // La solicitud fue hecha pero no se recibió respuesta
            throw new Error('No se recibió respuesta del servidor. Verifique su conexión.');
        } else {
            // Ocurrió un error al configurar la solicitud
            throw new Error(`Error al configurar la solicitud: ${error.message}`);
        }
    }
}

export async function updateUser(data, rut) {
    try {
        const response = await axios.patch(`/user/detail/?rut=${rut}`, data);
        return response.data.data;
    } catch (error) {
        if (error.response) {
            // La solicitud fue hecha y el servidor respondió con un código de error
            console.log('Error de respuesta del servidor:', error.response.status, error.response.data);
            return error.response.data;
        } else if (error.request) {
            // La solicitud fue hecha pero no se recibió respuesta
            console.log('Error: No se recibió respuesta del servidor');
            throw new Error('No se recibió respuesta del servidor. Verifique su conexión y que el servidor esté en funcionamiento.');
        } else {
            // Ocurrió un error al configurar la solicitud
            console.log('Error de configuración de solicitud:', error.message);
            throw new Error(`Error al configurar la solicitud: ${error.message}`);
        }
    }
}

export async function deleteUser(rut) {
    try {
        const response = await axios.delete(`/user/detail/?rut=${rut}`);
        return response.data;
    } catch (error) {
        if (error.response) {
            // La solicitud fue hecha y el servidor respondió con un código de error
            console.log('Error al eliminar usuario:', error.response.status);
            return error.response.data;
        } else if (error.request) {
            // La solicitud fue hecha pero no se recibió respuesta
            console.log('Error: No se recibió respuesta del servidor');
            throw new Error('No se recibió respuesta del servidor. Verifique su conexión.');
        } else {
            // Ocurrió un error al configurar la solicitud
            console.log('Error de configuración:', error.message);
            throw new Error(`Error al configurar la solicitud: ${error.message}`);
        }
    }
}

export async function updateFotoPerfil(email, fotoPerfil) {
    try {
        const response = await axios.patch(`/user/foto-perfil?email=${email}`, {
            fotoPerfil
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            console.log('Error al actualizar foto de perfil:', error.response.status);
            return error.response.data;
        } else if (error.request) {
            console.log('Error: No se recibió respuesta del servidor');
            throw new Error('No se recibió respuesta del servidor. Verifique su conexión.');
        } else {
            console.log('Error de configuración:', error.message);
            throw new Error(`Error al configurar la solicitud: ${error.message}`);
        }
    }
}

export async function getFotoPerfil(email) {
    try {
        const response = await axios.get(`/user/foto-perfil?email=${email}`);
        return response.data.data.fotoPerfil;
    } catch (error) {
        if (error.response) {
            console.log('Error al obtener foto de perfil:', error.response.status);
            return null; // Si no tiene foto, retornar null
        } else if (error.request) {
            console.log('Error: No se recibió respuesta del servidor');
            throw new Error('No se recibió respuesta del servidor. Verifique su conexión.');
        } else {
            console.log('Error de configuración:', error.message);
            throw new Error(`Error al configurar la solicitud: ${error.message}`);
        }
    }
}
