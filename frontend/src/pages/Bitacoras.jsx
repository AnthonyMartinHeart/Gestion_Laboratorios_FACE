import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import BitacoraTable, { exportToExcel } from '@components/BitacoraTable';
import { useGetAllReservations } from '@hooks/reservation/useGetAllReservations';
import { useAuth } from '@context/AuthContext';
import '@styles/bitacoras.css';

const Bitacoras = () => {
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
      console.log('Bitacoras component cleanup completed');
    };
  }, []); // Solo al cambio de ruta principal

  const handleDateChange = (e) => setSelectedDate(e.target.value);

  // Función para manejar cuando se elimina una reserva
  const handleReservationDeleted = () => {
    console.log('🔄 handleReservationDeleted ejecutándose - Refrescando datos...');
    console.log('🔍 Referencias disponibles:', {
      'lab1.refetch': typeof lab1.refetch,
      'lab2.refetch': typeof lab2.refetch,
      'lab3.refetch': typeof lab3.refetch
    });
    
    // Refrescar los datos de todos los laboratorios
    if (lab1.refetch) lab1.refetch();
    if (lab2.refetch) lab2.refetch();
    if (lab3.refetch) lab3.refetch();
    
    console.log('✅ Datos de todos los laboratorios refrescados');
  };

  // Función estable para manejar la apertura del modal
  const handleModalOpen = useCallback((labNumber, openModalFn) => {
    console.log(`📝 Registrando función modal para LAB ${labNumber}`);
    setModalFunctions(prev => ({...prev, [labNumber]: openModalFn}));
  }, []);

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

      {/* Las tablas se muestran siempre que haya una fecha seleccionada (por defecto hoy) */}
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
