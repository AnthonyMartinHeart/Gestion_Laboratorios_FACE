import { useState, useEffect, useCallback } from 'react';
import { obtenerSolicitudes } from '@services/solicitud.service.js';

const useSolicitudes = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSolicitudes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await obtenerSolicitudes();
      
      if (result.success) {
        setSolicitudes(result.data || []);
      } else {
        setError(result.error);
        console.error('Error al obtener solicitudes:', result.error);
        setSolicitudes([]);
      }
    } catch (err) {
      console.error('Error al obtener solicitudes:', err);
      
      // Manejo específico de errores de conexión
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('El servidor no responde. Verifica que el backend esté funcionando.');
      } else if (err.code === 'NETWORK_ERROR' || err.request?.status === 0) {
        setError('Error de conexión. El servidor no está disponible.');
      } else {
        setError('Error al cargar las solicitudes');
      }
      
      setSolicitudes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSolicitudes();
  }, [fetchSolicitudes]);

  return {
    solicitudes,
    loading,
    error,
    fetchSolicitudes,
    setSolicitudes
  };
};

export default useSolicitudes;
