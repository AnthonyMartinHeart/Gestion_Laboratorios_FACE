import { useState } from "react";

const horarios = ["8:00", "12:00", "15:00", "17:00", "19:00"];

const TurnosTable = () => {
  const filas = Array(8).fill(null);
  const [observaciones, setObservaciones] = useState(Array(8).fill(""));
  const [turnos, setTurnos] = useState(
    Array(8).fill({ entrada: "", salida: "" })
  );

  const handleObservacionChange = (index, value) => {
    const nuevasObservaciones = [...observaciones];
    nuevasObservaciones[index] = value;
    setObservaciones(nuevasObservaciones);
  };

  const handleTurnoChange = (index, tipo, value) => {
    const nuevosTurnos = [...turnos];
    nuevosTurnos[index] = {
      ...nuevosTurnos[index],
      [tipo]: value,
    };
    setTurnos(nuevosTurnos);
  };

  const handleGuardarHorario = (index) => {
    console.log(`Horario designado para fila ${index}:`, turnos[index]);
    // Aquí podrías agregar la lógica para guardar los datos en un backend o base de datos
  };

  return (
    <div className="turnos-container">
      <div className="turnos-table">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Turno Designado</th>
              <th>Marcar Entrada / Salida</th>
              <th>Observación</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((_, i) => (
              <tr key={i}>
                <td className="nombre-cell">Sin Nombre</td>

                <td className="turno-cell">
                  <div className="turno-designado">
                    <div>
                      <strong>Hora Entrada:</strong>
                      <select
                        value={turnos[i].entrada}
                        onChange={(e) =>
                          handleTurnoChange(i, "entrada", e.target.value)
                        }
                      >
                        <option value="">Sin Turno</option>
                        {horarios.map((hora, idx) => (
                          <option key={idx} value={hora}>
                            {hora}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <strong>Hora Salida:</strong>
                      <select
                        value={turnos[i].salida}
                        onChange={(e) =>
                          handleTurnoChange(i, "salida", e.target.value)
                        }
                      >
                        <option value="">Sin Turno</option>
                        {horarios.map((hora, idx) => (
                          <option key={idx} value={hora}>
                            {hora}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      className="guardar-button"
                      onClick={() => handleGuardarHorario(i)}
                    >
                      DESIGNAR HORARIO
                    </button>
                  </div>
                </td>

                <td className="button-cell">
                  <div>
                    <span>Marcar Entrada   </span>
                    <button className="entrada-button">🚪🧍‍♂️🔙</button>
                  </div>
                  <div>
                    <span>Marcar Salida   </span>
                    <button className="salida-button">🚪🧍‍♂️🔜</button>
                  </div>
                </td>

                <td className="observacion-cell">
                  <input
                    type="text"
                    value={observaciones[i]}
                    onChange={(e) =>
                      handleObservacionChange(i, e.target.value)
                    }
                    placeholder="Escribe observación..."
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TurnosTable;