import axios from './root.service.js';

export async function setUserActiveStatus(rut, activo) {
    try {
        const response = await axios.patch(`/user/active?rut=${rut}`, { activo });
        return response.data;
    } catch (error) {
        return error.response?.data || { error: 'Error de red' };
    }
}
