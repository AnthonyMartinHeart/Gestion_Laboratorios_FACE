// src/hooks/useAuthState.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export default function useAuthState() {
  const [status, setStatus] = useState("idle");           // idle | authenticating | authenticated
  const [user, setUser] = useState(null);                 // { rut, ... }
  const [session, setSession] = useState(null);           // { sessionId, rut, deviceNumber, labId, startedAt }
  const lastActivityAt = useRef(Date.now());

  
  const formatRutWithDots = useCallback((value) => {
    if (!value) return "";
    const raw = String(value).replace(/\./g, "").replace(/\s+/g, "").toUpperCase();

    
    const hasDash = raw.includes("-");
    const numRaw = hasDash ? raw.split("-")[0] : raw.slice(0, -1);
    const dvRaw  = hasDash ? raw.split("-")[1] : raw.slice(-1);

    const num = (numRaw || "").replace(/[^0-9]/g, "");
    const dv  = (dvRaw  || "").replace(/[^0-9K]/g, "");

    if (!num || !dv) return raw; // fallback si viene algo raro

    // Inserta puntos de miles
    const numWithDots = num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${numWithDots}-${dv}`;
  }, []);

  const touchActivity = useCallback(() => {
    lastActivityAt.current = Date.now();
  }, []);

  const restoreFromPersist = useCallback(async () => {
    try {
      window.api?.sesion?.onRehydrate?.((persisted) => {
        setStatus("authenticated");
        const rut = formatRutWithDots(persisted.rut);
        setUser({ rut });
        setSession({
          sessionId: persisted.sessionId,
          rut,
          deviceNumber: persisted.deviceNumber,
          labId: persisted.labId,
          startedAt: persisted.startedAt,
        });
      });

      const res = await window.api?.sesion?.readPersisted?.();
      if (res?.ok && res.data?.sessionId) {
        setStatus("authenticated");
        const rut = formatRutWithDots(res.data.rut);
        setUser({ rut });
        setSession({
          sessionId: res.data.sessionId,
          rut,
          deviceNumber: res.data.deviceNumber,
          labId: res.data.labId,
          startedAt: res.data.startedAt,
        });
      }

      window.api?.sesion?.onEnded?.(({ reason }) => {
        setStatus("idle");
        setUser(null);
        setSession(null);
        console.info("[sesion] finalizada por main:", reason);
      });
    } catch (e) {
      console.warn("[restoreFromPersist] error:", e);
    }
  }, [formatRutWithDots]);

  const login = useCallback(async (rut, password) => {
    setStatus("authenticating");
    try {
      const rutFormateado = formatRutWithDots(rut);

      // 1) Autenticación
      const authRes = await window.api?.auth?.login?.({ rut: rutFormateado, password });
      if (!authRes?.ok) throw new Error(authRes?.message || "Login fallido");

      // 2) Inicio de sesión (ligada al equipo/lab)
      const sesRes = await window.api?.sesion?.iniciar?.(rutFormateado);
      if (!sesRes?.ok) throw new Error(sesRes?.message || "No se pudo iniciar la sesión");

      // 3) Datos persistidos del dispositivo
      const persistedDev = await window.api?.dispositivo?.getPersisted?.();
      const deviceNumber = persistedDev?.deviceNumber ?? null;
      const sessionId = sesRes?.sessionId || sesRes?.id;
      const labId = Number(persistedDev?.labId) || null;
      const startedAt = sesRes?.startedAt || new Date().toISOString();

      setUser({ rut: rutFormateado });
      setSession({ sessionId, rut: rutFormateado, deviceNumber, labId, startedAt });
      setStatus("authenticated");
      lastActivityAt.current = Date.now();
      return { ok: true };
    } catch (e) {
      setStatus("idle");
      return { ok: false, message: e?.message || "Error de autenticación" };
    }
  }, [formatRutWithDots]);

  const logout = useCallback(
    async (reason = "logout") => {
      try {
        if (session?.sessionId) {
          await window.api?.sesion?.finalizar?.(session.sessionId, reason);
        }
      } finally {
        setStatus("idle");
        setUser(null);
        setSession(null);
      }
    },
    [session]
  );

  useEffect(() => {
    restoreFromPersist();
  }, [restoreFromPersist]);

  return useMemo(
    () => ({
      status,
      user,
      session,
      login,
      logout,
      restoreFromPersist,
      touchActivity,
      lastActivityAt,
    }),
    [status, user, session, login, logout, restoreFromPersist, touchActivity]
  );
}
