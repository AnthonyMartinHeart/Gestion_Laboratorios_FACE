import { useState } from 'react';
import BitacoraTable, { exportToExcel } from '@components/BitacoraTable';
import { useGetAllReservations } from '@hooks/reservation/useGetAllReservations';
import '@styles/bitacoras.css';

const Bitacoras = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const maxDate = '2026-12-31';

  // Hooks para cada laboratorio
  const lab1 = useGetAllReservations(1, selectedDate);
  const lab2 = useGetAllReservations(2, selectedDate);
  const lab3 = useGetAllReservations(3, selectedDate);

  const handleDateChange = (e) => setSelectedDate(e.target.value);

  const renderLaboratorio = (titulo, numEquipos, startIndex, labNumber, labData) => (
    <div className="laboratorio-section" key={labNumber}>
      <div className="laboratorio-header">
        <h7>{titulo}</h7>
        {/* Botones centrados para cada laboratorio */}
        <div className="laboratorio-controls">
          <button 
            className="export-button"
            onClick={() => {
              // Llamar a la función de exportar específica de cada tabla
              if (labData.reservations && labData.reservations.length > 0) {
                exportToExcel(numEquipos, startIndex, selectedDate, labData.reservations);
              } else {
                exportToExcel(numEquipos, startIndex, selectedDate, []);
              }
            }}
          >
            <i className="fas fa-file-export"></i> Exportar Excel Lab {labNumber}
          </button>
        </div>
      </div>
      <BitacoraTable
        numEquipos={numEquipos}
        startIndex={startIndex}
        reservations={labData.reservations}
        date={selectedDate}
      />
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
          {renderLaboratorio('BITÁCORA LABORATORIO 1', 40, 1, 1, lab1)}
          {renderLaboratorio('BITÁCORA LABORATORIO 2', 20, 41, 2, lab2)}
          {renderLaboratorio('BITÁCORA LABORATORIO 3', 20, 61, 3, lab3)}
        </>
      )}
    </div>
  );
};

export default Bitacoras;
