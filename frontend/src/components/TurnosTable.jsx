import { useState, useEffect } from "react";
import SweetAlert from "react-sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { getUsers, getUserByRut } from "@services/user.service.js";
import { getTurnosByFecha, saveOrUpdateTurno } from "@services/turnos.service.js";
import { useAuth } from "@context/AuthContext.jsx";

const horarios = [
  "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "13:00 PM", "14:00 PM", "15:00 PM", "16:00 PM", "17:00 PM", "18:00 PM", "19:00 PM", "20:00 PM"
];

const TurnosTable = ({ selectedDate }) => {
  const { user } = useAuth();
  const [consultores, setConsultores] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [observaciones, setObservaciones] = useState({});
  const [swalProps, setSwalProps] = useState({});
  const [isEditing, setIsEditing] = useState(null);
  const [activeHorarioIndex, setActiveHorarioIndex] = useState(null);

  // Cargar consultores y administradores
  useEffect(() => {
    if (!user) return;
    if (user.rol.toLowerCase() === "consultor") {
      // Consultor: solo su propio usuario
      getUserByRut(user.rut).then(consultor => {
        setConsultores(consultor ? [consultor] : []);
      });
    } else {
      // Administrador: todos los consultores
      getUsers().then(users => {
        setConsultores(users.filter(u => u.rol.toLowerCase() === "consultor"));
      });
    }
  }, [user]);

  // Cargar turnos de localStorage por fecha
  const fetchTurnos = () => {
    if (selectedDate) {
      setTurnos(getTurnosByFecha(selectedDate));
    }
  };
  useEffect(fetchTurnos, [selectedDate]);

  const handleObservacionChange = (index, value) => {
    const nuevasObservaciones = { ...observaciones };
    nuevasObservaciones[index] = value;
    setObservaciones(nuevasObservaciones);
  };

  const handleTurnoChange = (index, tipo, value) => {
    const nuevosTurnos = { ...turnos };
    nuevosTurnos[index] = { ...nuevosTurnos[index], [tipo]: value };
    setTurnos(nuevosTurnos);
  };

  const handleGuardarHorario = (index) => {
    setSwalProps({
      show: true,
      title: `Horario asignado al consultor ${consultores[index].nombre}`,
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
      text: `Consultor ${consultores[index].nombre} - Hora: ${horaActual}`,
      icon: "success",
    });
  };

  const handleMarcarSalida = (index) => {
    const horaActual = new Date().toLocaleTimeString();
    setSwalProps({
      show: true,
      title: `Salida registrada`,
      text: `Consultor ${consultores[index].nombre} - Hora: ${horaActual}`,
      icon: "warning",
    });
  };

  // Guardar turno/observación en localStorage
  const handleGuardar = (i, consultor, extra = {}) => {
    const turno = turnos.find(t => t.rut === consultor.rut) || {};
    const newTurno = {
      rut: consultor.rut,
      nombre: consultor.nombreCompleto,
      fecha: selectedDate,
      horaEntradaAsignada: turno.horaEntradaAsignada || "",
      horaSalidaAsignada: turno.horaSalidaAsignada || "",
      horaEntradaMarcada: extra.horaEntradaMarcada || turno.horaEntradaMarcada || "",
      horaSalidaMarcada: extra.horaSalidaMarcada || turno.horaSalidaMarcada || "",
      observacion: observaciones[i] !== undefined ? observaciones[i] : turno.observacion || "",
    };
    if (activeHorarioIndex === i) {
      newTurno.horaEntradaAsignada = turnos[i]?.entrada || turno.horaEntradaAsignada || "";
      newTurno.horaSalidaAsignada = turnos[i]?.salida || turno.horaSalidaAsignada || "";
    }
    saveOrUpdateTurno(selectedDate, newTurno);
    
    // Mostrar mensaje específico según el tipo de marcado
    let message = 'Turno guardado';
    if (extra.horaEntradaMarcada) {
      message = `Entrada marcada a las ${extra.horaEntradaMarcada}`;
    } else if (extra.horaSalidaMarcada) {
      message = `Salida marcada a las ${extra.horaSalidaMarcada}`;
    }
    
    setSwalProps({ show: true, title: 'Turno Marcado', text: message, icon: 'success' });
    setActiveHorarioIndex(null);
    setIsEditing(null);
    fetchTurnos();
  };

  // Validaciones de permisos
  const puedeEditar = (consultor) => {
    if (!user) return false;
    if (user.rol.toLowerCase() === "administrador") return true;
    if (user.rol.toLowerCase() === "consultor" && user.rut === consultor.rut) return true;
    return false;
  };

  return (
    <div className="turnos-container">
      <div className="turnos-table">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Turno Designado</th>
              <th>Horario Marcado</th>
              <th>Acciones</th>
              <th>Observación</th>
            </tr>
          </thead>
          <tbody>
            {consultores.length === 0 ? (
              <tr><td colSpan={5}>No hay consultores para mostrar.</td></tr>
            ) : (
              consultores.map((consultor, i) => {
                const turno = turnos.find(t => t.rut === consultor.rut) || {};
                return (
                  <tr key={consultor.rut}>
                    <td className="nombre-cell">{consultor.nombreCompleto}</td>
                    <td className="turno-cell">
                      {activeHorarioIndex === i && user.rol.toLowerCase() === 'administrador' ? (
                        // Solo el administrador puede ver los selects para asignar horario
                        <>
                          <strong>Hora Entrada:</strong>
                          <select
                            value={turno.horaEntradaAsignada || ""}
                            onChange={e => {
                              const nuevos = [...turnos];
                              const idx = nuevos.findIndex(t => t.rut === consultor.rut);
                              if (idx >= 0) nuevos[idx].horaEntradaAsignada = e.target.value;
                              else nuevos.push({ rut: consultor.rut, horaEntradaAsignada: e.target.value });
                              setTurnos(nuevos);
                            }}
                          >
                            <option value="">Sin Turno</option>
                            {horarios.map((hora, idx) => (
                              <option key={idx} value={hora}>{hora}</option>
                            ))}
                          </select>
                          <strong>Hora Salida:</strong>
                          <select
                            value={turno.horaSalidaAsignada || ""}
                            onChange={e => {
                              const nuevos = [...turnos];
                              const idx = nuevos.findIndex(t => t.rut === consultor.rut);
                              if (idx >= 0) nuevos[idx].horaSalidaAsignada = e.target.value;
                              else nuevos.push({ rut: consultor.rut, horaSalidaAsignada: e.target.value });
                              setTurnos(nuevos);
                            }}
                          >
                            <option value="">Sin Turno</option>
                            {horarios.map((hora, idx) => (
                              <option key={idx} value={hora}>{hora}</option>
                            ))}
                          </select>
                          <button className="guardar-button" onClick={() => handleGuardar(i, consultor)}>
                            GUARDAR
                          </button>
                          <button className="cancelar-button" onClick={() => setActiveHorarioIndex(null)}>
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <p><strong>Entrada:</strong> {turno.horaEntradaAsignada || "Sin turno"}</p>
                          <p><strong>Salida:</strong> {turno.horaSalidaAsignada || "Sin turno"}</p>
                          {/* Solo el administrador puede ver el botón Seleccionar Horario */}
                          {user.rol.toLowerCase() === 'administrador' && (
                            <button className="editar-observacion-button" onClick={() => setActiveHorarioIndex(i)}>
                              Asignar Turno
                            </button>
                          )}
                        </>
                      )}
                    </td>
                    <td className="marcado-cell">
                      <p><strong>Entrada:</strong> {turno.horaEntradaMarcada || "-"}</p>
                      <p><strong>Salida:</strong> {turno.horaSalidaMarcada || "-"}</p>
                    </td>
                    <td className="button-cell">
                      <div>
                        <span>Entrada:  </span>
                        <button className="entrada-button" onClick={() => {
                          const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                          if (
                            user.rol.toLowerCase() === 'consultor' &&
                            turno.horaEntradaAsignada &&
                            hora !== turno.horaEntradaAsignada
                          ) {
                            setSwalProps({
                              show: true,
                              title: '¡Atención!',
                              text: `La hora marcada (${hora}) no coincide con la asignada (${turno.horaEntradaAsignada})`,
                              icon: 'warning',
                            });
                            return;
                          }
                          const nuevos = [...turnos];
                          const idx = nuevos.findIndex(t => t.rut === consultor.rut);
                          if (idx >= 0) nuevos[idx].horaEntradaMarcada = hora;
                          else nuevos.push({ rut: consultor.rut, horaEntradaMarcada: hora });
                          setTurnos(nuevos);
                          handleGuardar(i, consultor, { horaEntradaMarcada: hora });
                        }}>
                          ✅
                        </button>
                      </div>
                      <div>
                        <span>Salida:  </span>
                        <button className="salida-button" onClick={() => {
                          const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                          if (
                            user.rol.toLowerCase() === 'consultor' &&
                            turno.horaSalidaAsignada &&
                            hora !== turno.horaSalidaAsignada
                          ) {
                            setSwalProps({
                              show: true,
                              title: '¡Atención!',
                              text: `La hora marcada (${hora}) no coincide con la asignada (${turno.horaSalidaAsignada})`,
                              icon: 'warning',
                            });
                            return;
                          }
                          const nuevos = [...turnos];
                          const idx = nuevos.findIndex(t => t.rut === consultor.rut);
                          if (idx >= 0) nuevos[idx].horaSalidaMarcada = hora;
                          else nuevos.push({ rut: consultor.rut, horaSalidaMarcada: hora });
                          setTurnos(nuevos);
                          handleGuardar(i, consultor, { horaSalidaMarcada: hora });
                        }}>
                          ❌
                        </button>
                      </div>
                    </td>
                    <td className="observacion-cell">
                      {isEditing === i && puedeEditar(consultor) ? (
                        <>
                          <input
                            type="text"
                            value={observaciones[i] || turno.observacion || ""}
                            onChange={e => setObservaciones({ ...observaciones, [i]: e.target.value })}
                            placeholder="Escribe observación..."
                          />
                          <button className="guardar-observacion-button" onClick={() => handleGuardar(i, consultor)}>
                            Guardar
                          </button>
                          <button className="cancelar-button" onClick={() => setIsEditing(null)}>
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <span>{turno.observacion || "Ninguna   "}</span>
                          {puedeEditar(consultor) && (
                            <button className="editar-observacion-button" onClick={() => setIsEditing(i)}>
                              Editar
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <SweetAlert {...swalProps} onConfirm={() => setSwalProps({})} />
    </div>
  );
};

export default TurnosTable;
