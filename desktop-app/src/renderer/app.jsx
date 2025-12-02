
import React, { useCallback,useEffect, useState } from "react";
import useAuthState from "../hooks/useAuthState";
import useNetworkState from "../hooks/useNetworkState";
import IdleManager from "./components/IdleManager";
import ActiveSession from "./components/ActiveSession";
import LoginForm from "./components/LoginForm";


function OfflineScreen({ onAllowOffline }) {
  return (
    <div className="login-wrapper">
      <div className="login-container">
        <h2 className="login-status-title">
          Sin conexión con el servidor FACE
          <br />
          <span className="login-status-sub">
            El sistema no está disponible en este momento.
          </span>
        </h2>

        <p style={{ marginBottom: "1rem" }}>
          El equipo puede usarse sin registrar actividad. Podrás usar
          aplicaciones locales como Word, Excel u otras herramientas instaladas.
        </p>

        <button
          type="button"
          className="free-mode-button"
          onClick={onAllowOffline}
        >
          Usar equipo sin registro (sin conexión)
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const { status, user, session, login, logout, touchActivity } = useAuthState();
  const { isOnline, apiReachable } = useNetworkState();

  const [warning, setWarning] = useState(null);
  const [offlineMode, setOfflineMode] = useState(false);

  const isAuthenticated = status === "authenticated";

  const handleLogin = useCallback(
    async (rut, password) => {
      const res = await login(rut, password);
      if (!res?.ok) {
        setWarning(res.message || "No se pudo iniciar sesión.");
      } else {
        setWarning(null);
        
      }
    },
    [login]
  );

  const handleRegister = useCallback(async (payload) => {
    const res = await window.api?.auth?.register?.(payload);

    if (!res?.ok) {
      const err = new Error(res?.message || "No se pudo registrar al usuario.");
      err.details = res?.errors || null;
      throw err;
    }

    return res?.data;
  }, []);

  const handleIdleWarning = useCallback(({ remainingMs }) => {
    setWarning(
      `Sin actividad: cerraremos sesión en ${Math.ceil(remainingMs / 1000)}s...`
    );
  }, []);

  const handleIdle = useCallback(async () => {
    setWarning(null);
    await logout("idle");
  }, [logout]);

  const handleAllowOffline = useCallback(async () => {
    try {
      
      await window.api?.app?.allowOfflineUse?.();
    } catch (e) {
      console.error("No se pudo liberar el equipo en modo offline:", e);
      
      setWarning("No se pudo liberar el equipo. Contacta al administrador.");
    }

    
    setOfflineMode(true);
  }, []);

  useEffect(() => {
  
    if (!offlineMode) return;

    
      if (isAuthenticated) return;

    
      if (!apiReachable) return;

    
      (async () => {
        try {
          await window.api?.app?.restoreKiosk?.();
        } catch (e) {
          console.error("No se pudo restaurar el modo kiosko:", e);
          setWarning("No se pudo volver a bloquear el equipo automáticamente.");
        } finally {
          setOfflineMode(false);
        }
      })();
  }, [offlineMode, isAuthenticated, apiReachable]);


  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Banner de red */}
      {!isOnline || !apiReachable ? (
        <div style={{ background: "#ffdd99", padding: 8, textAlign: "center" }}>
          {!isOnline
            ? "Sin conexión a Internet."
            : "API inalcanzable. Reintentando..."}
        </div>
      ) : null}

      {/* Aviso de inactividad */}
      {warning ? (
        <div style={{ background: "#ffe4e1", padding: 8, textAlign: "center" }}>
          {warning}
        </div>
      ) : null}

      {isAuthenticated ? (
        <>
          {/* Sesión activa */}
          <ActiveSession
            data={{
              rut: user?.rut,
              deviceNumber: session?.deviceNumber,
              labId: session?.labId,
              sessionId: session?.sessionId,
              startedAt: session?.startedAt,
            }}
            onLogout={logout}
          />

          {/* Idle manager (5 min) */}
          <IdleManager
            timeoutMs={5 * 60 * 1000}
            warningMs={30 * 1000}
            onWarning={handleIdleWarning}
            onIdle={handleIdle}
            onActivity={() => {
              setWarning(null);
              touchActivity();
            }}
          />
        </>
      ) : apiReachable === false ? (
        
        <OfflineScreen onAllowOffline={handleAllowOffline} />
      ) : (
        
        <LoginForm
          onLogin={handleLogin}
          onRegister={handleRegister}
          backendOk={apiReachable}
        />
      )}
    </div>
  );
}
