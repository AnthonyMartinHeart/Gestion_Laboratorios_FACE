import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { getUsers, getUserByRut } from "@services/user.service.js";
import { getTurnosByFecha, saveOrUpdateTurno } from "@services/turnos.service.js";
import { useAuth } from "@context/AuthContext.jsx";

const horarios = [
  "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "13:00 PM", "14:00 PM", "15:00 PM", "16:00 PM", "17:00 PM", "18:00 PM", "19:00 PM", "20:00 PM"
];

// Función para validar si el consultor puede marcar dentro de la tolerancia de 15 minutos
const validarToleranciaHorario = (horaActual, horaAsignada, userRole) => {
  // Si es administrador, siempre puede marcar
  if (userRole === 'administrador') {
    return { puedeMarcar: true, mensaje: null };
  }

  // Si no es consultor, no puede marcar
  if (userRole !== 'consultor') {
    return { puedeMarcar: false, mensaje: 'No tienes permisos para marcar este turno.' };
  }

  // Convertir las horas a objetos Date para calcular diferencia
  const parseHora = (horaStr) => {
    const [tiempo, periodo] = horaStr.split(' ');
    let [horas, minutos] = tiempo.split(':').map(Number);
    
    if (periodo === 'PM' && horas !== 12) horas += 12;
    if (periodo === 'AM' && horas === 12) horas = 0;
    
    const fecha = new Date();
    fecha.setHours(horas, minutos, 0, 0);
    return fecha;
  };

  const horaActualObj = parseHora(horaActual);
  const horaAsignadaObj = parseHora(horaAsignada);
  
  // Calcular diferencia en minutos
  const diferenciaMs = Math.abs(horaActualObj - horaAsignadaObj);
  const diferenciaMinutos = Math.floor(diferenciaMs / (1000 * 60));
  
  // Tolerancia de 15 minutos
  if (diferenciaMinutos <= 15) {
    return { puedeMarcar: true, mensaje: null };
  } else {
    return { 
      puedeMarcar: false, 
      mensaje: `Estás ${diferenciaMinutos} minutos fuera del horario asignado (${horaAsignada}). Solo un administrador puede marcar este turno.` 
    };
  }
};

