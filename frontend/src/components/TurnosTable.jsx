import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { getUsers, getUserByRut } from "@services/user.service.js";
import { getTurnosByFecha, saveOrUpdateTurno } from "@services/turnos.service.js";
import { useAuth } from "@context/AuthContext.jsx";

const horarios = [
  "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "13:00 PM", "14:00 PM", "15:00 PM", "16:00 PM", "17:00 PM", "18:00 PM", "19:00 PM", "20:00 PM"
];

// Función para validar si el consultor puede marcar dentro de la tolerancia de 30 minutos
const validarToleranciaHorario = (horaActual, horaAsignada, userRole, fechaSeleccionada) => {
  // Si es administrador, siempre puede marcar
  if (userRole === 'administrador') {
    return { puedeMarcar: true, mensaje: null };
  }

  // Si no es consultor, no puede marcar
  if (userRole !== 'consultor') {
    return { puedeMarcar: false, mensaje: 'No tienes permisos para marcar este turno.' };
  }

  // Verificar si la fecha seleccionada es HOY
  const hoy = new Date();
  const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`; // YYYY-MM-DD
  
  console.log('🗓️ Validación de fecha:', {
    fechaSeleccionada,
    fechaHoy,
    sonIguales: fechaSeleccionada === fechaHoy
  });
  
  if (fechaSeleccionada !== fechaHoy) {
    return { 
      puedeMarcar: false, 
      mensaje: `Solo puedes marcar turnos para el día de hoy (${fechaHoy}). La fecha seleccionada es ${fechaSeleccionada}.` 
    };
  }

  // Convertir las horas a objetos Date para calcular diferencia
  const parseHora = (horaStr) => {
    console.log('🕐 Parseando hora:', horaStr);
    
    // Normalizar el formato de hora
    let horaNormalizada = horaStr
      .replace(/\s+/g, ' ')           // Normalizar espacios múltiples
      .replace(/\./g, '')             // Quitar puntos (p. m. → PM)
      .replace(/\bm\b/gi, 'M')        // Convertir 'm' a 'M'
      .replace(/\bp\s*m\b/gi, 'PM')   // p m → PM
      .replace(/\ba\s*m\b/gi, 'AM')   // a m → AM
      .trim();
    
    console.log('🕐 Hora normalizada:', horaNormalizada);
    
    // Extraer tiempo y período
    const match = horaNormalizada.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) {
      console.error('❌ No se pudo parsear la hora:', horaStr);
      return new Date(); // Fallback
    }
    
    let [, horasStr, minutosStr, periodo] = match;
    let horas = parseInt(horasStr);
    let minutos = parseInt(minutosStr);
    
    console.log('🕐 Componentes extraídos:', { horas, minutos, periodo });
    
    // ARREGLO: Si las horas ya están en formato 24h (>12) y dice PM, no sumar 12
    if (periodo.toUpperCase() === 'PM' && horas !== 12) {
      if (horas <= 12) {
        horas += 12; // Solo sumar 12 si es <= 12 (formato 12h real)
      }
      // Si horas > 12, ya está en formato 24h, no hacer nada
    }
    if (periodo.toUpperCase() === 'AM' && horas === 12) {
      horas = 0;
    }
    
    // Asegurar que las horas estén en rango válido (0-23)
    horas = horas % 24;
    
    const fecha = new Date();
    fecha.setHours(horas, minutos, 0, 0);
    
    console.log('🕐 Fecha parseada:', fecha, 'Hora:', fecha.getHours() + ':' + fecha.getMinutes());
    return fecha;
  };

  const horaActualObj = parseHora(horaActual);
  const horaAsignadaObj = parseHora(horaAsignada);
  
  console.log('⏱️ Comparación de horas:', {
    horaActual,
    horaAsignada,
    horaActualObj,
    horaAsignadaObj,
    horaActualHours: horaActualObj.getHours(),
    horaActualMinutes: horaActualObj.getMinutes(),
    horaAsignadaHours: horaAsignadaObj.getHours(),
    horaAsignadaMinutes: horaAsignadaObj.getMinutes()
  });
  
  // Calcular diferencia en minutos
  const diferenciaMs = Math.abs(horaActualObj - horaAsignadaObj);
  const diferenciaMinutos = Math.floor(diferenciaMs / (1000 * 60));
  
  console.log('📊 Cálculo de diferencia:', {
    diferenciaMs,
    diferenciaMinutos,
    tolerancia: 30,
    puedeMarcar: diferenciaMinutos <= 30
  });
  
  // Tolerancia de 30 minutos (media hora)
  if (diferenciaMinutos <= 30) {
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
              horaSalidaMarcada: ""
            };
            
            console.log(`👤 Consultor ${consultor.nombreCompleto}:`, turnoCompleto);
            
            return turnoCompleto;
          });
          
          console.log('📝 Turnos finales:', turnosCompletos);
          setTurnos(turnosCompletos);      } catch (error) {
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



  const handleTurnoChange = (index, tipo, value) => {
    const nuevosTurnos = { ...turnos };
    nuevosTurnos[index] = { ...nuevosTurnos[index], [tipo]: value };
    setTurnos(nuevosTurnos);
  };




  // Función para validar que no haya conflictos de horarios
  const validarConflictoHorarios = (consultorActual, horaEntrada, horaSalida) => {
    if (!horaEntrada && !horaSalida) return { hayConflicto: false, mensaje: null };
    
    // Buscar otros consultores con turnos asignados para la misma fecha
    const turnosOtrosConsultores = turnos.filter(turno => 
      turno.rut !== consultorActual.rut && 
      (turno.horaEntradaAsignada || turno.horaSalidaAsignada)
    );
    
    for (const turnoOtro of turnosOtrosConsultores) {
      // Verificar conflicto de hora de entrada
      if (horaEntrada && turnoOtro.horaEntradaAsignada === horaEntrada) {
        const consultorConflicto = consultores.find(c => c.rut === turnoOtro.rut);
        return {
          hayConflicto: true,
          mensaje: `La hora de entrada ${horaEntrada} ya está asignada a ${consultorConflicto?.nombreCompleto || 'otro consultor'}.`
        };
      }
      
      // Verificar conflicto de hora de salida
      if (horaSalida && turnoOtro.horaSalidaAsignada === horaSalida) {
        const consultorConflicto = consultores.find(c => c.rut === turnoOtro.rut);
        return {
          hayConflicto: true,
          mensaje: `La hora de salida ${horaSalida} ya está asignada a ${consultorConflicto?.nombreCompleto || 'otro consultor'}.`
        };
      }
      
      // Verificar conflictos cruzados (entrada de uno con salida de otro)
      if (horaEntrada && turnoOtro.horaSalidaAsignada === horaEntrada) {
        const consultorConflicto = consultores.find(c => c.rut === turnoOtro.rut);
        return {
          hayConflicto: true,
          mensaje: `La hora ${horaEntrada} ya está asignada como hora de salida para ${consultorConflicto?.nombreCompleto || 'otro consultor'}.`
        };
      }
      
      if (horaSalida && turnoOtro.horaEntradaAsignada === horaSalida) {
        const consultorConflicto = consultores.find(c => c.rut === turnoOtro.rut);
        return {
          hayConflicto: true,
          mensaje: `La hora ${horaSalida} ya está asignada como hora de entrada para ${consultorConflicto?.nombreCompleto || 'otro consultor'}.`
        };
      }
    }
    
    return { hayConflicto: false, mensaje: null };
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
      
      const turnoData = {
        rut: consultor.rut,
        nombre: consultor.nombreCompleto,
        fecha: selectedDate,
        horaEntradaAsignada: turnoActual.horaEntradaAsignada || "",
        horaSalidaAsignada: turnoActual.horaSalidaAsignada || "",
        horaEntradaMarcada: turnoActual.horaEntradaMarcada || "",
        horaSalidaMarcada: turnoActual.horaSalidaMarcada || "",
        ...extra // Esto sobrescribe los valores anteriores si hay cambios
      };
      
      // Si estamos asignando horarios, validar conflictos
      if (activeHorarioIndex === i) {
        const entradaSelect = document.querySelector(`select[data-consultor="${i}"][data-tipo="entrada"]`);
        const salidaSelect = document.querySelector(`select[data-consultor="${i}"][data-tipo="salida"]`);
        
        if (entradaSelect && salidaSelect) {
          const nuevaHoraEntrada = entradaSelect.value || "";
          const nuevaHoraSalida = salidaSelect.value || "";
          
          // Validar conflictos de horarios
          const validacionConflicto = validarConflictoHorarios(consultor, nuevaHoraEntrada, nuevaHoraSalida);
          if (validacionConflicto.hayConflicto) {
            setGuardandoTurno(false);
            Swal.fire({
              icon: 'error',
              title: 'Conflicto de Horarios',
              text: validacionConflicto.mensaje,
              confirmButtonText: 'Entendido',
              confirmButtonColor: '#d33'
            });
            return;
          }
          
          turnoData.horaEntradaAsignada = nuevaHoraEntrada;
          turnoData.horaSalidaAsignada = nuevaHoraSalida;
        }
      }
      
      console.log('💾 Guardando:', turnoData);
      
      await saveOrUpdateTurno(selectedDate, turnoData);
      
      // Actualizar SOLO el estado local sin recargar desde el backend
      const nuevosTurnos = [...turnos];
      const indiceExistente = nuevosTurnos.findIndex(t => t.rut === consultor.rut);
      
      if (indiceExistente >= 0) {
        nuevosTurnos[indiceExistente] = turnoData;
      } else {
        nuevosTurnos.push(turnoData);
      }
      
      setTurnos(nuevosTurnos);
      
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

  // Verificaciones de permisos
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
            </tr>
          </thead>
          <tbody>
            {consultores.length === 0 ? (
              <tr><td colSpan={4}>No hay consultores para mostrar.</td></tr>
            ) : (
              consultores.map((consultor, i) => {
                const turno = turnos.find(t => t.rut === consultor.rut) || {};
                console.log(`🔍 Renderizando consultor ${consultor.nombreCompleto} con turno:`, turno);
                return (
                  <tr key={`${consultor.rut}-${i}`} className={activeHorarioIndex === i ? 'editing-row' : ''}>
                    <td className="nombre-cell">{consultor.nombreCompleto}</td>
                    <td className={`turno-cell ${activeHorarioIndex === i ? 'editing-horario' : ''}`}>
                      {activeHorarioIndex === i && user.rol.toLowerCase() === 'administrador' ? (
                        // Solo el administrador puede ver los selects para asignar horario
                        <>
                          <div className="horario-row">
                            <strong>Entrada:</strong>
                            <select
                              data-consultor={i}
                              data-tipo="entrada"
                              value={turno.horaEntradaAsignada || ""}
                              onChange={e => {
                                const nuevos = [...turnos];
                                const idx = nuevos.findIndex(t => t.rut === consultor.rut);
                                const nuevaHora = e.target.value;
                                
                                // Validar conflicto antes de actualizar
                                if (nuevaHora) {
                                  const salidaActual = idx >= 0 ? nuevos[idx]?.horaSalidaAsignada : "";
                                  const validacionConflicto = validarConflictoHorarios(consultor, nuevaHora, salidaActual);
                                  if (validacionConflicto.hayConflicto) {
                                    Swal.fire({
                                      icon: 'warning',
                                      title: 'Conflicto de Horarios',
                                      text: validacionConflicto.mensaje,
                                      confirmButtonText: 'Entendido',
                                      confirmButtonColor: '#f59e0b'
                                    });
                                    return; // No actualizar si hay conflicto
                                  }
                                }
                                
                                if (idx >= 0) nuevos[idx].horaEntradaAsignada = nuevaHora;
                                else nuevos.push({ rut: consultor.rut, horaEntradaAsignada: nuevaHora });
                                setTurnos(nuevos);
                              }}
                            >
                              <option value="">Sin Turno</option>
                              {horarios.map((hora, idx) => (
                                <option key={idx} value={hora}>{hora}</option>
                              ))}
                            </select>
                          </div>
                          <div className="horario-row">
                            <strong>Salida:</strong>
                            <select
                            data-consultor={i}
                            data-tipo="salida"
                            value={turno.horaSalidaAsignada || ""}
                            onChange={e => {
                              const nuevos = [...turnos];
                              const idx = nuevos.findIndex(t => t.rut === consultor.rut);
                              const nuevaHora = e.target.value;
                              
                              // Validar conflicto antes de actualizar
                              if (nuevaHora) {
                                const entradaActual = idx >= 0 ? nuevos[idx]?.horaEntradaAsignada : "";
                                const validacionConflicto = validarConflictoHorarios(consultor, entradaActual, nuevaHora);
                                if (validacionConflicto.hayConflicto) {
                                  Swal.fire({
                                    icon: 'warning',
                                    title: 'Conflicto de Horarios',
                                    text: validacionConflicto.mensaje,
                                    confirmButtonText: 'Entendido',
                                    confirmButtonColor: '#f59e0b'
                                  });
                                  return; // No actualizar si hay conflicto
                                }
                              }
                              
                              if (idx >= 0) nuevos[idx].horaSalidaAsignada = nuevaHora;
                              else nuevos.push({ rut: consultor.rut, horaSalidaAsignada: nuevaHora });
                              setTurnos(nuevos);
                            }}
                          >
                            <option value="">Sin Turno</option>
                            {horarios.map((hora, idx) => (
                              <option key={idx} value={hora}>{hora}</option>
                            ))}
                          </select>
                          </div>
                          <div className="button-group">
                            <button className="guardar-button" onClick={async () => await handleGuardar(i, consultor)}>
                              GUARDAR
                            </button>
                            <button className="cancelar-button" onClick={() => setActiveHorarioIndex(null)}>
                              Cancelar
                            </button>
                          </div>
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
                            
                            console.log('🔍 DEBUG: Intentando marcar entrada:', {
                              userRole: user.rol,
                              userRut: user.rut,
                              consultorRut: consultor.rut,
                              turno: turno,
                              horaEntradaAsignada: turno.horaEntradaAsignada,
                              consultor: consultor,
                              puedeEditar: puedeEditar(consultor),
                              selectedDate: selectedDate
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
                            console.log('⏰ Hora actual para marcar:', hora);
                            
                            // Validar tolerancia de horario para consultores (administradores siempre pueden)
                            if (user.rol.toLowerCase() !== 'administrador') {
                              console.log('🔍 Ejecutando validación de tolerancia...');
                              const validacion = validarToleranciaHorario(hora, turno.horaEntradaAsignada, user.rol.toLowerCase(), selectedDate);
                              console.log('📊 Resultado de validación:', validacion);
                              
                              if (!validacion.puedeMarcar) {
                                Swal.fire({
                                  title: '¡Fuera de horario!',
                                  text: validacion.mensaje,
                                  icon: 'error',
                                });
                                return;
                              }
                            }
                            
                            console.log('✅ Todas las validaciones pasaron, marcando entrada...');
                            // Marcar entrada y actualizar estado local inmediatamente
                            await handleGuardar(i, consultor, { horaEntradaMarcada: hora });
                          }}
                        >
                          🚪⏰🏁
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
                            console.log('🔍 DEBUG: Intentando marcar salida:', {
                              userRole: user.rol,
                              userRut: user.rut,
                              consultorRut: consultor.rut,
                              turno: turno,
                              horaSalidaAsignada: turno.horaSalidaAsignada,
                              consultor: consultor,
                              puedeEditar: puedeEditar(consultor),
                              selectedDate: selectedDate
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
                            console.log('⏰ Hora actual para marcar salida:', hora);
                            
                            // Validar tolerancia de horario para consultores (administradores siempre pueden)
                            if (user.rol.toLowerCase() !== 'administrador') {
                              console.log('🔍 Ejecutando validación de tolerancia para SALIDA...');
                              const validacion = validarToleranciaHorario(hora, turno.horaSalidaAsignada, user.rol.toLowerCase(), selectedDate);
                              console.log('📊 Resultado de validación SALIDA:', validacion);
                              
                              if (!validacion.puedeMarcar) {
                                Swal.fire({
                                  title: '¡Fuera de horario!',
                                  text: validacion.mensaje,
                                  icon: 'error',
                                });
                                return;
                              }
                            }
                            
                            console.log('✅ Todas las validaciones pasaron, marcando salida...');
                            // Marcar salida y actualizar estado local inmediatamente  
                            await handleGuardar(i, consultor, { horaSalidaMarcada: hora });
                          }}
                        >
                          🚶‍♂️⛔🏁
                        </button>
                      </div>
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
