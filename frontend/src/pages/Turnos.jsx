import { useState } from 'react';
import TurnosTable from '@components/TurnosTable';
import '@styles/turnos.css';

const Turnos = () => {
  const [selectedDate, setSelectedDate] = useState(() => {
   
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // Formato YYYY-MM-DD
  });

  return (
    <div className="turnos-container">
      <h2>Gestión de Turnos</h2>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
        <label htmlFor="fecha-turno" style={{ fontWeight: 'bold', color: '#233876', fontSize: 18, marginRight: 8 }}>
          Selecciona una fecha:
        </label>
        <input
          id="fecha-turno"
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          style={{
            border: '1px solid #233876',
            borderRadius: 6,
            padding: '6px 10px',
            fontSize: 16,
            background: '#f7faff',
            color: '#233876',
            outline: 'none',
            boxShadow: '0 1px 4px rgba(35,56,118,0.08)'
          }}
        />
      </div>
      <TurnosTable selectedDate={selectedDate} />
    </div>
  );
};

export default Turnos;
