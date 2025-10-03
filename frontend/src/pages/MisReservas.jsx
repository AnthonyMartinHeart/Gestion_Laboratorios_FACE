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

  // Hook para actualización automática del estado de las reservas cada minuto
  useEffect(() => {
    // Forzar re-renderizado cada minuto para actualizar estados automáticamente
    const intervalo = setInterval(() => {
      console.log('🔄 Verificando estados de reservas...');
      // Forzar actualización del componente para re-evaluar esReservaPasada()
      setMisReservas(prev => [...prev]);
    }, 60000); // Cada 60 segundos

    return () => clearInterval(intervalo);
  }, []);

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

  const borrarHistorialInactivas = async () => {
    // Filtrar solo las reservas inactivas (pasadas)
    const reservasInactivas = misReservas.filter(reserva => esReservaPasada(reserva));
    
    if (reservasInactivas.length === 0) {
      Swal.fire({
        title: 'Sin historial',
        text: 'No tienes reservas inactivas para eliminar.',
        icon: 'info',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Mostrar confirmación con detalles
    const confirmar = await Swal.fire({
      title: '¿Borrar historial de reservas inactivas?',
      html: `
        <div style="text-align: left;">
          <p>Se eliminarán <strong>${reservasInactivas.length}</strong> reserva(s) que ya finalizaron:</p>
          <div style="max-height: 200px; overflow-y: auto; margin: 15px 0; padding: 10px; background: #f8f9fa; border-radius: 5px;">
            ${reservasInactivas.map(r => `
              <div style="margin-bottom: 8px; padding: 8px; background: white; border-left: 3px solid #e74c3c; border-radius: 3px;">
                <strong>PC ${r.pcId}</strong> - ${obtenerNombreLaboratorio(r.pcId)}<br>
                <small>📅 ${formatearFecha(r.fechaReserva)} ⏰ ${r.horaInicio} - ${r.horaTermino}</small>
              </div>
            `).join('')}
          </div>
          <p style="color: #e74c3c; font-weight: bold; margin-top: 10px;">
            ⚠️ Las reservas activas NO serán eliminadas
          </p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '🗑️ Sí, borrar historial',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    });

    if (confirmar.isConfirmed) {
      try {
        // Eliminar cada reserva inactiva
        let eliminadas = 0;
        let errores = 0;

        for (const reserva of reservasInactivas) {
          try {
            await deleteReservation(reserva.id);
            eliminadas++;
          } catch (error) {
            console.error(`Error al eliminar reserva ${reserva.id}:`, error);
            errores++;
          }
        }

        // Recargar las reservas
        await cargarMisReservas();

        // Mostrar resultado
        if (errores === 0) {
          showSuccessAlert(
            '¡Historial limpiado!', 
            `Se eliminaron ${eliminadas} reserva(s) inactiva(s) correctamente.`
          );
        } else {
          Swal.fire({
            title: 'Limpieza parcial',
            html: `
              <p>✅ Eliminadas: ${eliminadas}</p>
              <p>❌ Errores: ${errores}</p>
            `,
            icon: 'warning',
            confirmButtonText: 'Entendido'
          });
        }
      } catch (error) {
        console.error('Error al borrar historial:', error);
        showErrorAlert('Error', 'No se pudo borrar el historial: ' + error.message);
      }
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
    // Obtener fecha y hora actual
    const ahora = new Date();
    
    // Parsear la fecha de la reserva (formato YYYY-MM-DD)
    const [year, month, day] = reserva.fechaReserva.split('-').map(Number);
    
    // Parsear la hora de término (formato HH:MM)
    const [horaTermino, minutoTermino] = reserva.horaTermino.split(':').map(Number);
    
    // Crear fecha de término de la reserva (fecha + hora de término)
    const fechaTerminoReserva = new Date(year, month - 1, day, horaTermino, minutoTermino);
    
    // La reserva está pasada si la hora de término ya ocurrió
    return ahora > fechaTerminoReserva;
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
            <div className="reservas-header mejorada">
              <div className="header-title-box">
                <span className="header-title">Reservas Activas</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button 
                  onClick={cargarMisReservas}
                  disabled={cargandoReservas}
                  title="Actualizar lista"
                  style={{
                    padding: '12px 24px',
                    backgroundColor: cargandoReservas ? '#93c5fd' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    outline: 'none',
                    borderRadius: '12px',
                    cursor: cargandoReservas ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease',
                    boxShadow: cargandoReservas ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.3)',
                    WebkitTapHighlightColor: 'transparent',
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!cargandoReservas) {
                      e.currentTarget.style.backgroundColor = '#2563eb';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!cargandoReservas) {
                      e.currentTarget.style.backgroundColor = '#3b82f6';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                    }
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.outline = 'none';
                  }}
                >
                  <span style={{fontSize:18,verticalAlign:'middle',pointerEvents:'none'}}>🔄</span>
                  <span style={{verticalAlign:'middle',pointerEvents:'none'}}>{cargandoReservas ? 'Actualizando...' : 'Actualizar'}</span>
                </button>
                <button 
                  onClick={borrarHistorialInactivas}
                  disabled={cargandoReservas}
                  title="Borrar reservas inactivas del historial"
                  style={{
                    padding: '12px 24px',
                    backgroundColor: cargandoReservas ? '#fca5a5' : '#ef4444',
                    color: 'white',
                    border: 'none',
                    outline: 'none',
                    borderRadius: '12px',
                    cursor: cargandoReservas ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease',
                    boxShadow: cargandoReservas ? 'none' : '0 4px 12px rgba(239, 68, 68, 0.3)',
                    WebkitTapHighlightColor: 'transparent',
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!cargandoReservas) {
                      e.currentTarget.style.backgroundColor = '#dc2626';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!cargandoReservas) {
                      e.currentTarget.style.backgroundColor = '#ef4444';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                    }
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.outline = 'none';
                  }}
                >
                  <span style={{fontSize:18,verticalAlign:'middle',pointerEvents:'none'}}>🗑️</span>
                  <span style={{verticalAlign:'middle',pointerEvents:'none'}}>Borrar Historial</span>
                </button>
              </div>
            </div>

            <div className="reservas-lista">
              {misReservas.length === 0 ? (
                <div className="sin-reservas mejorada">
                  <div className="sin-reservas-text" style={{fontWeight:600,fontSize:'1.18rem',color:'#7f8c8d',marginBottom:4,fontStyle:'normal'}}>No tienes reservas activas</div>
                  <div className="sin-reservas-tip" style={{fontWeight:400,color:'#b3b6b8',fontSize:'0.98rem',fontStyle:'normal'}}>¡Reserva un equipo para verlo aquí!</div>
                </div>
              ) : (
                misReservas.map((reserva) => (
                  <div key={reserva.id} className={`reserva-card ${esReservaPasada(reserva) ? 'reserva-pasada' : ''}`}
                    style={{
                      gap:24,
                      padding:'28px 24px',
                      boxShadow: esReservaPasada(reserva) 
                        ? '0 2px 8px rgba(0,0,0,0.1)' 
                        : '0 6px 24px #b3c6ff22, 0 2px 8px #b3c6ff11',
                      opacity: esReservaPasada(reserva) ? 0.7 : 1,
                      border: esReservaPasada(reserva) ? '2px solid #e74c3c20' : 'none',
                      backgroundColor: esReservaPasada(reserva) ? '#fef5f5' : 'white'
                    }}>
                    <div className="reserva-info" style={{flex:1}}>
                      <div className="reserva-principal" style={{gap:18,marginBottom:10,alignItems:'center'}}>
                        <span className="pc-icono" style={{fontSize:28,marginRight:8,verticalAlign:'middle',color:'#2980b9',filter:'drop-shadow(0 2px 4px #b3c6ff44)'}}>💻</span>
                        <span className="laboratorio">{obtenerNombreLaboratorio(reserva.pcId)}</span>
                        <span className="pc">PC {reserva.pcId}</span>
                        <span className="fecha">{formatearFecha(reserva.fechaReserva)}</span>
                      </div>
                      <div className="reserva-detalle" style={{marginTop:2,display:'flex',gap:16,alignItems:'center',background:'none',boxShadow:'none',padding:0}}>
                        <span className="horario" style={{fontSize:16}}>
                          <span style={{fontWeight:700,color:'#2c3e50'}}>⏰</span> {reserva.horaInicio} - {reserva.horaTermino}
                        </span>
                        {/* Mostrar estado basado en si la reserva está pasada o activa */}
                        <span 
                          className={`estado ${esReservaPasada(reserva) ? 'estado-inactivo' : 'estado-activa'}`} 
                          style={{
                            marginLeft:8,
                            marginRight:0,
                            letterSpacing:1.2,
                            fontSize:13,
                            padding: '6px 16px',
                            borderRadius: '20px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            backgroundColor: esReservaPasada(reserva) ? '#e74c3c' : '#27ae60',
                            color: 'white',
                            boxShadow: esReservaPasada(reserva) 
                              ? '0 2px 8px rgba(231, 76, 60, 0.3)' 
                              : '0 2px 8px rgba(39, 174, 96, 0.3)'
                          }}
                        >
                          {esReservaPasada(reserva) ? '🔴 INACTIVO' : '🟢 ACTIVA'}
                        </span>
                      </div>
                    </div>
                    <div className="reserva-acciones" style={{minWidth:120}}>
                      <button 
                        className="btn-editar"
                        onClick={() => abrirModalEdicion(reserva)}
                        title={esReservaPasada(reserva) ? "No se puede editar una reserva pasada" : "Editar horarios"}
                        disabled={cargandoReservas || esReservaPasada(reserva)}
                        style={{
                          display:'flex',
                          alignItems:'center',
                          gap:8,
                          justifyContent:'center',
                          opacity: esReservaPasada(reserva) ? 0.5 : 1,
                          cursor: esReservaPasada(reserva) ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <span role="img" aria-label="Editar" style={{fontSize:20}}>✏️</span>
                        <span style={{fontWeight:600}}>Editar</span>
                      </button>
                      {canDeleteReservations && (
                        <button 
                          className="btn-eliminar"
                          onClick={() => eliminarReserva(reserva)}
                          title="Eliminar reserva"
                          disabled={cargandoReservas}
                          style={{display:'flex',alignItems:'center',gap:8,justifyContent:'center'}}
                        >
                          <span role="img" aria-label="Eliminar" style={{fontSize:20}}>🗑️</span>
                          <span style={{fontWeight:600}}>Eliminar</span>
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
