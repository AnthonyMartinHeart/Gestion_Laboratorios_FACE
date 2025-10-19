import HorarioLaboratorios from "@components/Horarios-Lab";
import { useAuth } from "@context/AuthContext";
import { useState } from 'react';
import '@styles/horarios.css';
import '@styles/bitacoras.css';

export default function HorarioPage({ laboratorio }) {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'administrador';
  
  // Establecer la fecha actual como valor por defecto
  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const maxDate = '2026-12-31';

  const handleDateChange = (e) => setSelectedDate(e.target.value);

  return (
    <div className="horario-container">
      <div className="header-section">
        <h1 className="hh">
          {laboratorio 
            ? `Horario de Clases del Laboratorio ${laboratorio}` 
            : "Horario de Clases de los Laboratorios de Computación"
          }
        </h1>
        <div style={{ 
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            padding: '10px 25px',
            borderRadius: '50px',
            gap: '15px',
            maxWidth: 'fit-content',
            margin: '0 auto'
          }}>
          <span style={{ color: 'white' }}>Selecciona una fecha</span>
          <input
            type="date"
            id="date"
            value={selectedDate}
            onChange={handleDateChange}
            min={getCurrentDate()}
            max={maxDate}
            style={{
              background: 'white',
              borderRadius: '30px',
              padding: '8px 15px',
              border: 'none',
              fontSize: '1rem'
            }}
          />
        </div>
      </div>

      <HorarioLaboratorios laboratorio={laboratorio} selectedDate={selectedDate} />
    </div>
  );
}
