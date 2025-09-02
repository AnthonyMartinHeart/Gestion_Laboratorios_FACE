import { useState } from 'react';
import { crearSolicitud } from '@services/solicitud.service.js';
import { showSuccessAlert, showErrorAlert } from '@helpers/sweetAlert.js';

const useCrearSolicitud = (onSuccess) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const crear = async (solicitudData) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await crearSolicitud(solicitudData);
      
      if (result.success) {
        showSuccessAlert('¡Solicitud creada!', 'Tu solicitud ha sido enviada al administrador para su revisión.');
        if (onSuccess) onSuccess();
        return { success: true };
      } else {
        setError(result.error);
        showErrorAlert('Error', result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = 'Error al crear la solicitud';
      console.error('Error al crear solicitud:', err);
      setError(errorMsg);
      showErrorAlert('Error', errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  return {
    crear,
    loading,
    error
  };
};

export default useCrearSolicitud;
