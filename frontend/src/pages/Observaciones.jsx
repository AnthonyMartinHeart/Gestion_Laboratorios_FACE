import { useState } from 'react';
import ObservacionesTable from '@components/ObservacionesTable';
import { useAuth } from '@context/AuthContext.jsx';
import '@styles/observaciones.css';

const Observaciones = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // Formato YYYY-MM-DD
  });

  return (
    <div className={`observaciones-container ${user?.rol?.toLowerCase() === 'consultor' ? 'consultor-view' : 'admin-view'}`}>
      <h9>Observaciones</h9>
      <div className="date-selector">
        <label htmlFor="fecha-observacion">
          Selecciona una fecha:
        </label>
        <input
          id="fecha-observacion"
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
        />
      </div>
      <ObservacionesTable selectedDate={selectedDate} />
    </div>
  );
};

export default Observaciones;
