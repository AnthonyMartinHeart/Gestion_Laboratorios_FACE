import { useState } from 'react';
import { createReservation } from '@services/reservation.service.js';
import { showErrorAlert, showSuccessAlert } from '@helpers/sweetAlert.js';

const useCreateReservation = () => {
    const [loading, setLoading] = useState(false);

    const handleCreate = async (reservationData) => {
        if (!reservationData) return { success: false, error: 'No se proporcionaron datos' };

        setLoading(true);
        try {            const response = await createReservation(reservationData);
            
            // Si tenemos una respuesta exitosa
            if (response.status === 201 || response.message === "Reserva creada correctamente") {
                showSuccessAlert('¡Éxito!', 'La reserva ha sido creada correctamente.');
                return { success: true };
            }
            
            // Si hay un error específico del servidor
            if (response.error || response.message) {
                const errorMsg = response.error || response.message;
                showErrorAlert('Error', errorMsg);
                return { success: false, error: errorMsg };
            }

            showErrorAlert('Error', 'Ocurrió un error al crear la reserva');
            return { success: false, error: 'Error desconocido' };
        } catch (error) {
            console.error('Error al crear la reserva:', error);
            const errorMessage = 'Ocurrió un error al crear la reserva.';
            showErrorAlert('Error', errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    return {
        handleCreate,
        loading
    };
};

export default useCreateReservation;
