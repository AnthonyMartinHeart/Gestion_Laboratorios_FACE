"use strict";
import { AppDataSource } from "../config/configDb.js";
import Sesion from "../entity/sesion.entity.js";
import Reservation from "../entity/reservation.entity.js";
import User from "../entity/user.entity.js";
import { getIO } from "./socket.service.js"; 


const TOL_BEFORE_MIN = 10; 
const TOL_AFTER_MIN  = 20; 

function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function isWithinTolerance(startedAt, horaInicio, horaTermino) {
  const d = new Date(startedAt);
  const minutesNow = d.getHours() * 60 + d.getMinutes();
  const hi = timeToMinutes(horaInicio);      
  const ht = timeToMinutes(horaTermino);     
  
  return minutesNow >= (hi - TOL_BEFORE_MIN) && minutesNow <= (ht + TOL_AFTER_MIN);
}

export async function startSessionService(payload) {
  try {
    const { rut, labId, deviceNumber, ip, hostname, deviceId, startedAt } = payload;
    if (!rut || !labId || !deviceNumber) {
      return [null, "rut, labId y deviceNumber son requeridos"];
    }

    const sessRepo = AppDataSource.getRepository(Sesion);
    const resRepo  = AppDataSource.getRepository(Reservation);
    const userRepo = AppDataSource.getRepository(User);

    
    const actives = await sessRepo.find({ where: { deviceNumber, labId, status: "active" } });
    if (actives.length) {
      for (const s of actives) {
        s.status = "ended";
        s.endedAt = new Date();
      }
      await sessRepo.save(actives);
    }

    
    const today = new Date();
    const yyyy_mm_dd = today.toISOString().split("T")[0];

    const candidates = await resRepo
      .createQueryBuilder("r")
      .where("r.pcId = :pcId", { pcId: deviceNumber })
      .andWhere("r.rut = :rut", { rut })
      .andWhere("r.fechaReserva = :fecha", { fecha: yyyy_mm_dd })
      .andWhere("r.status = :status", { status: "active" })
      .getMany();

    const started = startedAt ? new Date(startedAt) : new Date();
    let reservationId = null;
    let carrera = null;

    
    for (const r of candidates) {
      if (isWithinTolerance(started, r.horaInicio, r.horaTermino)) {
        reservationId = r.id;
        carrera = r.carrera || null;
        break;
      }
    }

    
    if (!carrera) {
      try {
        const user = await userRepo.findOne({ where: { rut } });
        if (user?.carrera) {
          carrera = user.carrera;
        }
      } catch (e) {
        console.error("No se pudo obtener carrera desde usuario para rut", rut, e.message);
      }
    }

    // 3) Crea la sesion
    const session = sessRepo.create({
      rut,
      labId,
      deviceNumber,
      ip,
      hostname,
      deviceId,
      reservationId,
      startedAt: started,
      status: "active",
      carrera, 
    });

    const saved = await sessRepo.save(session);

    // Notifica el contador de usuarios
    try {
      const io = getIO();
      if (io) {
        const totalActive = await sessRepo.count({ where: { status: "active" } });
        
        io.emit("session-count-update", totalActive);
        console.log(`📊 Sesiones activas notificadas: ${totalActive}`);
      }
    } catch (socketError) {
      console.error("Error emitiendo actualización de contador:", socketError);
    }

    return [{ sessionId: saved.id, reservationId, matched: !!reservationId }, null];
  } catch (e) {
    console.error("startSessionService error:", e);
    return [null, "Error interno del servidor"];
  }
}

export async function endSessionService(sessionId, payload = {}) {
  try {
    const sessRepo = AppDataSource.getRepository(Sesion);
    const session = await sessRepo.findOne({ where: { id: sessionId } });
    if (!session) return [null, "Sesión no encontrada"];

    session.status = "ended";
    session.endedAt = payload.endedAt ? new Date(payload.endedAt) : new Date();
    await sessRepo.save(session);

    
    try {
      const io = getIO();
      if (io) {
        const totalActive = await sessRepo.count({ where: { status: "active" } });
        
        io.emit("session-count-update", totalActive);
        console.log(`📊 Sesiones activas notificadas: ${totalActive}`);
      }
    } catch (socketError) {
      console.error("Error emitiendo actualización de contador:", socketError);
    }

    return [{ success: true }, null];
  } catch (e) {
    console.error("endSessionService error:", e);
    return [null, "Error interno del servidor"];
  }
}
