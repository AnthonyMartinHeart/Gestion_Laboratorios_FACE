import { useState } from 'react';
import BitacoraTable, { exportToExcel } from '@components/BitacoraTable';
import '@styles/bitacoras.css';

const Bitacoras = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const maxDate = '2026-12-31';

  const handleDateChange = (e) => setSelectedDate(e.target.value);

  const renderLaboratorio = (titulo, numEquipos, startIndex, labNumber) => (
    <div className="laboratorio-section" key={labNumber}>
      <div className="laboratorio-header">
        <h7>{titulo}</h7>
      </div>
      <BitacoraTable
        numEquipos={numEquipos}
        startIndex={startIndex}
        date={selectedDate}
      />
      <div className="export-container">
        <button
          className="export-btn"
          onClick={() => exportToExcel(numEquipos, startIndex, selectedDate)}
        >
          Exportar Bitácora {labNumber}
        </button>
      </div>
    </div>
  );

  return (
    <div className="bitacoras-container">
      <h8 className="titulo-principal">Gestión de Bitácoras</h8>
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
          {renderLaboratorio('BITÁCORA LABORATORIO 1', 40, 1, 1)}
          {renderLaboratorio('BITÁCORA LABORATORIO 2', 20, 41, 2)}
          {renderLaboratorio('BITÁCORA LABORATORIO 3', 20, 61, 3)}
        </>
      )}
    </div>
  );
};

export default Bitacoras;
