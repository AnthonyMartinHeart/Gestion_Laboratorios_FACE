import React, { useState } from "react";
import "../styles/base.css";

export default function LoginForm() {
  const [rut, setRut] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // 1) login
      const authRes = await window.api.auth.login(rut, password);
      if (!authRes.ok) {
        setMessage(authRes.message || "Credenciales inválidas");
        setLoading(false);
        return;
      }

      // 2) asegurar registro de dispositivo
      const regRes = await window.api.dispositivo.ensureRegistered();
      if (!regRes?.ok) {
        setMessage(regRes.message || "No se pudo registrar el equipo");
        setLoading(false);
        return;
      }

      // 3) iniciar sesión de uso
      const sesRes = await window.api.sesion.iniciar(rut);
      if (!sesRes.ok) {
        setMessage(sesRes.message || "No se pudo iniciar la sesión de uso");
        setLoading(false);
        return;
      }

      setSessionId(sesRes.sessionId || null);
      setMessage("✅ Sesión iniciada correctamente");
    } catch (err) {
      setMessage("❌ Error inesperado. Reintenta.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (sessionId) {
        await window.api.sesion.finalizar(sessionId);
      }
      await window.api.auth.logout();
      setSessionId(null);
      setRut("");
      setPassword("");
      setMessage("👋 Sesión finalizada");
    } catch {
      setMessage("⚠️ Error al cerrar sesión");
    }
  };

  return (
    <div className="login-container">
      <h1>🔐 FACE - Inicio de Sesión</h1>
      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="text"
          placeholder="RUT (sin puntos, con guión)"
          value={rut}
          onChange={(e) => setRut(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Verificando..." : "Ingresar"}
        </button>
        {message && <p className="login-message">{message}</p>}
        {sessionId && (
          <button type="button" onClick={handleLogout} style={{ marginTop: 8 }}>
            Cerrar sesión
          </button>
        )}
      </form>
    </div>
  );
}