const TurnosTable = ({ selectedDate }) => {
  const { user } = useAuth();
  const [consultores, setConsultores] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [observaciones, setObservaciones] = useState({});
  const [isEditing, setIsEditing] = useState(null);
  const [activeHorarioIndex, setActiveHorarioIndex] = useState(null);

  // Cargar consultores
  useEffect(() => {
    if (!user) return;
    if (user.rol.toLowerCase() === "consultor") {
      getUserByRut(user.rut).then(consultor => {
        setConsultores(consultor ? [consultor] : []);
      });
    } else {
      getUsers().then(users => {
        setConsultores(users.filter(u => u.rol.toLowerCase() === "consultor"));
      });
    }
  }, [user]);

  // Cargar turnos - SIMPLIFICADO
  const loadTurnos = async () => {
    if (selectedDate && consultores.length > 0) {
      console.log('🔄 Cargando turnos para:', selectedDate);
      
      const turnosData = await getTurnosByFecha(selectedDate);
      console.log('📥 Turnos obtenidos:', turnosData);
      
      // Crear turnos para todos los consultores
      const turnosCompletos = consultores.map(consultor => {
        const turnoExistente = turnosData.find(t => t.rut === consultor.rut);
        const turnoCompleto = turnoExistente || {
          rut: consultor.rut,
          nombre: consultor.nombreCompleto,
          fecha: selectedDate,
          horaEntradaAsignada: "",
          horaSalidaAsignada: "",
          horaEntradaMarcada: "",
          horaSalidaMarcada: "",
          observacion: ""
        };
        
        console.log(`👤 Consultor ${consultor.nombreCompleto}:`, {
          turnoExistente,
          turnoCompleto,
          horaEntradaMarcada: turnoCompleto.horaEntradaMarcada,
          horaSalidaMarcada: turnoCompleto.horaSalidaMarcada
        });
        
        return turnoCompleto;
      });
      
      console.log('� Turnos finales:', turnosCompletos);
      setTurnos(turnosCompletos);
    }
  };

  useEffect(() => {
    loadTurnos();
  }, [selectedDate, consultores]);

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




  // Guardar turno/observación en el backend
  const handleGuardar = async (i, consultor, extra = {}) => {
    try {
      console.log('� Guardando turno para:', consultor.nombreCompleto);
      
      if (!selectedDate) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Selecciona una fecha primero'
        });
        return;
      }
      
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
      
      // Si estamos asignando horarios
      if (activeHorarioIndex === i) {
        const entradaSelect = document.querySelector(`select[data-consultor="${i}"][data-tipo="entrada"]`);
        const salidaSelect = document.querySelector(`select[data-consultor="${i}"][data-tipo="salida"]`);
        
        if (entradaSelect && salidaSelect) {
          newTurno.horaEntradaAsignada = entradaSelect.value || "";
          newTurno.horaSalidaAsignada = salidaSelect.value || "";
        }
      }
      
      console.log('💾 Guardando:', newTurno);
      await saveOrUpdateTurno(selectedDate, newTurno);
      
      // Recargar datos
      await loadTurnos();
      
      // Mensaje de éxito
      let message = 'Turno guardado exitosamente';
      if (extra.horaEntradaMarcada) {
        message = `Entrada marcada a las ${extra.horaEntradaMarcada}`;
      } else if (extra.horaSalidaMarcada) {
        message = `Salida marcada a las ${extra.horaSalidaMarcada}`;
      }
      
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: message,
        timer: 2000,
        showConfirmButton: false
      });
      
      setActiveHorarioIndex(null);
      setIsEditing(null);
      
    } catch (error) {
      console.error('❌ Error al guardar:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar el turno'
      });
    }
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
                console.log(`🔍 Renderizando consultor ${consultor.nombreCompleto} con turno:`, turno);
                return (
                  <tr key={`${consultor.rut}-${i}`}>
                    <td className="nombre-cell">{consultor.nombreCompleto}</td>
                    <td className="turno-cell">
                      {activeHorarioIndex === i && user.rol.toLowerCase() === 'administrador' ? (
                        // Solo el administrador puede ver los selects para asignar horario
                        <>
                          <strong>Hora Entrada:</strong>
                          <select
                            data-consultor={i}
                            data-tipo="entrada"
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
                            data-consultor={i}
                            data-tipo="salida"
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
                          <button className="guardar-button" onClick={async () => await handleGuardar(i, consultor)}>
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
                          {/* Solo el administrador puede ver el botón para asignar/modificar horario */}
                          {user.rol.toLowerCase() === 'administrador' && (
                            <button className="editar-observacion-button" onClick={() => setActiveHorarioIndex(i)}>
                              {turno.horaEntradaAsignada || turno.horaSalidaAsignada ? "Modificar Turno" : "Asignar Turno"}
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
                        <button 
                          className="entrada-button" 
                          disabled={
                            !puedeEditar(consultor) || 
                            (user.rol.toLowerCase() !== 'administrador' && (!turno.horaEntradaAsignada || turno.horaEntradaAsignada === ""))
                          }
                          onClick={async () => {
                            console.log('Intentando marcar entrada:', {
                              userRole: user.rol,
                              turno: turno,
                              horaEntradaAsignada: turno.horaEntradaAsignada,
                              consultor: consultor,
                              puedeEditar: puedeEditar(consultor)
                            });

                            // Verificar permisos primero
                            if (!puedeEditar(consultor)) {
                              Swal.fire({
                                title: '¡Sin permisos!',
                                text: 'No tienes permisos para marcar el turno de este consultor.',
                                icon: 'error',
                              });
                              return;
                            }

                            // Los administradores pueden marcar sin turno asignado
                            if (user.rol.toLowerCase() !== 'administrador') {
                              // Verificar si tiene turno asignado (solo para no-administradores)
                              if (!turno.horaEntradaAsignada || turno.horaEntradaAsignada === "") {
                                Swal.fire({
                                  title: '¡Sin turno asignado!',
                                  text: 'No puedes marcar entrada sin tener un turno asignado.',
                                  icon: 'error',
                                });
                                return;
                              }
                            }

                            const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                            
                            // Validar tolerancia de horario para consultores (administradores siempre pueden)
                            if (user.rol.toLowerCase() !== 'administrador') {
                              const validacion = validarToleranciaHorario(hora, turno.horaEntradaAsignada, user.rol.toLowerCase());
                              
                              if (!validacion.puedeMarcar) {
                                Swal.fire({
                                  title: '¡Fuera de horario!',
                                  text: validacion.mensaje,
                                  icon: 'error',
                                });
                                return;
                              }
                            }
                            
                            // No actualizar el estado local aquí, dejar que fetchTurnos() lo haga
                            await handleGuardar(i, consultor, { horaEntradaMarcada: hora });
                          }}
                        >
                          ✅
                        </button>
                      </div>
                      <div>
                        <span>Salida:  </span>
                        <button 
                          className="salida-button" 
                          disabled={
                            !puedeEditar(consultor) || 
                            (user.rol.toLowerCase() !== 'administrador' && (!turno.horaSalidaAsignada || turno.horaSalidaAsignada === ""))
                          }
                          onClick={async () => {
                            console.log('Intentando marcar salida:', {
                              userRole: user.rol,
                              turno: turno,
                              horaSalidaAsignada: turno.horaSalidaAsignada,
                              consultor: consultor,
                              puedeEditar: puedeEditar(consultor)
                            });

                            // Verificar permisos primero
                            if (!puedeEditar(consultor)) {
                              Swal.fire({
                                title: '¡Sin permisos!',
                                text: 'No tienes permisos para marcar el turno de este consultor.',
                                icon: 'error',
                              });
                              return;
                            }

                            // Los administradores pueden marcar sin turno asignado
                            if (user.rol.toLowerCase() !== 'administrador') {
                              // Verificar si tiene turno asignado (solo para no-administradores)
                              if (!turno.horaSalidaAsignada || turno.horaSalidaAsignada === "") {
                                Swal.fire({
                                  title: '¡Sin turno asignado!',
                                  text: 'No puedes marcar salida sin tener un turno asignado.',
                                  icon: 'error',
                                });
                                return;
                              }
                            }

                            const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                            
                            // Validar tolerancia de horario para consultores (administradores siempre pueden)
                            if (user.rol.toLowerCase() !== 'administrador') {
                              const validacion = validarToleranciaHorario(hora, turno.horaSalidaAsignada, user.rol.toLowerCase());
                              
                              if (!validacion.puedeMarcar) {
                                Swal.fire({
                                  title: '¡Fuera de horario!',
                                  text: validacion.mensaje,
                                  icon: 'error',
                                });
                                return;
                              }
                            }
                            
                            // No actualizar el estado local aquí, dejar que fetchTurnos() lo haga
                            await handleGuardar(i, consultor, { horaSalidaMarcada: hora });
                          }}
                        >
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
                          <button className="guardar-observacion-button" onClick={async () => await handleGuardar(i, consultor)}>
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
    </div>
  );
};

export default TurnosTable;
