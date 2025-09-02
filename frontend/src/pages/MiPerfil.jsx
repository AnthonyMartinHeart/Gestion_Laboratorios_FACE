import { useState, useEffect, useRef } from 'react';
import { getAllReservations } from '@services/reservation.service.js';
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from '@helpers/sweetAlert.js';
import '@styles/miPerfil.css';

const MiPerfil = () => {
  const [userData, setUserData] = useState(null);
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [historialReservas, setHistorialReservas] = useState([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [historialLimpiado, setHistorialLimpiado] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    let user = null;
    try {
      user = JSON.parse(sessionStorage.getItem("usuario")) || null;
    } catch (error) {
      user = null;
    }
    setUserData(user);

    if (user && user.email) {
      const fotoGuardada = localStorage.getItem(`fotoPerfil_${user.email}`);
      if (fotoGuardada) {
        setFotoPerfil(fotoGuardada);
      }
      
      // Verificar si el historial fue limpiado previamente
      const historialLimpiadoLocal = localStorage.getItem(`historialLimpiado_${user.email}`);
      if (historialLimpiadoLocal === 'true') {
        setHistorialLimpiado(true);
      }
    }
  }, []);

  const manejarCambioFoto = (e) => {
    const file = e.target.files[0];
    if (file && userData && userData.email) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPerfil(reader.result);
        localStorage.setItem(`fotoPerfil_${userData.email}`, reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const eliminarFoto = () => {
    if (userData && userData.email) {
      setFotoPerfil(null);
      localStorage.removeItem(`fotoPerfil_${userData.email}`);
    }
  };

  const cargarHistorialReservas = async () => {
    if (!userData || !userData.rut) return;

    // Si el historial fue limpiado, no cargar automáticamente
    if (historialLimpiado) {
      setHistorialReservas([]);
      return;
    }

    try {
      setCargandoHistorial(true);
      const reservas = await getAllReservations();
      
      if (Array.isArray(reservas)) {
        // Filtrar solo las reservas del usuario actual
        const reservasUsuario = reservas.filter(reserva => 
          reserva.rut === userData.rut && reserva.carrera !== 'MAINTENANCE' && reserva.carrera !== 'ADMIN'
        );
        
        // Ordenar por fecha más reciente primero
        const reservasOrdenadas = reservasUsuario.sort((a, b) => {
          const fechaA = new Date(a.fechaReserva + 'T' + a.horaInicio);
          const fechaB = new Date(b.fechaReserva + 'T' + b.horaInicio);
          return fechaB - fechaA;
        });

        setHistorialReservas(reservasOrdenadas);
      } else {
        setHistorialReservas([]);
      }
    } catch (error) {
      console.error('Error al cargar historial:', error);
      showErrorAlert('Error', 'No se pudo cargar el historial de reservas');
      setHistorialReservas([]);
    } finally {
      setCargandoHistorial(false);
    }
  };

  const alternarHistorial = () => {
    if (!mostrarHistorial) {
      cargarHistorialReservas();
    }
    setMostrarHistorial(!mostrarHistorial);
  };

  const limpiarHistorial = async () => {
    try {
      const confirmar = await showConfirmAlert(
        '¿Estás seguro?',
        'Esto limpiará tu vista local del historial de reservas. Las reservas seguirán existiendo en el sistema.',
        'Sí, limpiar',
        'Cancelar'
      );

      if (confirmar) {
        setHistorialReservas([]);
        setHistorialLimpiado(true);
        
        // Guardar el estado en localStorage para persistir entre sesiones
        if (userData && userData.email) {
          localStorage.setItem(`historialLimpiado_${userData.email}`, 'true');
        }
        
        showSuccessAlert('¡Listo!', 'Historial limpiado correctamente');
      }
    } catch (error) {
      showErrorAlert('Error', 'No se pudo limpiar el historial');
    }
  };

  const restaurarHistorial = () => {
    setHistorialLimpiado(false);
    if (userData && userData.email) {
      localStorage.removeItem(`historialLimpiado_${userData.email}`);
    }
    cargarHistorialReservas();
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-CL', {
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

  if (!userData) {
    return <div>Cargando...</div>;
  }

  // Validar si el correo es uno de los dominios permitidos
  const esCorreoValido = userData.email.endsWith('@gmail.cl') || 
                         userData.email.endsWith('@alumnos.ubiobio.cl') ||
                         userData.email.endsWith('@ubiobio.cl');

  return (
    <div className="perfil-container">
      <h1>Mi Perfil</h1>

      <div className="perfil-foto">
        <div className="foto-circular" onClick={() => inputRef.current.click()}>
          {fotoPerfil ? (
            <img src={fotoPerfil} alt="Foto de perfil" />
          ) : (
            <span className="sin-foto">+</span>
          )}
          <div className="icono-editar">✏️</div>
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={manejarCambioFoto}
          ref={inputRef}
          style={{ display: 'none' }}
        />
        {fotoPerfil && (
          <button className="btn-quitar" onClick={eliminarFoto}>Quitar Foto</button>
        )}
      </div>

      <div className="perfil-details">
        <p><strong>Nombre:</strong> {userData.nombreCompleto}</p>
        {esCorreoValido ? (
          <p><strong>Correo:</strong> {userData.email}</p>
        ) : (
          <p><strong>Correo:</strong> No válido o fuera de dominio permitido</p>
        )}
        <p><strong>RUT:</strong> {userData.rut || 'No registrado'}</p>
        {userData.email && userData.email.endsWith('@alumnos.ubiobio.cl') && (
          <p><strong>Carrera:</strong> {userData.carrera ? userData.carrera.toUpperCase() : 'No registrado'}</p>
        )}
        <p><strong>Rol:</strong> {userData.rol}</p>
      </div>

      {/* Sección de Historial de Reservas */}
      <div className="historial-section">
        <div className="historial-header">
          <h2>Historial de Reservas</h2>
          <button 
            className="btn-historial" 
            onClick={alternarHistorial}
            disabled={cargandoHistorial}
          >
            {cargandoHistorial ? 'Cargando...' : mostrarHistorial ? 'Ocultar Historial' : 'Ver Historial'}
          </button>
        </div>

        {mostrarHistorial && (
          <div className="historial-content">
            {historialLimpiado ? (
              <div className="historial-limpiado">
                <p className="mensaje-limpiado">
                  📝 El historial de reservas ha sido limpiado localmente
                </p>
                <button 
                  className="btn-restaurar-historial" 
                  onClick={restaurarHistorial}
                  disabled={cargandoHistorial}
                >
                  {cargandoHistorial ? 'Cargando...' : '🔄 Restaurar Historial'}
                </button>
              </div>
            ) : (
              <>
                {historialReservas.length > 0 && (
                  <div className="historial-actions">
                    <button 
                      className="btn-limpiar-historial" 
                      onClick={limpiarHistorial}
                    >
                      🗑️ Limpiar Historial
                    </button>
                    <span className="total-reservas">
                      Total: {historialReservas.length} reserva{historialReservas.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                <div className="historial-lista">
                  {historialReservas.length === 0 ? (
                    <p className="sin-historial">No tienes reservas registradas</p>
                  ) : (
                    historialReservas.map((reserva, index) => (
                      <div key={reserva.id || index} className="reserva-item">
                        <div className="reserva-info">
                          <div className="reserva-principal">
                            <span className="laboratorio">{obtenerNombreLaboratorio(reserva.pcId)}</span>
                            <span className="pc">PC {reserva.pcId}</span>
                            <span className="fecha">{formatearFecha(reserva.fechaReserva)}</span>
                          </div>
                          <div className="reserva-detalle">
                            <span className="horario">
                              {reserva.horaInicio} - {reserva.horaTermino}
                            </span>
                            {reserva.status && (
                              <span className={`estado estado-${reserva.status}`}>
                                {reserva.status === 'finished' ? 'Finalizada' : 
                                 reserva.status === 'active' ? 'Activa' : reserva.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MiPerfil;
