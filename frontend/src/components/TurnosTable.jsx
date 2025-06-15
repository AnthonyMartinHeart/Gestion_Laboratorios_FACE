import { useState } from "react";
import SweetAlert from "react-sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const horarios = ["12:00", "15:00", "17:00", "19:00"];

const TurnosTable = () => {
  const filas = Array(3).fill(null);
  const [observaciones, setObservaciones] = useState(Array(3).fill(""));
  const [turnos, setTurnos] = useState(Array(3).fill({ entrada: "", salida: "" }));
  const [swalProps, setSwalProps] = useState({});
  const [isEditing, setIsEditing] = useState(null);
  const [activeHorarioIndex, setActiveHorarioIndex] = useState(null);

  const handleObservacionChange = (index, value) => {
    const nuevasObservaciones = [...observaciones];
    nuevasObservaciones[index] = value;
    setObservaciones(nuevasObservaciones);
  };

  const handleTurnoChange = (index, tipo, value) => {
    const nuevosTurnos = [...turnos];
    nuevosTurnos[index] = { ...nuevosTurnos[index], [tipo]: value };
    setTurnos(nuevosTurnos);
  };

  const handleGuardarHorario = (index) => {
    setSwalProps({
      show: true,
      title: `Horario asignado a la fila ${index + 1}`,
      text: `Entrada: ${turnos[index].entrada || "No definida"}\nSalida: ${turnos[index].salida || "No definida"}`,
      icon: "success",
    });
    setActiveHorarioIndex(null);
  };

  const handleGuardarObservacion = (index) => {
    setSwalProps({
      show: true,
      title: `Observación guardada`,
      text: observaciones[index] || "Sin observación escrita.",
      icon: "info",
    });
    setIsEditing(null);
  };

  const handleMarcarEntrada = (index) => {
    const horaActual = new Date().toLocaleTimeString();
    setSwalProps({
      show: true,
      title: `Entrada registrada`,
      text: `Fila ${index + 1} - Hora: ${horaActual}`,
      icon: "success",
    });
  };

  const handleMarcarSalida = (index) => {
    const horaActual = new Date().toLocaleTimeString();
    setSwalProps({
      show: true,
      title: `Salida registrada`,
      text: `Fila ${index + 1} - Hora: ${horaActual}`,
      icon: "warning",
    });
  };

  return (
    <div className="turnos-container">
      {/* Tabla */}
      <div className="turnos-table">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Turno Designado</th>
              <th>Acciones</th>
              <th>Observación</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((_, i) => (
              <tr key={i}>
                <td className="nombre-cell">Sin Nombre</td>

                <td className="turno-cell">
                  {activeHorarioIndex === i ? (
                    <>
                      <strong>Hora Entrada:</strong>
                      <select
                        value={turnos[i].entrada}
                        onChange={(e) => handleTurnoChange(i, "Entrada", e.target.value)}
                      >
                        <option value="">Sin Turno</option>
                        {horarios.map((hora, idx) => (
                          <option key={idx} value={hora}>{hora}</option>
                        ))}
                      </select>

                      <strong>Hora Salida:</strong>
                      <select
                        value={turnos[i].salida}
                        onChange={(e) => handleTurnoChange(i, "Salida", e.target.value)}
                      >
                        <option value="">Sin Turno</option>
                        {horarios.map((hora, idx) => (
                          <option key={idx} value={hora}>{hora}</option>
                        ))}
                      </select>

                      <button className="guardar-button" onClick={() => handleGuardarHorario(i)}>
                        ASIGNAR
                      </button>
                    </>
                  ) : (
                    <>
                      <p><strong>Entrada:</strong> {turnos[i].entrada || "Sin turno"}</p>
                      <p><strong>Salida:</strong> {turnos[i].salida || "Sin turno"}</p>
                      <button className="editar-observacion-button" onClick={() => setActiveHorarioIndex(i)}>
                        Seleccionar Horario
                      </button>
                    </>
                  )}
                </td>

                <td className="button-cell">
                  <div>
                    <span>Entrada:  </span>
                    <button className="entrada-button" onClick={() => handleMarcarEntrada(i)}>
                      🟢
                    </button>
                  </div>
                  <div>
                    <span>Salida:  </span>
                    <button className="salida-button" onClick={() => handleMarcarSalida(i)}>
                      ❌
                    </button>
                  </div>
                </td>

                <td className="observacion-cell">
                  {isEditing === i ? (
                    <>
                      <input
                        type="text"
                        value={observaciones[i]}
                        onChange={(e) => handleObservacionChange(i, e.target.value)}
                        placeholder="Escribe observación..."
                      />
                      <button className="guardar-observacion-button" onClick={() => handleGuardarObservacion(i)}>
                        Guardar
                      </button>
                    </>
                  ) : (
                    <>
                      <span>{observaciones[i] || "Ninguna   "}</span>
                      <button className="editar-observacion-button" onClick={() => setIsEditing(i)}>
                        Editar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SweetAlert {...swalProps} onConfirm={() => setSwalProps({})} />
    </div>
  );
};

export default TurnosTable;
