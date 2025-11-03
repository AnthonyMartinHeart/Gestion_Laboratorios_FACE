"use strict";
import { AppDataSource } from "../config/configDb.js";
import Session from "../entity/sesion.entity.js";
import Reservation from "../entity/reservation.entity.js";

// Tolerancias (minutos) para "match" con la reserva del día
const TOL_BEFORE_MIN = 10; // permite iniciar 10 min antes
const TOL_AFTER_MIN  = 20; // permite iniciar hasta 20 min después

function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function isWithinTolerance(startedAt, horaInicio, horaTermino) {
  const d = new Date(startedAt);
  const minutesNow = d.getHours() * 60 + d.getMinutes();
  const hi = timeToMinutes(horaInicio);      // HH:MM
  const ht = timeToMinutes(horaTermino);     // HH:MM
  // ventana ampliada: [horaInicio - tolBefore, horaTermino + tolAfter]
  return minutesNow >= (hi - TOL_BEFORE_MIN) && minutesNow <= (ht + TOL_AFTER_MIN);
}

export async function startSessionService(payload) {
  try {
    const { rut, labId, deviceNumber, ip, hostname, deviceId, startedAt } = payload;
    if (!rut || !labId || !deviceNumber) return [null, "rut, labId y deviceNumber son requeridos"];

    const sessRepo = AppDataSource.getRepository(Session);
    const resRepo  = AppDataSource.getRepository(Reservation);

    // Cerrar cualquier sesión "huérfana" activa del mismo device (defensivo)
    const actives = await sessRepo.find({ where: { deviceNumber, labId, status: "active" } });
    if (actives.length) {
      for (const s of actives) { s.status = "ended"; s.endedAt = new Date(); }
      await sessRepo.save(actives);
    }

    // Buscar reservas del día en ese PC y rut
    const today = new Date();
    const yyyy_mm_dd = today.toISOString().split("T")[0];

    const candidates = await resRepo
      .createQueryBuilder("r")
      .where("r.pcId = :pcId", { pcId: deviceNumber })
      .andWhere("r.rut = :rut", { rut })
      .andWhere("r.fechaReserva = :fecha", { fecha: yyyy_mm_dd })
      .andWhere("r.status = :status", { status: "active" })
      .getMany();

    // Determinar si alguna calza con tolerancia de tiempo
    const started = startedAt ? new Date(startedAt) : new Date();
    let reservationId = null;
    for (const r of candidates) {
      if (isWithinTolerance(started, r.horaInicio, r.horaTermino)) {
        reservationId = r.id;
        break;
      }
    }

    const session = sessRepo.create({
      rut, labId, deviceNumber, ip, hostname, deviceId,
      reservationId,
      startedAt: started,
      status: "active",
    });
    const saved = await sessRepo.save(session);

    return [ { sessionId: saved.id, reservationId, matched: !!reservationId }, null ];
  } catch (e) {
    console.error("startSessionService error:", e);
    return [null, "Error interno del servidor"];
  }
}

export async function endSessionService(sessionId, payload = {}) {
  try {
    const sessRepo = AppDataSource.getRepository(Session);
    const session = await sessRepo.findOne({ where: { id: sessionId } });
    if (!session) return [null, "Sesión no encontrada"];

    session.status = "ended";
    session.endedAt = payload.endedAt ? new Date(payload.endedAt) : new Date();
    await sessRepo.save(session);

    return [ { success: true }, null ];
  } catch (e) {
    console.error("endSessionService error:", e);
    return [null, "Error interno del servidor"];
  }
}
