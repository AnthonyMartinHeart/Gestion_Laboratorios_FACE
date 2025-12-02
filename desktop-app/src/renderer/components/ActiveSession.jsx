import React, { useEffect, useState } from "react";
import "../styles/base.css";

function formatDuration(ms) {
  if (!ms || ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export default function ActiveSession({ data, onLogout }) {
  const { rut, deviceNumber, labId, sessionId, startedAt } = data || {};
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!startedAt) return;

    const startTs = new Date(startedAt).getTime();
    if (Number.isNaN(startTs)) return;

    const update = () => {
      const now = Date.now();
      setElapsedMs(now - startTs);
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const elapsedText = formatDuration(elapsedMs);

  return (
    <div className="session-screen">
      <div className="session-card">
        <h2 className="session-title">Sesión activa</h2>

        <div className="session-info">
          <div className="session-row">
            <span className="session-label">RUT:</span>
            <span className="session-value">{rut}</span>
          </div>

          <div className="session-row">
            <span className="session-label">Equipo #:</span>
            <span className="session-value">{deviceNumber}</span>
          </div>

          <div className="session-row">
            <span className="session-label">Laboratorio:</span>
            <span className="session-value">{labId}</span>
          </div>

          <div className="session-row">
            <span className="session-label">Sesión ID:</span>
            <span className="session-value">{sessionId}</span>
          </div>

          <div className="session-row">
            <span className="session-label">Inicio:</span>
            <span className="session-value">
              {startedAt ? new Date(startedAt).toLocaleString() : "-"}
            </span>
          </div>
        </div>

        {/*  TIEMPO DE USO */}
            <div style={{ marginTop: "1.8rem" }}>
            <span className="session-label" style={{ fontWeight: "600" }}>
              Tiempo usando el PC:
            </span>

            <div className="session-time-value">
              {elapsedText}
            </div>
          </div>


        <div className="session-actions">
          <button onClick={() => onLogout?.("logout")}>Cerrar sesión</button>
        </div>
      </div>
    </div>
  );
}
