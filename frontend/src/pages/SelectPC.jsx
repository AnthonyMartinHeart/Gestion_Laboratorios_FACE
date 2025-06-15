import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import '@styles/SelectPC.css';

import useCreateReservation from '@hooks/reservation/useCreateReservation.jsx';
import { formatRut } from '@helpers/rutFormatter.js';

const SelectPC = ({ onReservaCreada }) => {
  const { labId } = useParams();
  const navigate = useNavigate();

  let pcStart = 1, pcEnd = 40;
  if (labId === 'lab2') { pcStart = 41; pcEnd = 60; }
  else if (labId === 'lab3') { pcStart = 61; pcEnd = 80; }

  const pcs = Array.from({ length: pcEnd - pcStart + 1 }, (_, i) => pcStart + i);

  const carrerasMap = {
    "Contador Público y Auditor": "CPA",
    "Ingeniería Comercial": "ICO",
    "Ingeniería Civil en Informática": "ICINF",
    "Ingeniería de Ejecución en Computación e Informática": "IECI",
    "Derecho": "DRCH"
  };

  const carreras = Object.keys(carrerasMap);

  const horasInicio = [
    "08:10", "09:40", "11:10", "12:40",
    "14:10", "15:40", "17:10"
  ];

  const horasTermino = [
    "09:30", "11:00", "12:30", "14:00",
    "15:30", "17:00", "18:30", "20:00"
  ];

  const [showForm, setShowForm] = useState(false);
  const [selectedPC, setSelectedPC] = useState(null);
  const [formData, setFormData] = useState({
    rut: '',
    carrera: '',
    horaInicio: '',
    horaTermino: ''
  });

  const [reservedPCs, setReservedPCs] = useState(() => {
    // Intentar cargar las reservas guardadas al iniciar
    try {
      const saved = localStorage.getItem('reservedPCs');
      if (saved) {
        const parsedData = JSON.parse(saved);
        const now = new Date().getTime();
        
        // Filtrar solo las reservas que no han expirado
        const activeReservations = new Map();
        Object.entries(parsedData).forEach(([pcNumber, reservation]) => {
          const endTime = new Date(reservation.endTime).getTime();
          if (endTime > now) {
            activeReservations.set(parseInt(pcNumber), {
              ...reservation,
              timer: null // Los timers se recrearán
            });
          }
        });
        return activeReservations;
      }
    } catch (error) {
      console.error('Error loading saved reservations:', error);
    }
    return new Map();
  });

  const { handleCreate, loading } = useCreateReservation();

  // Guardar reservas en localStorage cuando cambien
  useEffect(() => {
    const reservationsObject = {};
    reservedPCs.forEach((value, key) => {
      reservationsObject[key] = {
        horaInicio: value.horaInicio,
        horaTermino: value.horaTermino,
        endTime: value.endTime
      };
    });
    localStorage.setItem('reservedPCs', JSON.stringify(reservationsObject));
  }, [reservedPCs]);

  const horaAMinutos = (hora) => {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  };

  const horaAMilisegundos = (hora) => {
    const hoy = new Date();
    const [horas, minutos] = hora.split(':').map(Number);
    const tiempo = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), horas, minutos);
    // Si la hora ya pasó hoy, asumimos que es para mañana
    if (tiempo < hoy) {
      tiempo.setDate(tiempo.getDate() + 1);
    }
    return tiempo.getTime();
  };

  // Configurar timers para todas las reservas activas al cargar el componente
  useEffect(() => {
    reservedPCs.forEach((reserva, pcNumber) => {
      if (!reserva.timer) {
        const now = new Date().getTime();
        const endTime = new Date(reserva.endTime).getTime();
        if (endTime > now) {
          const remainingTime = endTime - now;
          const timer = setTimeout(() => {
            setReservedPCs(prev => {
              const newMap = new Map(prev);
              newMap.delete(pcNumber);
              return newMap;
            });
          }, remainingTime);
          
          // Actualizar la reserva con el nuevo timer
          setReservedPCs(prev => {
            const newMap = new Map(prev);
            newMap.set(pcNumber, { ...reserva, timer });
            return newMap;
          });
        }
      }
    });

    // Limpiar todos los timers al desmontar
    return () => {
      reservedPCs.forEach(reserva => {
        if (reserva.timer) {
          clearTimeout(reserva.timer);
        }
      });
    };
  }, []); // Solo se ejecuta al montar el componente

  const calcularDuracionReserva = (horaInicio, horaTermino) => {
    const inicioMs = horaAMilisegundos(horaInicio);
    const terminoMs = horaAMilisegundos(horaTermino);
    return terminoMs - inicioMs;
  };

  const isReserved = useCallback((pcNumber) => {
    return reservedPCs.has(pcNumber);
  }, [reservedPCs]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!selectedPC) {
        navigate('/home');
      }
    }, 60000);

    return () => clearTimeout(timeout);
  }, [selectedPC, navigate]);

  // Limpiar los timers cuando el componente se desmonta
  useEffect(() => {
    return () => {
      reservedPCs.forEach(reserva => {
        if (reserva.timer) {
          clearTimeout(reserva.timer);
        }
      });
    };
  }, [reservedPCs]);

  const handlePCClick = (pcNumber) => {
    if (isReserved(pcNumber)) {
      const reserva = reservedPCs.get(pcNumber);
      Swal.fire('Equipo reservado', `Este PC está reservado desde ${reserva.horaInicio} hasta ${reserva.horaTermino}. Por favor selecciona otro.`, 'info');
      return;
    }
    setSelectedPC(pcNumber);
    setShowForm(true);
  };

  const handleChange = (e) => {
    if (e.target.name === 'carrera') {
      // Cuando se selecciona una carrera, guardamos la abreviatura
      setFormData({ 
        ...formData, 
        [e.target.name]: carrerasMap[e.target.value] 
      });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const validarRut = (rut) => {
    const rutLimpio = rut.replace(/\./g, '');
    const regex = /^\d{7,8}-?[\dkK]$/i;
    return regex.test(rutLimpio);
  };

  const configurarTimerReserva = (pcNumber, horaInicio, horaTermino) => {
    const startTime = horaAMilisegundos(horaInicio);
    const endTime = horaAMilisegundos(horaTermino);
    const now = new Date().getTime();
    
    if (endTime < now) {
      return null;
    }

    const duracion = endTime - now;
    const timer = setTimeout(() => {
      setReservedPCs(prev => {
        const newMap = new Map(prev);
        newMap.delete(pcNumber);
        return newMap;
      });
    }, duracion);

    return { timer, endTime };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const rutLimpio = formData.rut.replace(/\./g, '');

    if (!validarRut(formData.rut)) {
      Swal.fire('Error', 'El RUT ingresado no tiene un formato válido.', 'error');
      return;
    }

    // Validamos que la carrera sea una de las abreviaturas válidas
    if (!Object.values(carrerasMap).includes(formData.carrera)) {
      Swal.fire('Error', 'La carrera seleccionada no es válida.', 'error');
      return;
    }

    if (!horasInicio.includes(formData.horaInicio)) {
      Swal.fire('Error', 'La hora de inicio seleccionada no es válida.', 'error');
      return;
    }

    if (!horasTermino.includes(formData.horaTermino)) {
      Swal.fire('Error', 'La hora de término seleccionada no es válida.', 'error');
      return;
    }

    if (horaAMinutos(formData.horaInicio) >= horaAMinutos(formData.horaTermino)) {
      Swal.fire('Error', 'La hora de término debe ser mayor que la hora de inicio.', 'error');
      return;
    }

    if (!pcs.includes(selectedPC)) {
      Swal.fire('Error', 'El PC seleccionado no pertenece al laboratorio.', 'error');
      return;
    }

    if (isReserved(selectedPC)) {
      Swal.fire('Error', 'El PC ya está reservado. Por favor selecciona otro.', 'error');
      return;
    }

    try {
      const rutFormateado = formatRut(formData.rut);
      const reservationData = {
        rut: rutFormateado,
        carrera: formData.carrera,
        horaInicio: formData.horaInicio,
        horaTermino: formData.horaTermino,
        labId: labId === 'lab1' ? 1 : labId === 'lab2' ? 2 : 3,
        pcId: selectedPC
      };

      const result = await handleCreate(reservationData);

      if (result.success) {
        Swal.fire('¡Reserva creada!', `Tu reserva para el PC ${selectedPC} fue registrada con éxito.`, 'success');
        
        // Actualizar estado de reservas
        setReservedPCs(prev => {
          const newMap = new Map(prev);
          newMap.set(selectedPC, {
            horaInicio: formData.horaInicio,
            horaTermino: formData.horaTermino,
            endTime: horaAMilisegundos(formData.horaTermino),
            timer: configurarTimerReserva(selectedPC, formData.horaInicio, formData.horaTermino)
          });
          return newMap;
        });

        setShowForm(false);
        setFormData({ rut: '', carrera: '', horaInicio: '', horaTermino: '' });
        setSelectedPC(null);
        if (onReservaCreada) onReservaCreada();
      } else if (result.error) {
        if (result.error.includes('Ya tienes una reserva')) {
          Swal.fire('Error', 'Ya hay una reserva en ese horario. Intenta con otro equipo.', 'error');
        } else if (result.error.includes('El PC ya está reservado')) {
          Swal.fire('Error', 'El PC ya está reservado en ese horario. Intenta con otro equipo.', 'error');
        } else {
          Swal.fire('Error', result.error, 'error');
        }
      }
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      Swal.fire('Error', 'Error en el servidor. Por favor, intenta nuevamente más tarde.', 'error');
    }
  };

  return (
    <div className="pc-selection-container">
      <h3>Computadores Disponibles para {labId.toUpperCase()}</h3>
      <h6>Selecciona Tu PC 👇</h6>

      <div className="pc-grid">
        {pcs.map((pcNumber) => (
          <div
            key={pcNumber}
            className={`pc-icon ${isReserved(pcNumber) ? 'reserved' : ''}`}
            onClick={() => handlePCClick(pcNumber)}
            style={{ cursor: isReserved(pcNumber) ? 'not-allowed' : 'pointer' }}
          >
            <i className="fas fa-desktop"></i>
            <span>{pcNumber}</span>
          </div>
        ))}
      </div>

      <button onClick={() => navigate('/home')}>Volver a la página principal</button>

      {showForm && (
        <div className="popup-overlay">
          <div className="popup-form">
            <h4>PC {selectedPC} seleccionado - Confirmación de Reserva</h4>
            <form onSubmit={handleSubmit}>
              <label>RUT:</label>
              <input
                type="text"
                name="rut"
                value={formData.rut}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Ej: 12.345.678-9"
              />

              <label>Carrera:</label>
              <select
                name="carrera"
                value={Object.keys(carrerasMap).find(key => carrerasMap[key] === formData.carrera) || ''}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="">Selecciona tu carrera</option>
                {carreras.map((carrera) => (
                  <option key={carrera} value={carrera}>
                    {carrera}
                  </option>
                ))}
              </select>

              <label>Hora de Inicio:</label>
              <select
                name="horaInicio"
                value={formData.horaInicio}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="">Selecciona hora de inicio</option>
                {horasInicio.map((hora) => (
                  <option key={hora} value={hora}>{hora}</option>
                ))}
              </select>

              <label>Hora de Término:</label>
              <select
                name="horaTermino"
                value={formData.horaTermino}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="">Selecciona hora de término</option>
                {horasTermino.map((hora) => (
                  <option key={hora} value={hora}>{hora}</option>
                ))}
              </select>

              <div className="form-buttons">
                <button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : 'Confirmar Reserva'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!loading) {
                      setShowForm(false);
                      setFormData({ rut: '', carrera: '', horaInicio: '', horaTermino: '' });
                      setSelectedPC(null);
                    }
                  }}
                  disabled={loading}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectPC;
