import { useState, useEffect } from 'react';
import { getUsers } from '@services/user.service.js';

const useUsers = () => {
    const [users, setUsers] = useState([]);

    const fetchUsers = async () => {
        try {
            const response = await getUsers();
            // Usar el rut sin formatear para lógica interna y el formateado solo para mostrar
            const formattedData = response.map(user => ({
                ...user,
                rutOriginal: user.rut.replace(/\./g, '').toUpperCase(), // rut sin puntos y con K mayúscula
            }));
            dataLogged(formattedData);
            setUsers(formattedData);
        } catch (error) {
            console.error("Error: ", error);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const dataLogged = (formattedData) => {
        try {
            const { rut } = JSON.parse(sessionStorage.getItem('usuario'));
            for(let i = 0; i < formattedData.length ; i++) {
                if(formattedData[i].rut === rut) {
                    formattedData.splice(i, 1);
                    break;
                }
            }
        } catch (error) {
            console.error("Error: ", error)
        }
    };

    return { users, fetchUsers, setUsers };
};

export default useUsers;
