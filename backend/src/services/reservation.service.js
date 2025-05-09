"use strict";
import Reservation from "../entity/reservation.entity.js";
import { AppDataSource } from "../config/configDb.js";

const labRanges = {
  1: { min: 1, max: 40 },
  2: { min: 41, max: 60 },
  3: { min: 61, max: 80 },
};

function getLabRange(labId) {
  return labRanges[labId] || null;
}

export async function createReservationService(data) {
  try {
    const { labId, pcId, horaInicio, horaTermino } = data;
    // (Ya validado por Joi que pcId esté en rango)
    const repo = AppDataSource.getRepository(Reservation);

    // Comprueba overlap
    const overlap = await repo
      .createQueryBuilder("r")
      .where("r.pcId = :pcId", { pcId })
      .andWhere("r.fechaReserva = CURRENT_DATE")
      .andWhere("r.horaInicio < :horaTermino", { horaTermino })
      .andWhere("r.horaTermino > :horaInicio", { horaInicio })
      .getOne();

    if (overlap) {
      return [null, "El PC ya está reservado en ese horario"];
    }

    const toSave = repo.create(data);
    const saved = await repo.save(toSave);
    return [saved, null];
  } catch (error) {
    console.error("Error al crear reserva:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function getReservationsByPCService(pcId, fechaReserva) {
    try {
      const repo = AppDataSource.getRepository(Reservation);
  
      const query = repo
        .createQueryBuilder("r")
        .where("r.pcId = :pcId", { pcId });
  
      if (fechaReserva) {
        query.andWhere("r.fechaReserva = :fechaReserva", { fechaReserva });
      } else {
        query.andWhere("r.fechaReserva = CURRENT_DATE");
      }
  
      const list = await query.getMany();
      return [list, null];
    } catch (error) {
      console.error("Error obteniendo reservas:", error);
      return [null, "Error interno del servidor"];
    }
  }
  
  export async function getAllReservationsService() {
    try {
      const repo = AppDataSource.getRepository(Reservation);
      const list = await repo.find(); // Recupera todas las reservas
      return [list, null];
    } catch (error) {
      console.error("Error obteniendo todas las reservas:", error);
      return [null, "Error interno del servidor"];
    }
  }

export async function updateReservationService(id, data) {
  try {
    const repo = AppDataSource.getRepository(Reservation);
    const existing = await repo.findOneBy({ id });
    if (!existing) return [null, "Reserva no encontrada"];

    // Si cambian labId o pcId, validar rango
    if (data.labId || data.pcId) {
      const labId = data.labId ?? existing.labId;
      const pcId = data.pcId ?? existing.pcId;
      const range = getLabRange(labId);
      if (!range || pcId < range.min || pcId > range.max) {
        return [null, `El PC ${pcId} no pertenece al laboratorio ${labId}`];
      }
    }

    // Chequear overlap con otras reservas
    const hi = data.horaInicio ?? existing.horaInicio;
    const ht = data.horaTermino ?? existing.horaTermino;
    const pid = data.pcId ?? existing.pcId;

    const overlap = await repo
      .createQueryBuilder("r")
      .where("r.pcId = :pcId", { pcId: pid })
      .andWhere("r.id != :id", { id })
      .andWhere("r.fechaReserva = CURRENT_DATE")
      .andWhere("r.horaInicio < :horaTermino", { horaTermino: ht })
      .andWhere("r.horaTermino > :horaInicio", { horaInicio: hi })
      .getOne();

    if (overlap) {
      return [null, "El nuevo horario se cruza con otra reserva"];
    }

    repo.merge(existing, data);
    const updated = await repo.save(existing);
    return [updated, null];
  } catch (error) {
    console.error("Error actualizando reserva:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function deleteReservationService(id) {
  try {
    const repo = AppDataSource.getRepository(Reservation);
    const existing = await repo.findOneBy({ id });
    if (!existing) return [null, "Reserva no encontrada"];
    await repo.remove(existing);
    return [existing, null];
  } catch (error) {
    console.error("Error eliminando reserva:", error);
    return [null, "Error interno del servidor"];
  }
}
