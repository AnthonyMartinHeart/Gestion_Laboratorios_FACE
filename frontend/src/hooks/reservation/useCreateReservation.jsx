import { useState } from 'react';
import { createReservation } from '@services/reservation.service.js';
import { showErrorAlert, showSuccessAlert } from '@helpers/sweetAlert.js';

const useCreateReservation = () => {
    const [loading, setLoading] = useState(false);

    const handleCreate = async (reservationData, showAlerts = true) => {
        if (!reservationData) return { success: false, error: 'No se proporcionaron datos' };

        setLoading(true);
        try {
            console.log('Creando reserva con datos:', reservationData); // Debug
            const response = await createReservation(reservationData);
            console.log('Respuesta del servidor:', response); // Debug
            
            // Si tenemos una respuesta exitosa
            if (response.status === 201 || response.message === "Reserva creada correctamente") {
                // Refrescar notificaciones inmediatamente
                if (window.refreshNotifications) {
                    window.refreshNotifications();
                }
                if (showAlerts) {
                    showSuccessAlert('¡Éxito!', 'La reserva ha sido creada correctamente.');
                }
                return { success: true };
            }
            
            // Si hay un error específico del servidor
            if (response.error || response.message) {
                const errorMsg = response.error || response.message;
                console.error('Error del servidor:', errorMsg); // Debug
                if (showAlerts) {
                    showErrorAlert('Error', errorMsg);
                }
                return { success: false, error: errorMsg };
            }

            if (showAlerts) {
                showErrorAlert('Error', 'Ocurrió un error al crear la reserva');
            }
            return { success: false, error: 'Error desconocido' };
        } catch (error) {
            console.error('Error al crear la reserva:', error);
            const errorMessage = error.message || 'Ocurrió un error al crear la reserva.';
            if (showAlerts) {
                showErrorAlert('Error', errorMessage);
            }
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
