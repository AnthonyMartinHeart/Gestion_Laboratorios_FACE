import React, { useState, useEffect } from 'react';
import '@styles/bitacoras.css';
import { deleteReservation } from '@services/reservation.service.js';
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from '@helpers/sweetAlert.js';
import Swal from 'sweetalert2';

const horas = [
  "08:10 - 08:50", "08:50 - 09:30", "09:40 - 10:20", "10:20 - 11:00",
  "11:10 - 11:50", "11:50 - 12:30", "12:40 - 13:20", "13:20 - 14:00",
  "14:10 - 14:50", "14:50 - 15:30", "15:40 - 16:20", "16:20 - 17:00",
  "17:10 - 17:50", "17:50 - 18:30", "18:40 - 19:20", "19:20 - 20:00",
  "20:00 - 20:50"
];

export const exportToExcel = (numEquipos, startIndex, date, reservations = []) => {
  // Crear un mapa de reservas por PC y hora
  const reservationMap = {};
  reservations.forEach(reserva => {
    const pcId = reserva.pcId;
    const horaInicio = reserva.horaInicio?.substring(0, 5);
    const horaTermino = reserva.horaTermino?.substring(0, 5);

    horas.forEach(horaBloqueStr => {
      const [inicioBloque] = horaBloqueStr.split(' - ');
      if (inicioBloque >= horaInicio && inicioBloque < horaTermino) {
        const key = `${pcId}-${inicioBloque}`;
        reservationMap[key] = reserva;
      }
    });
  });

  const header = ["Horario", ...Array.from({ length: numEquipos }, (_, i) => `PC ${startIndex + i}`)];
  
  // Generar las filas con los datos de reservas
  const rows = horas.map(hora => {
    const [horaBloque] = hora.split(' - ');
    const rowData = [hora];
    
    for (let i = 0; i < numEquipos; i++) {
      const pcId = startIndex + i;
      const key = `${pcId}-${horaBloque}`;
      const reserva = reservationMap[key];
      
      if (reserva) {
        // Verificar si es un bloque de clases
        if (reserva.carrera === 'ADMIN') {
          rowData.push('CLASES\nAdministrador');
        } else {
          rowData.push(`${reserva.rut}\n${reserva.carrera}`);
        }
      } else {
        rowData.push('');
      }
    }
    
    return rowData;
  });

  // Crear la tabla HTML con estilos
  let tableStyle = 'border-collapse: collapse; width: 100%;';
  let cellStyle = 'border: 1px solid black; padding: 8px; text-align: center;';
  let headerStyle = cellStyle + 'background-color: #033163; color: white; font-weight: bold;';

  let table = `<table style="${tableStyle}">`;
  
  // Agregar encabezado
  table += '<tr>' + header.map(h => `<th style="${headerStyle}">${h}</th>`).join('') + '</tr>';
  
  // Agregar filas de datos
  rows.forEach(row => {
    table += '<tr>';
    row.forEach((cell, index) => {
      if (index === 0) {
        // Estilo para la columna de horarios
        table += `<td style="${cellStyle}">${cell}</td>`;
      } else {
        // Estilo para las celdas con datos
        const hasData = cell !== '';
        const cellContentStyle = hasData ? 'background-color: #e6f3ff;' : '';
        table += `<td style="${cellStyle} ${cellContentStyle}">${cell.replace('\n', '<br>')}</td>`;
      }
    });
    table += '</tr>';
  });
  
  table += '</table>';

  const excelFile = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <style>
        table, th, td { border: 1px solid black; }
        th { background-color: #033163; color: white; }
        .reserved { background-color: #e6f3ff; }
      </style>
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Bitácora</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
    </head>
    <body>
      ${table}
    </body>
    </html>`;

  // Crear el Blob con la codificación UTF-8
  const blob = new Blob(['\ufeff' + excelFile], { 
    type: 'application/vnd.ms-excel;charset=utf-8' 
  });

  // Crear y simular clic en el enlace de descarga
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `bitacora_${date || 'sin_fecha'}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const BitacoraTable = ({ numEquipos, startIndex = 1, reservations = [], date, labNumber, onReservationDeleted, onModalOpen }) => {
  const [scale, setScale] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [equiposReservados, setEquiposReservados] = useState([]);
  const [selectedEquipos, setSelectedEquipos] = useState([]);

  // Función para formatear el porcentaje de zoom
  const formatZoom = (scale) => `${Math.round(scale * 100)}%`;

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 1.5));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleResetZoom = () => {
    setScale(1);
  };

  const handleExport = () => {
    console.log('Exportando con reservas:', reservations); // Debug
    exportToExcel(numEquipos, startIndex, date, reservations);
  };

  const handleDeleteReservation = async (reserva) => {
    try {
      const confirmar = await showConfirmAlert(
        '¿Eliminar reserva?',
        `¿Estás seguro de eliminar la reserva de ${reserva.rut} en PC ${reserva.pcId} de ${reserva.horaInicio} a ${reserva.horaTermino}?`,
        'Sí, eliminar',
        'Cancelar'
      );

      if (confirmar) {
        const resultado = await deleteReservation(reserva.id);
        
        if (resultado && !resultado.error) {
          showSuccessAlert('¡Eliminada!', 'La reserva ha sido eliminada correctamente');
          // Llamar callback para actualizar la lista
          if (onReservationDeleted) {
            onReservationDeleted();
          }
        } else {
          throw new Error(resultado.error || 'Error al eliminar la reserva');
        }
      }
    } catch (error) {
      console.error('Error al eliminar reserva:', error);
      showErrorAlert('Error', 'No se pudo eliminar la reserva: ' + error.message);
    }
  };

  // Función para obtener equipos reservados del día actual
  const getEquiposReservadosHoy = () => {
    console.log('🔍 === INICIO getEquiposReservadosHoy ===');
    console.log('📝 Props recibidas:', { 
      date, 
      labNumber, 
      'reservations-length': reservations?.length || 0,
      'reservations-data': reservations 
    });
    
    if (!date) {
      console.log('❌ No hay fecha seleccionada');
      return [];
    }
    
    if (!reservations || reservations.length === 0) {
      console.log('❌ No hay reservas disponibles para este laboratorio y fecha');
      return [];
    }
    
    console.log('✅ Procesando reservas para el modal...');
    
    const equipos = [];
    reservations.forEach((reservation, index) => {
      console.log(`� [${index + 1}] Procesando reserva:`, {
        id: reservation.id,
        pcId: reservation.pcId,
        rut: reservation.rut,
        carrera: reservation.carrera,
        horaInicio: reservation.horaInicio,
        horaTermino: reservation.horaTermino
      });
      
      // Excluir reservas de mantenimiento del modal
      if (reservation.carrera === 'MAINTENANCE') {
        console.log(`⚠️ Excluyendo reserva de mantenimiento: ${reservation.id}`);
        return;
      }
      
      const equipoInfo = {
        id: reservation.id,
        numeroEquipo: reservation.pcId,
        horaInicio: reservation.horaInicio?.substring(0, 5) || reservation.horaInicio,
        horaFin: reservation.horaTermino?.substring(0, 5) || reservation.horaTermino,
        usuario: reservation.user || reservation.rut,
        carrera: reservation.carrera,
        tipoReserva: reservation.tipoReserva || 'Reserva Individual',
        rut: reservation.rut
      };
      
      console.log(`✅ Equipo agregado al modal:`, equipoInfo);
      equipos.push(equipoInfo);
    });
    
    const equiposOrdenados = equipos.sort((a, b) => a.numeroEquipo - b.numeroEquipo);
    console.log('🎯 RESULTADO FINAL:', equiposOrdenados);
    console.log(`📊 Total equipos para el modal: ${equiposOrdenados.length}`);
    console.log('🔍 === FIN getEquiposReservadosHoy ===');
    
    return equiposOrdenados;
  };

  // Función para manejar la apertura del modal
  const openDeleteModal = () => {
    console.log(`🔥 [LAB ${labNumber}] === CLICK EN ELIMINAR RESERVAS ===`);
    console.log(`📊 [LAB ${labNumber}] Estado actual completo:`, {
      date: date,
      labNumber: labNumber,
      'reservations-recibidas': reservations,
      'tipo-reservations': typeof reservations,
      'es-array': Array.isArray(reservations),
      'length': reservations?.length,
      'primera-reserva': reservations?.[0]
    });
    
    // Log adicional para debugging
    if (reservations && reservations.length > 0) {
      console.log(`📝 [LAB ${labNumber}] Detalles de cada reserva recibida:`);
      reservations.forEach((res, idx) => {
        console.log(`   [${idx}]:`, {
          id: res.id,
          pcId: res.pcId,
          rut: res.rut,
          carrera: res.carrera,
          fechaReserva: res.fechaReserva,
          horaInicio: res.horaInicio,
          horaTermino: res.horaTermino
        });
      });
    }
    
    const equipos = getEquiposReservadosHoy();
    console.log(`🎯 [LAB ${labNumber}] Equipos devueltos por getEquiposReservadosHoy:`, equipos);
    
    if (equipos.length === 0) {
      console.log(`⚠️ [LAB ${labNumber}] NO SE ENCONTRARON EQUIPOS - Mostrando alerta de error`);
      showErrorAlert('No hay reservas', 'No se encontraron reservas para eliminar en esta fecha y laboratorio.');
      return;
    }
    
    console.log(`✅ [LAB ${labNumber}] Abriendo modal con equipos:`, equipos);
    setEquiposReservados(equipos);
    setSelectedEquipos([]);
    setShowDeleteModal(true);
    console.log(`✅ [LAB ${labNumber}] Modal abierto correctamente`);
  };

  // Exponer la función hacia el componente padre cuando cambian las reservas
  React.useEffect(() => {
    console.log(`🔄 [LAB ${labNumber}] BitacoraTable actualizado - Reservas:`, {
      date,
      labNumber,
      'reservations-length': reservations?.length || 0,
      'tiene-reservas': reservations && reservations.length > 0
    });
    
    // Solo exponer la función cuando hay un cambio significativo
    if (onModalOpen && typeof onModalOpen === 'function') {
      console.log(`📤 [LAB ${labNumber}] Exponiendo función openDeleteModal al padre`);
      onModalOpen(openDeleteModal);
    }
  }, [reservations?.length, date]); // Eliminar onModalOpen de las dependencias

  // Función para cerrar el modal
  const handleCloseModal = () => {
    setShowDeleteModal(false);
    setEquiposReservados([]);
    setSelectedEquipos([]);
  };

  // Función para seleccionar/deseleccionar un equipo
  const toggleEquipoSelection = (equipoId) => {
    setSelectedEquipos(prev => {
      if (prev.includes(equipoId)) {
        return prev.filter(id => id !== equipoId);
      } else {
        return [...prev, equipoId];
      }
    });
  };

  // Función para seleccionar todos los equipos
  const selectAllEquipos = () => {
    setSelectedEquipos(equiposReservados.map(equipo => equipo.id));
  };

  // Función para deseleccionar todos los equipos
  const deselectAllEquipos = () => {
    setSelectedEquipos([]);
  };

  // Función para eliminar equipos seleccionados
  const handleEliminarEquipos = async () => {
    console.log('handleEliminarEquipos ejecutándose...'); // Debug
    console.log('selectedEquipos:', selectedEquipos); // Debug
    
    if (selectedEquipos.length === 0) {
      showErrorAlert('Error', 'Por favor selecciona al menos un equipo para eliminar su reserva.');
      return;
    }

    try {
      const result = await showConfirmAlert(
        '¿Estás seguro?', 
        `¿Deseas eliminar ${selectedEquipos.length} reserva(s) seleccionada(s)?`,
        'Sí, eliminar',
        'Cancelar'
      );

      console.log('Resultado de confirmación:', result); // Debug

      if (result) { // Cambiado de result.isConfirmed a result
        console.log('Iniciando eliminación de reservas...'); // Debug
        
        // Crear promesas para eliminar todas las reservas
        const deletePromises = selectedEquipos.map(async (equipoId) => {
          console.log('Eliminando reserva con ID:', equipoId); // Debug
          return await deleteReservation(equipoId);
        });
        
        // Ejecutar todas las eliminaciones en paralelo
        await Promise.all(deletePromises);
        
        showSuccessAlert(
          'Reservas eliminadas',
          `Se eliminaron ${selectedEquipos.length} reserva(s) correctamente.`
        );
        
        // Limpiar estado del modal
        handleCloseModal();
        
        // Notificar al componente padre INMEDIATAMENTE
        console.log('🔄 Notificando al padre para refrescar datos...');
        if (onReservationDeleted) {
          onReservationDeleted();
        }
      }
    } catch (error) {
      console.error('Error al eliminar reservas:', error);
      showErrorAlert('Error', 'No se pudieron eliminar algunas reservas. Inténtalo de nuevo.');
    }
  };

  // Función específica para eliminar TODAS las reservas
  const handleEliminarTodasLasReservas = async () => {
    console.log('🔥 handleEliminarTodasLasReservas ejecutándose...'); // Debug
    console.log('equiposReservados:', equiposReservados); // Debug
    
    if (equiposReservados.length === 0) {
      showErrorAlert('Error', 'No hay reservas para eliminar.');
      return;
    }

    try {
      const result = await showConfirmAlert(
        '⚠️ ¿Eliminar TODAS las reservas?', 
        `¿Estás seguro de eliminar TODAS las ${equiposReservados.length} reserva(s) de este laboratorio? Esta acción no se puede deshacer.`,
        'Sí, eliminar TODAS',
        'Cancelar'
      );

      console.log('Resultado de confirmación para TODAS:', result); // Debug

      if (result) {
        console.log('Iniciando eliminación de TODAS las reservas...'); // Debug
        
        // Obtener todos los IDs directamente de equiposReservados
        const todosLosIds = equiposReservados.map(equipo => equipo.id);
        console.log('IDs a eliminar:', todosLosIds); // Debug
        
        // Crear promesas para eliminar todas las reservas
        const deletePromises = todosLosIds.map(async (equipoId) => {
          console.log('Eliminando reserva con ID:', equipoId); // Debug
          return await deleteReservation(equipoId);
        });
        
        // Ejecutar todas las eliminaciones en paralelo
        await Promise.all(deletePromises);
        
        showSuccessAlert(
          '🗑️ Todas las reservas eliminadas',
          `Se eliminaron TODAS las ${todosLosIds.length} reserva(s) del laboratorio correctamente.`
        );
        
        // Limpiar estado del modal
        handleCloseModal();
        
        // Notificar al componente padre INMEDIATAMENTE
        console.log('🔄 Notificando al padre para refrescar datos tras eliminar TODAS...');
        if (onReservationDeleted) {
          onReservationDeleted();
        }
      }
    } catch (error) {
      console.error('Error al eliminar TODAS las reservas:', error);
      showErrorAlert('Error', 'No se pudieron eliminar todas las reservas. Inténtalo de nuevo.');
    }
  };

  // Función para eliminar una reserva específica
  const handleEliminarEquipoEspecifico = async (equipoId, numeroEquipo) => {
    console.log('handleEliminarEquipoEspecifico ejecutándose...'); // Debug
    console.log('equipoId:', equipoId, 'numeroEquipo:', numeroEquipo); // Debug
    
    const result = await showConfirmAlert(
      '¿Eliminar reserva?', 
      `¿Deseas eliminar la reserva del PC ${numeroEquipo}?`,
      'Sí, eliminar',
      'Cancelar'
    );

    console.log('Resultado de confirmación específico:', result); // Debug

    if (result) { // Cambiado de result.isConfirmed a result
      try {
        console.log('Eliminando reserva específica con ID:', equipoId); // Debug
        await deleteReservation(equipoId);
        showSuccessAlert('Reserva eliminada', `Reserva del PC ${numeroEquipo} eliminada correctamente.`);
        
        // Actualizar la lista de equipos
        setEquiposReservados(prev => prev.filter(e => e.id !== equipoId));
        setSelectedEquipos(prev => prev.filter(id => id !== equipoId));
        
        if (onReservationDeleted) {
          onReservationDeleted();
        }
      } catch (error) {
        console.error('Error al eliminar reserva:', error);
        showErrorAlert('Error', 'No se pudo eliminar la reserva. Inténtalo de nuevo.');
      }
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const obtenerNombreLaboratorio = (pcId) => {
    if (pcId >= 1 && pcId <= 40) return 'LAB 1';
    if (pcId >= 41 && pcId <= 60) return 'LAB 2';
    if (pcId >= 61 && pcId <= 80) return 'LAB 3';
    return 'LABORATORIO';
  };

  // Mapa para relacionar reservas con bloques horarios
  const reservationMap = {};

  reservations.forEach(reserva => {
    if (!reserva || !reserva.horaInicio || !reserva.horaTermino) {
      console.warn('Reserva inválida:', reserva);
      return;
    }

    const pcId = reserva.pcId;
    const horaInicio = reserva.horaInicio.substring(0, 5);
    const horaTermino = reserva.horaTermino.substring(0, 5);

    console.log(`Procesando reserva - PC: ${pcId}, Inicio: ${horaInicio}, Fin: ${horaTermino}`); // Debug

    horas.forEach(horaBloqueStr => {
      const [inicioBloque] = horaBloqueStr.split(' - ');
      if (inicioBloque >= horaInicio && inicioBloque < horaTermino) {
        const key = `${pcId}-${inicioBloque}`;
        reservationMap[key] = reserva;
        console.log(`Agregada reserva para bloque ${key}`); // Debug
      }
    });
  });

  const getReservationInfo = (pcId, horaBloqueStr) => {
    const [horaBloque] = horaBloqueStr.split(' - ');
    const key = `${pcId}-${horaBloque}`;
    const reserva = reservationMap[key];

    if (!reserva) return null;

    // Verificar si es una reserva de bloque de clases (carrera = 'ADMIN')
    const isClassBlock = reserva.carrera === 'ADMIN';

    return (
      <div className={`reservation-info ${isClassBlock ? 'class-block-reservation' : ''}`}>
        {isClassBlock ? (
          <>
            <div className="class-block-title">📚 CLASES</div>
            <div className="class-block-subtitle">Administrador</div>
          </>
        ) : (
          <>
            <div className="rut">{reserva.rut}</div>
            {reserva.carrera && <div className="carrera">{reserva.carrera}</div>}
          </>
        )}
      </div>
    );
  };

  // Efecto de limpieza cuando el componente se desmonta
  useEffect(() => {
    return () => {
      // Limpiar estado inmediatamente
      setShowDeleteModal(false);
      setEquiposReservados([]);
      setSelectedEquipos([]);
      
      // Cerrar SweetAlert de forma segura
      setTimeout(() => {
        if (typeof Swal !== 'undefined' && Swal.close) {
          Swal.close();
        }
      }, 0);
      
      console.log(`🧹 [LAB ${labNumber}] BitacoraTable cleanup completed`);
    };
  }, []); // Solo al desmontar

  return (
    <div className="bitacora-table">
      <div className="table-controls">
        <div className="zoom-controls">
          <button className="zoom-button" onClick={handleZoomOut} title="Reducir">
            <i className="fas fa-search-minus"></i>
          </button>
          <span className="zoom-info">{formatZoom(scale)}</span>
          <button className="zoom-button" onClick={handleZoomIn} title="Aumentar">
            <i className="fas fa-search-plus"></i>
          </button>
          <button className="zoom-button" onClick={handleResetZoom} title="Restablecer tamaño">
            <i className="fas fa-undo"></i>
          </button>
        </div>
      </div>

      <div className="table-container">
        <table style={{ transform: `scale(${scale})` }}>
          <thead>
            <tr>
              <th>Horario</th>
              {Array.from({ length: numEquipos }, (_, i) => (
                <th key={i}>PC {startIndex + i}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {horas.map((hora, rowIndex) => (
              <tr key={rowIndex}>
                <td>{hora}</td>
                {Array.from({ length: numEquipos }, (_, colIndex) => {
                  const pcId = startIndex + colIndex;
                  const info = getReservationInfo(pcId, hora);
                  const isClassBlock = info && reservationMap[`${pcId}-${hora.split(' - ')[0]}`]?.carrera === 'ADMIN';
                  const hasReservation = !!info;
                  return (
                    <td key={colIndex} className={`${hasReservation ? 'reservado' : ''} ${isClassBlock ? 'class-block-cell' : ''}`}>
                      {info}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

            {/* Modal para liberar equipos */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <i className="fas fa-question-circle" style={{ color: '#3498db', fontSize: '2rem', marginRight: '10px' }}></i>
                <h3>Eliminar Reservas</h3>
              </div>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            
            <div className="modal-body">
              {date && (
                <div className="lab-info">
                  <h4>Equipos reservados en LAB{labNumber} el {new Date(date + 'T00:00:00').toLocaleDateString('es-ES')}:</h4>
                </div>
              )}

              {equiposReservados.length === 0 ? (
                <div className="no-equipos">
                  <p>No hay equipos reservados para este día.</p>
                </div>
              ) : (
                <>
                  <div className="equipos-list">
                    {equiposReservados.map((equipo) => (
                      <div key={equipo.id} className="equipo-item">
                        <div className="equipo-checkbox">
                          <input
                            type="checkbox"
                            id={`equipo-${equipo.id}`}
                            checked={selectedEquipos.includes(equipo.id)}
                            onChange={() => toggleEquipoSelection(equipo.id)}
                          />
                        </div>
                        <div className="equipo-info">
                          <div className="equipo-main">
                            <span className="pc-number">PC {equipo.numeroEquipo}</span>
                            <span className="time-range">{equipo.horaInicio} - {equipo.horaFin}</span>
                          </div>
                          <div className="equipo-details">
                            <span className="reserva-type">
                              <i className="fas fa-user"></i> {equipo.tipoReserva}
                            </span>
                            {equipo.usuario && (
                              <span className="user-name">
                                {equipo.usuario.rut} - {equipo.carrera}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="modal-actions">
                    <button 
                      className="btn-seleccionar"
                      onClick={selectedEquipos.length === equiposReservados.length ? deselectAllEquipos : selectAllEquipos}
                    >
                      <i className="fas fa-check-square"></i>
                      {selectedEquipos.length === equiposReservados.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                    </button>
                    
                    <button 
                      className="btn-eliminar-especifico"
                      onClick={handleEliminarEquipos}
                      disabled={selectedEquipos.length === 0}
                    >
                      <i className="fas fa-trash-alt"></i>
                      Eliminar equipo específico
                    </button>
                    
                    <button 
                      className="btn-eliminar-todos"
                      onClick={handleEliminarTodasLasReservas}
                    >
                      <i className="fas fa-trash"></i>
                      Eliminar TODAS las reservas
                    </button>
                    
                    <button 
                      className="btn-cancelar"
                      onClick={handleCloseModal}
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BitacoraTable;
