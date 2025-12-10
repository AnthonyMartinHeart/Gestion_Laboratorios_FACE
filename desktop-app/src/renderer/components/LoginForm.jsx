import React, { useEffect, useState } from "react";
import "../styles/base.css";
import isEmail from "validator/lib/isEmail";
import { validateRut } from "../helpers/rut";


const CARRERAS = [
  { value: "CPA",   label: "Contador Público y Auditor" },
  { value: "ICO",   label: "Ingeniería Comercial" },
  { value: "ICINF", label: "Ingeniería Civil en Informática" },
  { value: "IECI",  label: "Ingeniería de Ejecución en Computación e Informática" },
  { value: "DRCH",  label: "Derecho" },
  { value: "MG",    label: "Magíster" },
  { value: "PECE",  label: "PECE" },
  { value: "otro",  label: "Otro" },
];

function formatRut(rut) {
  
  rut = rut.replace(/\./g, "").replace(/\s+/g, "").toUpperCase();

  
  if (!rut.includes("-")) return rut;

  const [body, dv] = rut.split("-");

  
  let reversed = body.split("").reverse().join("");
  let groups = reversed.match(/.{1,3}/g);
  let withDots = groups.join(".").split("").reverse().join("");

  return `${withDots}-${dv}`;
}



export default function LoginForm({ onLogin, onRegister }) {
  const [rut, setRut] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [freeMode, setFreeMode] = useState(false);
  const [labId, setLabId] = useState(null);
  const [deviceNumber, setDeviceNumber] = useState(null);

  // Campos extra para registro
  const [mode, setMode] = useState("login"); 
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [carrera, setCarrera] = useState("");
  const [anioIngreso, setAnioIngreso] = useState("");

  const isRegisterMode = mode === "register";

  useEffect(() => {
    let cancelled = false;
    let intervalId;

    const fetchDeviceInfo = async () => {
      try {
        const regRes = await window.api?.dispositivo?.ensureRegistered?.();
        if (!regRes || !regRes.ok || cancelled) return;

        setFreeMode(!!regRes.freeMode);
        setLabId(regRes.labId ?? null);
        setDeviceNumber(regRes.fixedNumber ?? regRes.deviceNumber ?? null);
      } catch (e) {
        console.warn("[LoginForm] No se pudo obtener info de dispositivo:", e);
      }
    };

    
    fetchDeviceInfo();

    
    intervalId = setInterval(fetchDeviceInfo, 10000);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");

    const rutClean = rut.trim();

  
    if (isRegisterMode) {
      const nombreClean = nombreCompleto.trim();
      const emailClean = email.trim().toLowerCase();
      const carreraClean = carrera.trim();
      const anioIngresoClean = anioIngreso.trim();

      if (!nombreClean || !rutClean || !emailClean || !password) {
        setMessage("Completa nombre, RUT, email y contraseña.");
        return;
      }

      if (!carreraClean) {
        setMessage("Selecciona tu carrera.");
        return;
      }

      if (!validateRut(rutClean)) {
        setMessage("El RUT ingresado no es válido.");
        return;
      }

      if (!isEmail(emailClean)) {
        setMessage("Ingresa un correo electrónico válido.");
        return;
      }

      if (
        !emailClean.endsWith("@alumnos.ubiobio.cl") &&
        !emailClean.endsWith("@ubiobio.cl")
      ) {
        setMessage("El correo debe terminar en @alumnos.ubiobio.cl o @ubiobio.cl");
        return;
      }

      if (!onRegister) {
        setMessage("El registro no está disponible en este equipo.");
        return;
      }

      setLoading(true);

      const res = await onRegister({
        nombreCompleto: nombreClean,
        rut: formatRut(rutClean),
        email: emailClean,
        password,
        carrera: carreraClean || undefined,
        anioIngreso: anioIngresoClean || undefined,
      });

      if (!res.ok) {
        setMessage(res.message || "Error al registrar usuario.");
        setLoading(false);
        return;
      }

      setMessage("Registro exitoso. Ahora puedes iniciar sesión.");
      setMode("login");
      setPassword("");
      setLoading(false);
      return;
    }

  
    if (!rutClean || !password) {
      setMessage("Ingresa tu RUT y contraseña.");
      return;
    }

    if (!validateRut(rutClean)) {
      setMessage("El RUT ingresado no es válido.");
      return;
    }

    if (!onLogin) {
      setMessage("No se configuró el manejador de login.");
      return;
    }

    setLoading(true);
    try {
      const rutFormateado = formatRut(rutClean);
      await onLogin(rutFormateado, password);
    } catch (err) {
      setMessage(err?.message || "Error al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  const handleEnterFreeMode = () => {
    setMessage("Modo libre activo: puedes usar el equipo sin iniciar sesión.");
  };

  const switchToRegister = () => {
    setMode("register");
    setMessage("");
  };

  const switchToLogin = () => {
    setMode("login");
    setMessage("");
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        {/* TÍTULO DE BLOQUEO */}
        <h2 className="login-status-title">
          Equipo bloqueado
          <br />
          <span className="login-status-sub">
            {isRegisterMode
              ? "Registra tu cuenta para usar el equipo"
              : "Inicia sesión para desbloquear"}
          </span>
        </h2>

        {/* TÍTULO PRINCIPAL */}
        <h1>FACE - {isRegisterMode ? "Registro de Usuario" : "Inicio de Sesión"}</h1>

        {freeMode && (
          <div className="free-mode-banner">
            <p>
              Este laboratorio{" "}
              {labId ? <strong>(Lab {labId})</strong> : null} está en{" "}
              <strong>modo libre</strong>.
            </p>
            <p style={{ fontSize: "0.9rem" }}>
              Puedes usar el equipo sin iniciar sesión. Si igualmente quieres
              registrar tu uso, {isRegisterMode ? "crea tu cuenta" : "ingresa tu RUT y contraseña"}.
            </p>
            <button
              type="button"
              className="free-mode-button"
              onClick={handleEnterFreeMode}
              disabled={loading}
            >
              Usar en modo libre
            </button>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="device-info">
            {labId && (
              <p>
                <strong>Laboratorio:</strong> Lab {labId}
              </p>
            )}
            {deviceNumber && (
              <p>
                <strong>Equipo:</strong> #{deviceNumber}
              </p>
            )}
          </div>

          {isRegisterMode && (
            <>
              <input
                type="text"
                placeholder="Nombre completo"
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                disabled={loading}
              />
            </>
          )}

          <input
            type="text"
            placeholder="RUT (sin puntos, con guión)"
            value={rut}
            onChange={(e) => setRut(e.target.value)}
            disabled={loading}
          />

          {isRegisterMode && (
            <input
              type="email"
              placeholder="Correo institucional (@alumnos.ubiobio.cl)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          )}

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />

          {isRegisterMode && (
            <>
              <select
                value={carrera}
                onChange={(e) => setCarrera(e.target.value)}
                disabled={loading}
              >
                <option value="">Selecciona tu carrera</option>
                {CARRERAS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Año de ingreso (ej: 2021)"
                value={anioIngreso}
                onChange={(e) => setAnioIngreso(e.target.value)}
                disabled={loading}
              />
            </>
          )}


          <button type="submit" disabled={loading}>
            {isRegisterMode
              ? loading
                ? "Registrando..."
                : "Registrarse"
              : loading
              ? "Verificando..."
              : "Ingresar"}
          </button>

          {/* Toggle login/registro */}
          <div className="register-hint">
            {isRegisterMode ? (
              <>
                <span>¿Ya tienes cuenta?</span>
                <button
                  type="button"
                  className="register-link-button"
                  onClick={switchToLogin}
                  disabled={loading}
                >
                  Inicia sesión aquí
                </button>
              </>
            ) : (
              <>
                <span>¿No tienes cuenta?</span>
                <button
                  type="button"
                  className="register-link-button"
                  onClick={switchToRegister}
                  disabled={loading}
                >
                  Regístrate aquí
                </button>
              </>
            )}
          </div>

          {message && <p className="login-message">{message}</p>}
        </form>
      </div>
    </div>
  );
}
