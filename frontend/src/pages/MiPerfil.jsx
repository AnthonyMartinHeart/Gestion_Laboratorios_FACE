import { useState, useEffect, useRef } from 'react';
import '@styles/miPerfil.css';

const MiPerfil = () => {
  const [userData, setUserData] = useState(null);
  const [fotoPerfil, setFotoPerfil] = useState(null);
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
      const fotoGuardada = sessionStorage.getItem(`fotoPerfil_${user.email}`);
      if (fotoGuardada) {
        setFotoPerfil(fotoGuardada);
      }
    }
  }, []);

  const manejarCambioFoto = (e) => {
    const file = e.target.files[0];
    if (file && userData && userData.email) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPerfil(reader.result);
        sessionStorage.setItem(`fotoPerfil_${userData.email}`, reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const eliminarFoto = () => {
    if (userData && userData.email) {
      setFotoPerfil(null);
      sessionStorage.removeItem(`fotoPerfil_${userData.email}`);
    }
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
    </div>
  );
};

export default MiPerfil;
