import { useState } from 'react';
import TurnosTable from '@components/TurnosTable';
import { useAuth } from '@context/AuthContext.jsx';
import '@styles/turnos.css';

const Turnos = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => {
   
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // Formato YYYY-MM-DD
  });

  return (
    <div className={`turnos-container ${user?.rol?.toLowerCase() === 'consultor' ? 'consultor-view' : 'admin-view'}`}>
      <h9>Gestión de Turnos</h9>
      <div className="date-selector">
        <label htmlFor="fecha-turno">
          Selecciona una fecha:
        </label>
        <input
          id="fecha-turno"
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
        />
      </div>
      <TurnosTable selectedDate={selectedDate} />
    </div>
  );
};

export default Turnos;
