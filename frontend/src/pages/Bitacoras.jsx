import { useState } from 'react';
<<<<<<< HEAD
import BitacoraTable from '@components/BitacoraTable';
import { useGetAllReservations } from '@hooks/reservation/useGetAllReservations';
=======
import BitacoraTable, { exportToExcel } from '@components/BitacoraTable';
>>>>>>> e7a17904b413b5f100201b433da5f612b375b052
import '@styles/bitacoras.css';

const Bitacoras = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const maxDate = '2026-12-31';

<<<<<<< HEAD
  // Hooks para cada laboratorio
  const lab1 = useGetAllReservations(1, selectedDate);
  const lab2 = useGetAllReservations(2, selectedDate);
  const lab3 = useGetAllReservations(3, selectedDate);

  const handleDateChange = (e) => setSelectedDate(e.target.value);

  const renderLaboratorio = (titulo, numEquipos, startIndex, labNumber, labData) => (
=======
  const handleDateChange = (e) => setSelectedDate(e.target.value);

  const renderLaboratorio = (titulo, numEquipos, startIndex, labNumber) => (
>>>>>>> e7a17904b413b5f100201b433da5f612b375b052
    <div className="laboratorio-section" key={labNumber}>
      <div className="laboratorio-header">
        <h7>{titulo}</h7>
      </div>
      <BitacoraTable
        numEquipos={numEquipos}
        startIndex={startIndex}
<<<<<<< HEAD
        reservations={labData.reservations}
        date={selectedDate}
      />
=======
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
>>>>>>> e7a17904b413b5f100201b433da5f612b375b052
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
<<<<<<< HEAD
          {renderLaboratorio('BITÁCORA LABORATORIO 1', 40, 1, 1, lab1)}
          {renderLaboratorio('BITÁCORA LABORATORIO 2', 20, 41, 2, lab2)}
          {renderLaboratorio('BITÁCORA LABORATORIO 3', 20, 61, 3, lab3)}
=======
          {renderLaboratorio('BITÁCORA LABORATORIO 1', 40, 1, 1)}
          {renderLaboratorio('BITÁCORA LABORATORIO 2', 20, 41, 2)}
          {renderLaboratorio('BITÁCORA LABORATORIO 3', 20, 61, 3)}
>>>>>>> e7a17904b413b5f100201b433da5f612b375b052
        </>
      )}
    </div>
  );
};

export default Bitacoras;
