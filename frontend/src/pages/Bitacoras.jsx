import { useState } from 'react';
import BitacoraTable, { exportToExcel } from '@components/BitacoraTable';
import '@styles/bitacoras.css';

const Bitacoras = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const maxDate = '2026-12-31';

  const handleDateChange = (e) => setSelectedDate(e.target.value);

  const renderLaboratorio = (titulo, numEquipos, startIndex) => (
    <div className="laboratorio-section">
      <div className="laboratorio-header">
        <h2>{titulo}</h2>
        <button
          className="export-btn"
          onClick={() => exportToExcel(numEquipos, startIndex, selectedDate)}
        >
          Exportar a Excel
        </button>
      </div>
      <BitacoraTable numEquipos={numEquipos} startIndex={startIndex} date={selectedDate} />
    </div>
  );

  return (
    <div className="bitacoras-container">
      <h1 className="titulo-principal">Gestión de Bitácoras</h1>
      <div className="fecha-selector">
        <label htmlFor="fecha">Selecciona una fecha 📅</label>
        <input
          id="fecha"
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          max={maxDate}
        />
      </div>

      {selectedDate && (
        <>
          {renderLaboratorio('Laboratorio 1', 40, 1)}
          {renderLaboratorio('Laboratorio 2', 20, 41)}
          {renderLaboratorio('Laboratorio 3', 20, 61)}
        </>
      )}
    </div>
  );
};

export default Bitacoras;
