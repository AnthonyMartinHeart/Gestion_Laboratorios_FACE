import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import '@styles/SelectPC.css';

import { useCreateReservation } from '@hooks/useReservations.jsx';

const SelectPC = () => {
  const { labId } = useParams();
  const navigate = useNavigate();

  let pcStart = 1, pcEnd = 40;
  if (labId === 'lab2') { pcStart = 41; pcEnd = 60; }
  else if (labId === 'lab3') { pcStart = 61; pcEnd = 80; }

  const pcs = Array.from({ length: pcEnd - pcStart + 1 }, (_, i) => pcStart + i);

  const carreras = [
    "CPA",
    "ICO",
    "ICINF",
    "IECI",
    "DRCH"
  ];

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

  const { mutate: createReservation, loading } = useCreateReservation();

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!selectedPC) {
        navigate('/home');
      }
    }, 60000);

    return () => clearTimeout(timeout);
  }, [selectedPC, navigate]);

  const handlePCClick = (pcNumber) => {
    setSelectedPC(pcNumber);
    setShowForm(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Validar formato básico RUT (acepta puntos y guion)
  const validarRut = (rut) => {
    const rutLimpio = rut.replace(/\./g, '');
    const regex = /^\d{7,8}-?[\dkK]$/i;
    return regex.test(rutLimpio);
  };

  // Convertir "HH:MM" a minutos
  const horaAMinutos = (hora) => {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Limpiar puntos para validación y envío
    const rutLimpio = formData.rut.replace(/\./g, '');

    if (!validarRut(formData.rut)) {
      Swal.fire('Error', 'El RUT ingresado no tiene un formato válido.', 'error');
      return;
    }

    if (!carreras.includes(formData.carrera)) {
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

    const reservationData = {
      rut: rutLimpio,  // enviamos sin puntos
      carrera: formData.carrera,
      horaInicio: formData.horaInicio,
      horaTermino: formData.horaTermino,
      labId: labId === 'lab1' ? 1 : labId === 'lab2' ? 2 : 3,
      pcId: selectedPC,
      fechaReserva: new Date().toISOString().split('T')[0],
    };

    const { success, error } = await createReservation(reservationData);

    if (success) {
      Swal.fire('¡Reserva creada!', `Tu reserva para el PC ${selectedPC} fue registrada con éxito.`, 'success');
      setShowForm(false);
      setFormData({ rut: '', carrera: '', horaInicio: '', horaTermino: '' });
      setSelectedPC(null);
    } else {
      Swal.fire('Error', error || 'No se pudo crear la reserva. Inténtalo nuevamente.', 'error');
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
            className="pc-icon"
            onClick={() => handlePCClick(pcNumber)}
            style={{ cursor: 'pointer' }}
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
                value={formData.carrera}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="">Selecciona tu carrera</option>
                {carreras.map((carrera) => (
                  <option key={carrera} value={carrera}>{carrera}</option>
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
