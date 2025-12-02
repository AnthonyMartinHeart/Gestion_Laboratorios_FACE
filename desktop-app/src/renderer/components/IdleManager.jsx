// src/renderer/components/IdleManager.jsx
import { useEffect, useRef } from "react";

export default function IdleManager({
  timeoutMs = 5 * 60 * 1000,     // 5 minutos
  warningMs = 30 * 1000,         // aviso final 30 s
  onWarning = () => {},          // callback al entrar a aviso
  onIdle = () => {},             // callback al expirar
  onActivity = () => {},         
}) {
  const warnTimer = useRef(null);
  const idleTimer = useRef(null);

  useEffect(() => {
    const reset = () => {
      onActivity?.();
      if (warnTimer.current) clearTimeout(warnTimer.current);
      if (idleTimer.current) clearTimeout(idleTimer.current);

      
      warnTimer.current = setTimeout(() => {
        onWarning?.({ remainingMs: warningMs });
      }, Math.max(0, timeoutMs - warningMs));

      
      idleTimer.current = setTimeout(() => {
        onIdle?.();
      }, timeoutMs);
    };

    const events = ["mousemove", "keydown", "click", "wheel", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, reset));
    reset(); // inicial

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, reset));
      if (warnTimer.current) clearTimeout(warnTimer.current);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [timeoutMs, warningMs, onWarning, onIdle, onActivity]);

  return null; 
}
