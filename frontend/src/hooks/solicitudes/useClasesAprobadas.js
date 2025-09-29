import { useEffect, useState } from 'react';
import useSolicitudes from '@hooks/solicitudes/useSolicitudes';

// Hook para obtener solo las clases aprobadas
export default function useClasesAprobadas() {
  const { solicitudes, loading, error, fetchSolicitudes } = useSolicitudes();
  const [clasesAprobadas, setClasesAprobadas] = useState([]);

  useEffect(() => {
    if (!loading && solicitudes) {
      console.log('Solicitudes recibidas en useClasesAprobadas:', solicitudes);
      if (Array.isArray(solicitudes)) {
        solicitudes.forEach((s, idx) => {
          console.log(`Solicitud[${idx}]:`, JSON.stringify(s, null, 2));
        });
      }
      // Filtrar solicitudes de tipoSolicitud 'unica' o 'recurrente' y estado 'aprobada'
      const clases = solicitudes.filter(s =>
        (s.tipoSolicitud === 'unica' || s.tipoSolicitud === 'recurrente') &&
        s.estado === 'aprobada'
      );
      console.log('Clases aprobadas filtradas:', clases);
      setClasesAprobadas(clases);
    }
  }, [solicitudes, loading]);

  return { clasesAprobadas, loading, error, fetchSolicitudes };
}
