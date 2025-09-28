import { useState, useEffect, useRef } from 'react';
import { formatearNombre } from '@helpers/formatText.js';
import { updateFotoPerfil, getFotoPerfil } from '@services/user.service.js';
import { showSuccessAlert, showErrorAlert } from '@helpers/sweetAlert.js';
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

    // Cargar foto desde el backend
    if (user && user.email) {
      cargarFotoPerfil(user.email);
    }
  }, []);

  const cargarFotoPerfil = async (email) => {
    try {
      const foto = await getFotoPerfil(email);
      if (foto) {
        setFotoPerfil(foto);
      }
    } catch (error) {
      console.error('Error al cargar foto de perfil:', error);
    }
  };

  const comprimirImagen = (file, maxWidth = 400, calidad = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calcular nuevas dimensiones manteniendo la proporción
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convertir a base64 comprimido
        const fotoComprimida = canvas.toDataURL('image/jpeg', calidad);
        resolve(fotoComprimida);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const manejarCambioFoto = async (e) => {
    const file = e.target.files[0];
    if (file && userData && userData.email) {
      // Validar tamaño del archivo original (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showErrorAlert('Error', 'La imagen es demasiado grande. Máximo 10MB.');
        return;
      }

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        showErrorAlert('Error', 'Solo se permiten archivos de imagen.');
        return;
      }

      try {
        // Comprimir imagen antes de subirla
        const fotoComprimida = await comprimirImagen(file);
        setFotoPerfil(fotoComprimida);
        
        // Guardar en el backend
        const response = await updateFotoPerfil(userData.email, fotoComprimida);
        
        if (response.status === 'Success') {
          showSuccessAlert('¡Éxito!', 'Foto de perfil actualizada correctamente');
        } else {
          showErrorAlert('Error', response.message || 'No se pudo actualizar la foto');
          setFotoPerfil(null); // Revertir cambio visual
        }
      } catch (error) {
        console.error('Error al subir foto:', error);
        showErrorAlert('Error', 'No se pudo actualizar la foto de perfil');
        setFotoPerfil(null); // Revertir cambio visual
      }
    }
  };

  const eliminarFoto = async () => {
    if (userData && userData.email) {
      try {
        setFotoPerfil(null);
        
        // Eliminar del backend enviando null o string vacío
        const response = await updateFotoPerfil(userData.email, null);
        
        if (response.status === 'Success') {
          showSuccessAlert('¡Éxito!', 'Foto de perfil eliminada correctamente');
        } else {
          showErrorAlert('Error', response.message || 'No se pudo eliminar la foto');
        }
      } catch (error) {
        console.error('Error al eliminar foto:', error);
        showErrorAlert('Error', 'No se pudo eliminar la foto de perfil');
      }
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
        <p><strong>Nombre:</strong> {formatearNombre(userData.nombreCompleto)}</p>
        {esCorreoValido ? (
          <p><strong>Correo:</strong> {userData.email}</p>
        ) : (
          <p><strong>Correo:</strong> No válido o fuera de dominio permitido</p>
        )}
        <p><strong>RUT:</strong> {userData.rut || 'No registrado'}</p>
        {userData.email && userData.email.endsWith('@alumnos.ubiobio.cl') && (
          <p><strong>Carrera:</strong> {userData.carrera ? userData.carrera.toUpperCase() : 'No registrado'}</p>
        )}
        <p><strong>Rol:</strong> {userData.rol.charAt(0).toUpperCase() + userData.rol.slice(1)}</p>
      </div>
    </div>
  );
};

export default MiPerfil;
