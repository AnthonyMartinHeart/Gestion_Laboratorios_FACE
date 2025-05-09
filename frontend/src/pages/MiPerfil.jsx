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

    const fotoGuardada = sessionStorage.getItem("fotoPerfil");
    if (fotoGuardada) {
      setFotoPerfil(fotoGuardada);
    }
  }, []);

  const manejarCambioFoto = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPerfil(reader.result);
        sessionStorage.setItem("fotoPerfil", reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const eliminarFoto = () => {
    setFotoPerfil(null);
    sessionStorage.removeItem("fotoPerfil");
  };

  if (!userData) {
    return <div>Cargando...</div>;
  }

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
        <p><strong>Nombre:</strong> {userData.nombre}</p>
        <p><strong>Correo:</strong> {userData.correo}</p>
        <p><strong>Rol:</strong> {userData.rol}</p>
      </div>

      <div className="perfil-actions">
        <button onClick={() => alert("Editar perfil (funcionalidad no implementada)")}>
          ✏️ Editar Perfil
        </button>
      </div>
    </div>
  );
};

export default MiPerfil;
