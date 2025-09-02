import { useState, useEffect, useCallback } from 'react';
import { getAllReservations, updateReservation, deleteReservation } from '@services/reservation.service.js';
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from '@helpers/sweetAlert.js';
import { useAuth } from '@context/AuthContext';
import '@styles/misReservas.css';
import Swal from 'sweetalert2';

const MisReservas = () => {
  const [userData, setUserData] = useState(null);
  const [misReservas, setMisReservas] = useState([]);
  const [cargandoReservas, setCargandoReservas] = useState(false);
  const { user } = useAuth();

  // Solo los administradores pueden eliminar reservas
  const canDeleteReservations = user?.rol === 'administrador';

  const cargarMisReservas = useCallback(async () => {
    if (!userData || !userData.rut) return;

    try {
      setCargandoReservas(true);
      const reservas = await getAllReservations();
      
      if (Array.isArray(reservas)) {
        // Filtrar solo las reservas del usuario actual que están activas (no finalizadas)
        const reservasUsuario = reservas.filter(reserva => 
          reserva.rut === userData.rut && 
          reserva.carrera !== 'MAINTENANCE' && 
          reserva.carrera !== 'ADMIN' &&
          (!reserva.status || reserva.status === 'active') // Solo reservas activas
        );
        
        // Ordenar por fecha más reciente primero
        const reservasOrdenadas = reservasUsuario.sort((a, b) => {
          // Crear fechas locales para evitar problemas de zona horaria
          const fechaA = new Date(a.fechaReserva + 'T' + a.horaInicio + ':00');
          const fechaB = new Date(b.fechaReserva + 'T' + b.horaInicio + ':00');
          return fechaB - fechaA;
        });

        setMisReservas(reservasOrdenadas);
      } else {
        setMisReservas([]);
      }
    } catch (error) {
      console.error('Error al cargar mis reservas:', error);
      showErrorAlert('Error', 'No se pudo cargar tus reservas');
      setMisReservas([]);
    } finally {
      setCargandoReservas(false);
    }
  }, [userData]);

  useEffect(() => {
    let user = null;
    try {
      user = JSON.parse(sessionStorage.getItem("usuario")) || null;
    } catch (error) {
      user = null;
    }
    setUserData(user);
  }, []);

  useEffect(() => {
    if (userData && userData.rut) {
      cargarMisReservas();
    }
  }, [userData, cargarMisReservas]);

  const abrirModalEdicion = (reserva) => {
    console.log('Abriendo modal de edición para:', reserva);
    
    // Horarios disponibles - mismos que en SelectPC.jsx
    const horariosInicio = [
      "08:10", "09:40", "11:10", "12:40",
      "14:10", "15:40", "17:10"
    ];
    const horariosTermino = [
      "09:30", "11:00", "12:30", "14:00",
      "15:30", "17:00", "18:30", "20:00"
    ];

    // Función para obtener horarios válidos según la hora actual
    const getHorariosValidos = () => {
      const ahora = new Date();
      const horaActual = ahora.getHours();
      const minutoActual = ahora.getMinutes();
      const tiempoActualEnMinutos = horaActual * 60 + minutoActual;

      // Agregar 15 minutos de margen para dar tiempo a completar la edición
      const tiempoMinimoReserva = tiempoActualEnMinutos + 15;

      const horariosInicioValidos = horariosInicio.filter(hora => {
        const [h, m] = hora.split(':').map(Number);
        const tiempoHora = h * 60 + m;
        return tiempoHora >= tiempoMinimoReserva;
      });

      const horariosTerminoValidos = horariosTermino.filter(hora => {
        const [h, m] = hora.split(':').map(Number);
        const tiempoHora = h * 60 + m;
        return tiempoHora > tiempoMinimoReserva;
      });

      return {
        inicioValidos: horariosInicioValidos,
        terminoValidos: horariosTerminoValidos
      };
    };

    // Función para obtener horarios de término válidos según la hora de inicio seleccionada
    const getHorariosTerminoValidos = (horaInicioSeleccionada) => {
      if (!horaInicioSeleccionada) return [];

      const { terminoValidos } = getHorariosValidos();
      const inicioEnMinutos = horaInicioSeleccionada.split(':').map(Number);
      const inicioTotal = inicioEnMinutos[0] * 60 + inicioEnMinutos[1];

      return terminoValidos.filter(hora => {
        const terminoEnMinutos = hora.split(':').map(Number);
        const terminoTotal = terminoEnMinutos[0] * 60 + terminoEnMinutos[1];
        return terminoTotal > inicioTotal;
      });
    };

    const horariosValidos = getHorariosValidos();

    // Verificar si hay horarios disponibles
    if (horariosValidos.inicioValidos.length === 0) {
      const horaActual = new Date().toLocaleTimeString('es-CL', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      
      Swal.fire({
        title: 'Sin horarios disponibles',
        html: `
          <div style="text-align: center;">
            <p>No hay horarios disponibles para editar en este momento.</p>
            <p><strong>Hora actual:</strong> ${horaActual}</p>
            <br>
            <p>Los horarios de laboratorio son:</p>
            <ul style="text-align: left; margin: 10px auto; display: inline-block;">
              <li>08:10 - 09:30</li>
              <li>09:40 - 11:00</li>
              <li>11:10 - 12:30</li>
              <li>12:40 - 14:00</li>
              <li>14:10 - 15:30</li>
              <li>15:40 - 17:00</li>
              <li>17:10 - 18:30</li>
              <li>Hasta las 20:00</li>
            </ul>
          </div>
        `,
        icon: 'info',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    Swal.fire({
      title: 'Editar Reserva',
      html: `
        <div style="text-align: left;">
          <p><strong>PC:</strong> ${reserva.pcId}</p>
          <p><strong>Laboratorio:</strong> ${obtenerNombreLaboratorio(reserva.pcId)}</p>
          <p><strong>Fecha:</strong> ${formatearFecha(reserva.fechaReserva)}</p>
          
          <div style="margin: 15px 0;">
            <label for="horaInicio" style="display: block; margin-bottom: 5px; font-weight: bold;">Hora de inicio:</label>
            <select id="horaInicio" class="swal2-input" style="margin-bottom: 10px;">
              <option value="">Selecciona hora de inicio</option>
              ${horariosValidos.inicioValidos.map(hora => 
                `<option value="${hora}" ${hora === reserva.horaInicio ? 'selected' : ''}>${hora}</option>`
              ).join('')}
            </select>
            
            <label for="horaTermino" style="display: block; margin-bottom: 5px; font-weight: bold;">Hora de término:</label>
            <select id="horaTermino" class="swal2-input">
              <option value="">Selecciona hora de término</option>
            </select>
          </div>
          
          <div id="info-horarios" style="margin-top: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px; font-size: 14px;">
            <p style="margin: 0; color: #666;">
              ⏰ <strong>Hora actual:</strong> ${new Date().toLocaleTimeString('es-CL', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              })}
            </p>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar Cambios',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3498db',
      didOpen: () => {
        const horaInicioSelect = document.getElementById('horaInicio');
        const horaTerminoSelect = document.getElementById('horaTermino');
        
        // Función para actualizar horarios de término
        const actualizarHorariosTermino = () => {
          const horaInicioSeleccionada = horaInicioSelect.value;
          const horariosTerminoDisponibles = getHorariosTerminoValidos(horaInicioSeleccionada);
          
          // Limpiar opciones actuales
          horaTerminoSelect.innerHTML = '<option value="">Selecciona hora de término</option>';
          
          // Agregar nuevas opciones
          horariosTerminoDisponibles.forEach(hora => {
            const option = document.createElement('option');
            option.value = hora;
            option.textContent = hora;
            if (hora === reserva.horaTermino && horaInicioSeleccionada === reserva.horaInicio) {
              option.selected = true;
            }
            horaTerminoSelect.appendChild(option);
          });
        };
        
        // Inicializar horarios de término si hay una hora de inicio seleccionada
        if (horaInicioSelect.value) {
          actualizarHorariosTermino();
        }
        
        // Agregar listener para cambios en hora de inicio
        horaInicioSelect.addEventListener('change', actualizarHorariosTermino);
      },
      preConfirm: () => {
        const horaInicio = document.getElementById('horaInicio').value;
        const horaTermino = document.getElementById('horaTermino').value;
        
        if (!horaInicio || !horaTermino) {
          Swal.showValidationMessage('Debes seleccionar ambos horarios');
          return false;
        }
        
        if (horaInicio >= horaTermino) {
          Swal.showValidationMessage('La hora de inicio debe ser menor que la hora de término');
          return false;
        }
        
        return { horaInicio, horaTermino };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        await editarReserva(reserva.id, result.value);
      }
    });
  };

  const editarReserva = async (reservaId, nuevosHorarios) => {
    try {
      // Encontrar la reserva completa para obtener todos los datos necesarios
      const reservaCompleta = misReservas.find(r => r.id === reservaId);
      if (!reservaCompleta) {
        throw new Error('No se encontró la reserva');
      }

      const datosActualizacion = {
        rut: reservaCompleta.rut,
        carrera: reservaCompleta.carrera,
        labId: reservaCompleta.labId,
        pcId: reservaCompleta.pcId,
        horaInicio: nuevosHorarios.horaInicio,
        horaTermino: nuevosHorarios.horaTermino
      };

      const resultado = await updateReservation(reservaId, datosActualizacion);
      
      if (resultado && !resultado.error) {
        showSuccessAlert('¡Éxito!', 'Tu reserva ha sido actualizada correctamente');
        // Recargar las reservas inmediatamente
        await cargarMisReservas();
      } else {
        throw new Error(resultado.error || 'Error al actualizar la reserva');
      }
    } catch (error) {
      console.error('Error al editar reserva:', error);
      showErrorAlert('Error', 'No se pudo actualizar la reserva: ' + error.message);
    }
  };

  const eliminarReserva = async (reserva) => {
    console.log('Intentando eliminar reserva:', reserva);
    try {
      const confirmar = await showConfirmAlert(
        '¿Estás seguro?',
        `¿Quieres eliminar tu reserva del PC ${reserva.pcId} para el ${formatearFecha(reserva.fechaReserva)} de ${reserva.horaInicio} a ${reserva.horaTermino}?`,
        'Sí, eliminar',
        'Cancelar'
      );

      if (confirmar) {
        const resultado = await deleteReservation(reserva.id);
        
        if (resultado && !resultado.error) {
          showSuccessAlert('¡Eliminada!', 'Tu reserva ha sido eliminada correctamente');
          // Recargar las reservas inmediatamente
          await cargarMisReservas();
        } else {
          throw new Error(resultado.error || 'Error al eliminar la reserva');
        }
      }
    } catch (error) {
      console.error('Error al eliminar reserva:', error);
      showErrorAlert('Error', 'No se pudo eliminar la reserva: ' + error.message);
    }
  };

  const formatearFecha = (fecha) => {
    // Crear fecha local para evitar problemas de zona horaria
    const fechaLocal = new Date(fecha + 'T00:00:00');
    return fechaLocal.toLocaleDateString('es-CL', {
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

  const esReservaPasada = (reserva) => {
    // Temporalmente devolver siempre false para mostrar todos los botones
    return false;
  };

  if (!userData) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="mis-reservas-container">
      <h1>Mis Reservas</h1>
      
      <div className="mis-reservas-content">
        {cargandoReservas ? (
          <div className="cargando">
            <p>Cargando tus reservas...</p>
          </div>
        ) : (
          <>
            <div className="reservas-header">
              <h2>Reservas Activas</h2>
              <button 
                className="btn-actualizar" 
                onClick={cargarMisReservas}
                disabled={cargandoReservas}
              >
                {cargandoReservas ? 'Actualizando...' : '🔄 Actualizar'}
              </button>
            </div>

            <div className="reservas-lista">
              {misReservas.length === 0 ? (
                <p className="sin-reservas">No tienes reservas activas</p>
              ) : (
                misReservas.map((reserva) => (
                  <div key={reserva.id} className={`reserva-card ${esReservaPasada(reserva) ? 'reserva-pasada' : ''}`}>
                    <div className="reserva-info">
                      <div className="reserva-principal">
                        <span className="laboratorio">{obtenerNombreLaboratorio(reserva.pcId)}</span>
                        <span className="pc">PC {reserva.pcId}</span>
                        <span className="fecha">{formatearFecha(reserva.fechaReserva)}</span>
                      </div>
                      <div className="reserva-detalle">
                        <span className="horario">
                          {reserva.horaInicio} - {reserva.horaTermino}
                        </span>
                        {reserva.status && (
                          <span className={`estado estado-${reserva.status}`}>
                            {reserva.status === 'finished' ? 'Finalizada' : 
                             reserva.status === 'active' ? 'Activa' : reserva.status}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="reserva-acciones">
                      <button 
                        className="btn-editar"
                        onClick={() => {
                          console.log('Click en editar:', reserva);
                          abrirModalEdicion(reserva);
                        }}
                        title="Editar horarios"
                        disabled={cargandoReservas}
                      >
                        ✏️ Editar
                      </button>
                      
                      {/* Solo mostrar el botón eliminar si el usuario es administrador */}
                      {canDeleteReservations && (
                        <button 
                          className="btn-eliminar"
                          onClick={() => {
                            console.log('Click en eliminar:', reserva);
                            eliminarReserva(reserva);
                          }}
                          title="Eliminar reserva"
                          disabled={cargandoReservas}
                        >
                          🗑️ Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MisReservas;
