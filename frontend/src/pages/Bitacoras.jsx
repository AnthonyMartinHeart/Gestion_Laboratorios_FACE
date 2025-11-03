import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import BitacoraTable, { exportToExcel, exportToPDF } from '@components/BitacoraTable';
import { useGetAllReservations } from '@hooks/reservation/useGetAllReservations';
import { useAuth } from '@context/AuthContext';
import '@styles/bitacoras.css';

const Bitacoras = ({ laboratorio }) => {
  // Establecer la fecha actual como valor por defecto (fecha local sin problemas de zona horaria)
  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // Formato YYYY-MM-DD
  };

  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [modalFunctions, setModalFunctions] = useState({});
  const location = useLocation();
  const { user } = useAuth();
  const maxDate = '2026-12-31';

  // Verificar si el usuario es administrador
  const isAdmin = user?.rol === 'administrador';

  // Hooks para cada laboratorio
  const lab1 = useGetAllReservations(1, selectedDate);
  const lab2 = useGetAllReservations(2, selectedDate);
  const lab3 = useGetAllReservations(3, selectedDate);

  // Efecto de limpieza cuando se cambia de ruta
  useEffect(() => {
    return () => {
      // Limpiar estados cuando se desmonta el componente
      setModalFunctions({});
    };
  }, []); // Solo al cambio de ruta principal

  const handleDateChange = (e) => setSelectedDate(e.target.value);

  // Función para manejar cuando se elimina una reserva
  const handleReservationDeleted = () => {
    // Refrescar los datos de todos los laboratorios
    if (lab1.refetch) lab1.refetch();
    if (lab2.refetch) lab2.refetch();
    if (lab3.refetch) lab3.refetch();
  };

  // Exponer función global para refrescar bitácoras desde otros componentes (ej: MisClases)
  useEffect(() => {
    window.refreshBitacoras = () => {
      if (lab1.refetch) lab1.refetch();
      if (lab2.refetch) lab2.refetch();
      if (lab3.refetch) lab3.refetch();
    };

    return () => {
      window.refreshBitacoras = null;
    };
  }, [lab1.refetch, lab2.refetch, lab3.refetch]);

  // Función estable para manejar la apertura del modal
  const handleModalOpen = useCallback((labNumber, openModalFn) => {
    setModalFunctions(prev => ({...prev, [labNumber]: openModalFn}));
  }, []);

  const renderLaboratorio = (titulo, numEquipos, startIndex, labNumber, labData) => (
    <div className="laboratorio-section" key={labNumber}>
      <div className="laboratorio-header">
        {/* Botones centrados para cada laboratorio */}
        <div className="laboratorio-controls">
          <button 
            className="export-button excel-button"
            onClick={() => {
              if (labData.reservations && labData.reservations.length > 0) {
                exportToExcel(numEquipos, startIndex, selectedDate, labData.reservations);
              } else {
                exportToExcel(numEquipos, startIndex, selectedDate, []);
              }
            }}
            title="Exportar a Excel"
          >
            <span className="button-icon">📊</span>
            <span className="button-text">Excel</span>
          </button>

          <button 
            className="export-button pdf-button"
            onClick={() => {
              if (labData.reservations && labData.reservations.length > 0) {
                exportToPDF(numEquipos, startIndex, selectedDate, labData.reservations, labNumber);
              } else {
                exportToPDF(numEquipos, startIndex, selectedDate, [], labNumber);
              }
            }}
            title="Exportar a PDF"
          >
            <span className="button-icon">📄</span>
            <span className="button-text">PDF</span>
          </button>
          
          {/* Solo mostrar el botón de eliminar reservas a los administradores */}
          {isAdmin && (
            <button 
              className="admin-button delete-button"
              onClick={() => {
                if (modalFunctions[labNumber]) {
                  modalFunctions[labNumber]();
                }
              }}
              title="Gestionar reservas"
            >
              <i className="fas fa-trash-alt"></i> Eliminar Reservas
            </button>
          )}
        </div>
      </div>
      <BitacoraTable
        numEquipos={numEquipos}
        startIndex={startIndex}
        reservations={labData.reservations}
        date={selectedDate}
        labNumber={labNumber}
        onReservationDeleted={handleReservationDeleted}
        onModalOpen={(openModalFn) => handleModalOpen(labNumber, openModalFn)}
      />
    </div>
  );

  // Función para obtener el título según el laboratorio específico
  const getTituloPage = () => {
    if (laboratorio === 1) return 'Bitácora - Laboratorio 1';
    if (laboratorio === 2) return 'Bitácora - Laboratorio 2';
    if (laboratorio === 3) return 'Bitácora - Laboratorio 3';
    return 'Gestión de Bitácoras';
  };

  // Función para renderizar solo el laboratorio específico o todos
  const renderContent = () => {
    if (laboratorio === 1) {
      return renderLaboratorio('', 40, 1, 1, lab1);
    }
    if (laboratorio === 2) {
      return renderLaboratorio('', 20, 41, 2, lab2);
    }
    if (laboratorio === 3) {
      return renderLaboratorio('', 20, 61, 3, lab3);
    }
    
    // Si no se especifica laboratorio, mostrar todos (comportamiento original)
    return (
      <>
        {renderLaboratorio('BITÁCORA LABORATORIO 1', 40, 1, 1, lab1)}
        {renderLaboratorio('BITÁCORA LABORATORIO 2', 20, 41, 2, lab2)}
        {renderLaboratorio('BITÁCORA LABORATORIO 3', 20, 61, 3, lab3)}
      </>
    );
  };

  return (
    <div className="bitacoras-container">
      <h9>{getTituloPage()}</h9>
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

      {/* Las tablas se muestran siempre que haya una fecha seleccionada (por defecto hoy) */}
      {selectedDate && renderContent()}
    </div>
  );
};

export default Bitacoras;

