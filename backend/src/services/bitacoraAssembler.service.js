"use strict";
import { AppDataSource } from "../config/configDb.js";


function hhmm(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

// evitar duplicados
const rowKey = (x) =>
  `${x.rut}-${x.labId}-${x.pcId}-${x.fechaReserva}-${x.horaInicio}-${x.horaTermino}`;


export async function getBitacoraData({ from, to, labId = null }) {

  
  const ReservaRepo = AppDataSource.getRepository("Reservation");

  const reservas = await ReservaRepo
    .createQueryBuilder("r")
    .where("r.fechaReserva BETWEEN :from AND :to", { from, to })
    .andWhere(labId ? "r.labId = :labId" : "1=1", { labId })
    .orderBy("r.fechaReserva", "ASC")
    .getMany();

  const reservasDTO = reservas.map((r) => ({
    id: r.id,
    rut: r.rut,
    carrera: r.carrera,
    fechaReserva: r.fechaReserva,
    horaInicio: r.horaInicio.slice(0,5),
    horaTermino: r.horaTermino.slice(0,5),
    labId: r.labId,
    pcId: r.pcId,
    status: r.status,
    tipoActividad: r.tipoActividad ?? null
  }));

  
  const SesionRepo = AppDataSource.getRepository("Sesion");

  const sesiones = await SesionRepo
    .createQueryBuilder("s")
    .where("CAST(s.startedAt AS DATE) BETWEEN :from AND :to", { from, to })
    .andWhere(labId ? "s.labId = :labId" : "1=1", { labId })
    .getMany();

  console.log(`📊 Sesiones encontradas: ${sesiones.length}`, {
    from,
    to,
    labId,
    muestra: sesiones.slice(0, 2).map(s => ({
      rut: s.rut,
      deviceNumber: s.deviceNumber,
      startedAt: s.startedAt
    }))
  });

const sesionesDTO = sesiones.map((s) => {
  const started = s.startedAt ? new Date(s.startedAt) : null;
  
  //si la sesion sigue activa, se calcula el fin como 40 min despues del inicio
  let effectiveEnd;
  if (s.endedAt) {
    effectiveEnd = new Date(s.endedAt);
  } else if (started) {
    effectiveEnd = new Date(started.getTime() + 40 * 60 * 1000);
  } else {
    effectiveEnd = null;
  }

  return {
    id: s.id,
    rut: s.rut,
    carrera: s.carrera ?? "—",
    fechaReserva: started
      ? started.toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    horaInicio: hhmm(started),
    horaTermino: hhmm(effectiveEnd),   
    labId: s.labId,
    pcId: s.deviceNumber,
    status: s.status ?? (s.endedAt ? "finalizada" : "active"),
    tipoActividad: null,
  };
});


  
  const merged = new Map();

  for (const r of reservasDTO) merged.set(rowKey(r), r);
  for (const s of sesionesDTO) {
    const k = rowKey(s);
    if (!merged.has(k)) merged.set(k, s);
  }

  return Array.from(merged.values());
}
