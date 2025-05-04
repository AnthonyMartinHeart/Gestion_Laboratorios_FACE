import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import '@styles/SelectPC.css';

const SelectPC = () => {
  const { labId } = useParams();
  const navigate = useNavigate();

  let pcStart = 1, pcEnd = 40;
  if (labId === 'lab2') { pcStart = 41; pcEnd = 60; }
  else if (labId === 'lab3') { pcStart = 61; pcEnd = 80; }

  const pcs = Array.from({ length: pcEnd - pcStart + 1 }, (_, i) => pcStart + i);

  const [showForm, setShowForm] = useState(false);
  const [selectedPC, setSelectedPC] = useState(null);
  const [formData, setFormData] = useState({
    rut: '',
    carrera: '',
    horaInicio: '',
    horaTermino: ''
  });

  // ⏳ Redirige a /home si no se selecciona un PC en 1 minuto
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!selectedPC) {
        navigate('/home');
      }
    }, 60000); // 60000 ms = 1 minuto

    return () => clearTimeout(timeout); // Limpia el timeout si el componente se desmonta
  }, [selectedPC, navigate]);

  const handlePCClick = (pcNumber) => {
    setSelectedPC(pcNumber);
    setShowForm(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(`Reserva confirmada para PC ${selectedPC}`, formData);
    setShowForm(false);
    // Aquí puedes agregar lógica para enviar los datos a backend o localStorage
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
              <input type="text" name="rut" value={formData.rut} onChange={handleChange} required />

              <label>Carrera:</label>
              <input type="text" name="carrera" value={formData.carrera} onChange={handleChange} required />

              <label>Hora de Inicio:</label>
              <input type="time" name="horaInicio" value={formData.horaInicio} onChange={handleChange} required />

              <label>Hora de Término:</label>
              <input type="time" name="horaTermino" value={formData.horaTermino} onChange={handleChange} required />

              <div className="form-buttons">
                <button type="submit">Confirmar Reserva</button>
                <button type="button" onClick={() => setShowForm(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectPC;
