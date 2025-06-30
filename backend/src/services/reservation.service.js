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
    const { labId, pcId, horaInicio, horaTermino, carrera, rut } = data;
    // (Ya validado por Joi que pcId esté en rango)
    const repo = AppDataSource.getRepository(Reservation);

    // Busca solapamientos existentes en el mismo PC
    const pcOverlaps = await repo
      .createQueryBuilder("r")
      .where("r.pcId = :pcId", { pcId })
      .andWhere("r.fechaReserva = CURRENT_DATE")
      .andWhere("r.horaInicio < :horaTermino", { horaTermino })
      .andWhere("r.horaTermino > :horaInicio", { horaInicio })
      .getMany();

    // Busca solapamientos del mismo RUT en cualquier PC del mismo laboratorio
    const labRange = getLabRange(labId);
    const rutOverlaps = await repo
      .createQueryBuilder("r")
      .where("r.rut = :rut", { rut })
      .andWhere("r.pcId >= :minPc AND r.pcId <= :maxPc", { minPc: labRange.min, maxPc: labRange.max })
      .andWhere("r.fechaReserva = CURRENT_DATE")
      .andWhere("r.horaInicio < :horaTermino", { horaTermino })
      .andWhere("r.horaTermino > :horaInicio", { horaInicio })
      .getMany();

    // Validar solapamientos del mismo RUT
    // Permitir que los bloques de clases (ADMIN) se solapen entre sí del mismo administrador
    if (rutOverlaps.length > 0) {
      // Si la nueva reserva es un bloque de clases (ADMIN)
      if (carrera === 'ADMIN') {
        // Para bloques de clases, solo verificar que no haya reservas individuales (no ADMIN)
        const hasNonAdminOverlap = rutOverlaps.some(overlap => overlap.carrera !== 'ADMIN');
        if (hasNonAdminOverlap) {
          return [null, "Ya tienes una reserva individual que se solapa con este horario"];
        }
        // Si todas son bloques de clases (ADMIN), permitir sin problema
        console.log(`Permitiendo bloque de clases ADMIN en PC ${pcId} - sin conflictos individuales`);
      } else {
        // Si la nueva reserva es individual, no permitir solapamiento con nada
        return [null, "Ya tienes una reserva que se solapa con este horario en el laboratorio"];
      }
    }

    // Validar solapamientos en el PC específico
    if (pcOverlaps.length > 0) {
      // Si la nueva reserva es de un admin (bloque de clases)
      if (carrera === 'ADMIN') {
        // Para bloques de clases, verificar que no haya reservas individuales
        const hasIndividualReservation = pcOverlaps.some(overlap => overlap.carrera !== 'ADMIN');
        if (hasIndividualReservation) {
          return [null, "Ya existe una reserva individual en ese PC y horario"];
        }
        // Si solo hay otros bloques de clases (ADMIN), permitir
        console.log(`Permitiendo bloque de clases ADMIN en PC ${pcId} - coexistencia con otros bloques`);
      } else {
        // Si la nueva reserva es individual (estudiante/consultor)
        // Solo permitir si TODAS las reservas existentes son bloques de clases
        const hasIndividualReservation = pcOverlaps.some(overlap => overlap.carrera !== 'ADMIN');
        
        if (hasIndividualReservation) {
          return [null, "El PC ya está reservado por otro usuario en ese horario"];
        }
        
        // Si solo hay bloques de clases, permitir la reserva individual
        console.log(`Permitiendo reserva individual durante bloque de clases en PC ${pcId}`);
      }
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
