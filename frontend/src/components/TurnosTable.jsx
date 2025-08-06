import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { getUsers, getUserByRut } from "@services/user.service.js";
import { getTurnosByFecha, saveOrUpdateTurno, debugObservaciones } from "@services/turnos.service.js";
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
  const [guardandoTurno, setGuardandoTurno] = useState(false);

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

  // Cargar turnos - SIMPLIFICADO Y SIN LOOPS
  const loadTurnos = async () => {
    if (selectedDate && consultores.length > 0 && !guardandoTurno) {
      console.log('🔄 Cargando turnos para:', selectedDate);
      
      // Hacer debug de observaciones antes de cargar
      debugObservaciones(selectedDate);
      
      try {
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
          
          console.log(`👤 Consultor ${consultor.nombreCompleto}:`, turnoCompleto);
          console.log(`📝 Observación cargada: "${turnoCompleto.observacion}"`);
          
          return turnoCompleto;
        });
        
        console.log('📝 Turnos finales:', turnosCompletos);
        setTurnos(turnosCompletos);
        
        // Inicializar observaciones desde los turnos cargados
        const nuevasObservaciones = {};
        turnosCompletos.forEach((turno, index) => {
          nuevasObservaciones[index] = turno.observacion || "";
          console.log(`📋 Observación inicializada para índice ${index}: "${nuevasObservaciones[index]}"`);
        });
        setObservaciones(nuevasObservaciones);
        
        console.log('🗂️ Estado de observaciones inicializado:', nuevasObservaciones);
        
      } catch (error) {
        console.error('❌ Error cargando turnos:', error);
      }
    }
  };

  useEffect(() => {
    // Solo cargar si hay cambios reales en selectedDate o consultores
    if (selectedDate && consultores.length > 0 && !guardandoTurno) {
      loadTurnos();
    }
  }, [selectedDate, consultores]); // Removido 'turnos' de dependencias para evitar loop

  const handleObservacionChange = (index, value) => {
    const nuevasObservaciones = { ...observaciones };
    nuevasObservaciones[index] = value;
    setObservaciones(nuevasObservaciones);
    
    // NO guardamos automáticamente, solo actualizamos el estado local
    // El usuario debe presionar "Guardar" para persistir los cambios
  };

  const handleTurnoChange = (index, tipo, value) => {
    const nuevosTurnos = { ...turnos };
    nuevosTurnos[index] = { ...nuevosTurnos[index], [tipo]: value };
    setTurnos(nuevosTurnos);
  };




  // Guardar turno/observación en el backend - SIN LOOPS
  const handleGuardar = async (i, consultor, extra = {}) => {
    try {
      console.log('💾 Guardando turno para:', consultor.nombreCompleto);
      
      if (!selectedDate) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Selecciona una fecha primero'
        });
        return;
      }

      // Evitar guardados múltiples simultáneos
      if (guardandoTurno) {
        console.log('⚠️ Ya se está guardando un turno, cancelando...');
        return;
      }

      setGuardandoTurno(true);
      
      const turnoActual = turnos.find(t => t.rut === consultor.rut) || {};
      const observacionActual = observaciones[i] !== undefined ? observaciones[i] : turnoActual.observacion || "";
      
      const turnoData = {
        rut: consultor.rut,
        nombre: consultor.nombreCompleto,
        fecha: selectedDate,
        horaEntradaAsignada: turnoActual.horaEntradaAsignada || "",
        horaSalidaAsignada: turnoActual.horaSalidaAsignada || "",
        horaEntradaMarcada: turnoActual.horaEntradaMarcada || "",
        horaSalidaMarcada: turnoActual.horaSalidaMarcada || "",
        observacion: observacionActual,
        ...extra // Esto sobrescribe los valores anteriores si hay cambios
      };
      
      // Si estamos asignando horarios
      if (activeHorarioIndex === i) {
        const entradaSelect = document.querySelector(`select[data-consultor="${i}"][data-tipo="entrada"]`);
        const salidaSelect = document.querySelector(`select[data-consultor="${i}"][data-tipo="salida"]`);
        
        if (entradaSelect && salidaSelect) {
          turnoData.horaEntradaAsignada = entradaSelect.value || "";
          turnoData.horaSalidaAsignada = salidaSelect.value || "";
        }
      }
      
      console.log('💾 Guardando:', turnoData);
      console.log('📝 Observación a guardar:', turnoData.observacion);
      
      await saveOrUpdateTurno(selectedDate, turnoData);
      
      // Verificar que se guardó correctamente
      setTimeout(async () => {
        console.log('🔍 Verificando guardado de observación...');
        debugObservaciones(selectedDate);
        
        // Recargar turnos para confirmar sincronización
        const turnosVerificacion = await getTurnosByFecha(selectedDate);
        const turnoVerificado = turnosVerificacion.find(t => t.rut === consultor.rut);
        console.log('✅ Turno verificado después de guardar:', turnoVerificado);
        console.log('📝 Observación verificada:', turnoVerificado?.observacion);
      }, 500);
      
      // Actualizar SOLO el estado local sin recargar desde el backend
      const nuevosTurnos = [...turnos];
      const indiceExistente = nuevosTurnos.findIndex(t => t.rut === consultor.rut);
      
      if (indiceExistente >= 0) {
        nuevosTurnos[indiceExistente] = turnoData;
      } else {
        nuevosTurnos.push(turnoData);
      }
      
      setTurnos(nuevosTurnos);
      
      // Actualizar observaciones en el estado local
      if (extra.observacion !== undefined || observacionActual) {
        setObservaciones(prev => ({ ...prev, [i]: turnoData.observacion }));
      }
      
      // NO recargar automáticamente para evitar sobrescribir los datos recién guardados
      console.log('✅ Estado local actualizado, no recargando para preservar datos');
      
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
        timer: 1500,
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
    } finally {
      setGuardandoTurno(false);
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
      {/* Botón de debugging temporal */}
      {user?.rol?.toLowerCase() === 'administrador' && (
        <div style={{ margin: '10px 0', padding: '10px', backgroundColor: '#f0f8ff', border: '1px solid #ccc', borderRadius: '5px' }}>
          <button 
            onClick={() => {
              console.log('🔍 DEBUG MANUAL - Estado actual:');
              console.log('📅 Fecha seleccionada:', selectedDate);
              console.log('👥 Consultores:', consultores);
              console.log('⏰ Turnos:', turnos);
              console.log('📝 Observaciones:', observaciones);
              
              if (selectedDate) {
                debugObservaciones(selectedDate);
              }
              
              // Verificar backend
              if (selectedDate) {
                getTurnosByFecha(selectedDate).then(data => {
                  console.log('🔄 Turnos desde backend:', data);
                  data.forEach(turno => {
                    if (turno.observacion) {
                      console.log(`📝 ${turno.nombre}: "${turno.observacion}"`);
                    }
                  });
                });
              }
            }}
            style={{ padding: '5px 10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
          >
            🔍 Debug Observaciones
          </button>
          <span style={{ marginLeft: '10px', fontSize: '12px', color: '#666' }}>
            (Botón temporal para debugging - revisar consola)
          </span>
        </div>
      )}
      
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
                            guardandoTurno ||
                            !puedeEditar(consultor) || 
                            (user.rol.toLowerCase() !== 'administrador' && (!turno.horaEntradaAsignada || turno.horaEntradaAsignada === ""))
                          }
                          onClick={async () => {
                            if (guardandoTurno) return;
                            
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
                            
                            // Marcar entrada y actualizar estado local inmediatamente
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
                            guardandoTurno ||
                            !puedeEditar(consultor) || 
                            (user.rol.toLowerCase() !== 'administrador' && (!turno.horaSalidaAsignada || turno.horaSalidaAsignada === ""))
                          }
                          onClick={async () => {
                            if (guardandoTurno) return;
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
                            
                            // Marcar salida y actualizar estado local inmediatamente  
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
                            value={observaciones[i] !== undefined ? observaciones[i] : (turno.observacion || "")}
                            onChange={e => handleObservacionChange(i, e.target.value)}
                            placeholder="Escribe observación..."
                          />
                          <button className="guardar-observacion-button" onClick={async () => {
                            // Guardar específicamente la observación actualizada
                            const observacionActual = observaciones[i] !== undefined ? observaciones[i] : (turno.observacion || "");
                            await handleGuardar(i, consultor, { observacion: observacionActual });
                          }}>
                            Guardar
                          </button>
                          <button className="limpiar-observacion-button" onClick={async () => {
                            // Limpiar la observación
                            setObservaciones(prev => ({ ...prev, [i]: "" }));
                            await handleGuardar(i, consultor, { observacion: "" });
                          }}>
                            Limpiar
                          </button>
                          <button className="cancelar-button" onClick={() => {
                            // Restaurar observación original y cancelar edición
                            setObservaciones(prev => ({ ...prev, [i]: turno.observacion || "" }));
                            setIsEditing(null);
                          }}>
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
