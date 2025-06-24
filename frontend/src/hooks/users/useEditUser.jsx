import { useState } from 'react';
import { updateUser } from '@services/user.service.js';
import { showErrorAlert, showSuccessAlert } from '@helpers/sweetAlert.js';
import { formatPostUpdate } from '@helpers/formatData.js';

const useEditUser = (setUsers, fetchUsers) => {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [dataUser, setDataUser] = useState([]);
    
    const handleClickUpdate = () => {
        if (dataUser.length > 0) {
            setIsPopupOpen(true);
        }
    };

    const handleUpdate = async (updatedUserData) => {
        if (updatedUserData) {
            try {
            // Usar rutOriginal si existe, si no rut normal
            const rutToUpdate = dataUser[0].rutOriginal || dataUser[0].rut;
            const updatedUser = await updateUser(updatedUserData, rutToUpdate);
            showSuccessAlert('¡Actualizado!','El usuario ha sido actualizado correctamente.');
            setIsPopupOpen(false);
            // Refresca toda la lista de usuarios para que los datos se vean enseguida
            await fetchUsers();
            setDataUser([]);
            } catch (error) {
                console.error('Error al actualizar el usuario:', error);
                showErrorAlert('Cancelado','Ocurrió un error al actualizar el usuario.');
            }
        }
    };

    return {
        handleClickUpdate,
        handleUpdate,
        isPopupOpen,
        setIsPopupOpen,
        dataUser,
        setDataUser
    };
};

export default useEditUser;
