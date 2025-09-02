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

    // Si es una reserva de mantenimiento, saltear todas las validaciones de solapamiento
    if (carrera === 'MAINTENANCE') {
      const toSave = repo.create(data);
      const saved = await repo.save(toSave);
      console.log(`Reserva de mantenimiento creada para PC ${pcId}`);
      return [saved, null];
    }

    // Busca solapamientos existentes en el mismo PC (solo reservas activas si existe el campo status)
    const metadata = repo.metadata;
    const hasStatusColumn = metadata.columns.some(column => column.propertyName === 'status');
    
    const pcQuery = repo
      .createQueryBuilder("r")
      .where("r.pcId = :pcId", { pcId })
      .andWhere("r.fechaReserva = CURRENT_DATE")
      .andWhere("r.horaInicio < :horaTermino", { horaTermino })
      .andWhere("r.horaTermino > :horaInicio", { horaInicio });
      
    if (hasStatusColumn) {
      pcQuery.andWhere("r.status = :status", { status: "active" });
    }
    
    const pcOverlaps = await pcQuery.getMany();

    // Busca solapamientos del mismo RUT en cualquier PC del mismo laboratorio (solo reservas activas si existe el campo)
    const labRange = getLabRange(labId);
    const rutQuery = repo
      .createQueryBuilder("r")
      .where("r.rut = :rut", { rut })
      .andWhere("r.pcId >= :minPc AND r.pcId <= :maxPc", { minPc: labRange.min, maxPc: labRange.max })
      .andWhere("r.fechaReserva = CURRENT_DATE")
      .andWhere("r.horaInicio < :horaTermino", { horaTermino })
      .andWhere("r.horaTermino > :horaInicio", { horaInicio });
      
    if (hasStatusColumn) {
      rutQuery.andWhere("r.status = :status", { status: "active" });
    }
    
    const rutOverlaps = await rutQuery.getMany();

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
        // NO PERMITIR si hay CUALQUIER reserva existente (individual O bloque de clases)
        return [null, "El PC ya está reservado en ese horario"];
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
      
      // Verificar si existe el campo status en la tabla
      const metadata = repo.metadata;
      const hasStatusColumn = metadata.columns.some(column => column.propertyName === 'status');
  
      const query = repo
        .createQueryBuilder("r")
        .where("r.pcId = :pcId", { pcId });
        
      // Solo agregar filtro de status si la columna existe
      if (hasStatusColumn) {
        query.andWhere("r.status = :status", { status: "active" });
      }
  
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

    const overlapQuery = repo
      .createQueryBuilder("r")
      .where("r.pcId = :pcId", { pcId: pid })
      .andWhere("r.id != :id", { id })
      .andWhere("r.fechaReserva = CURRENT_DATE")
      .andWhere("r.horaInicio < :horaTermino", { horaTermino: ht })
      .andWhere("r.horaTermino > :horaInicio", { horaInicio: hi });
      
    // Solo agregar filtro de status si la columna existe
    const metadata = repo.metadata;
    const hasStatusColumn = metadata.columns.some(column => column.propertyName === 'status');
    if (hasStatusColumn) {
      overlapQuery.andWhere("r.status = :status", { status: "active" });
    }
    
    const overlap = await overlapQuery.getOne();

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

// Nueva función para "finalizar" reserva (soft delete)
export async function finishReservationService(id) {
  try {
    const repo = AppDataSource.getRepository(Reservation);
    const existing = await repo.findOneBy({ id });
    if (!existing) return [null, "Reserva activa no encontrada"];
    
    // Verificar si existe el campo status en la tabla
    const metadata = repo.metadata;
    const hasStatusColumn = metadata.columns.some(column => column.propertyName === 'status');
    
    if (hasStatusColumn) {
      // Si existe el campo status, usar soft delete
      existing.status = "finished";
      const updated = await repo.save(existing);
      return [updated, null];
    } else {
      // Si no existe el campo status, eliminar directamente (comportamiento original)
      console.log('Campo status no existe, eliminando reserva directamente');
      await repo.remove(existing);
      return [existing, null];
    }
  } catch (error) {
    console.error("Error finalizando reserva:", error);
    return [null, "Error interno del servidor"];
  }
}

// Nueva función para "liberar" equipos - finaliza todas las reservas activas (excepto mantenimiento)
export async function finishActiveReservationsService() {
  try {
    const repo = AppDataSource.getRepository(Reservation);
    
    // Verificar si existe el campo status en la tabla
    const metadata = repo.metadata;
    const hasStatusColumn = metadata.columns.some(column => column.propertyName === 'status');
    
    if (hasStatusColumn) {
      // Si existe el campo status, usar soft delete
      // Obtener todas las reservas activas del día actual que NO sean de mantenimiento
      const activeReservations = await repo
        .createQueryBuilder("r")
        .where("r.fechaReserva = CURRENT_DATE")
        .andWhere("r.status = :status", { status: "active" })
        .andWhere("r.carrera != :maintenance", { maintenance: "MAINTENANCE" })
        .getMany();

      if (activeReservations.length === 0) {
        return [[], "No hay reservas activas para finalizar"];
      }

      // Actualizar el status a "finished"
      await repo
        .createQueryBuilder()
        .update(Reservation)
        .set({ status: "finished" })
        .where("fechaReserva = CURRENT_DATE")
        .andWhere("status = :status", { status: "active" })
        .andWhere("carrera != :maintenance", { maintenance: "MAINTENANCE" })
        .execute();

      console.log(`Finalizadas ${activeReservations.length} reservas activas`);
      return [activeReservations, null];
    } else {
      // Si no existe el campo status, eliminar las reservas del día actual (excepto mantenimiento)
      console.log('Campo status no existe, eliminando reservas del día actual');
      
      const todayReservations = await repo
        .createQueryBuilder("r")
        .where("r.fechaReserva = CURRENT_DATE")
        .andWhere("r.carrera != :maintenance", { maintenance: "MAINTENANCE" })
        .getMany();

      if (todayReservations.length === 0) {
        return [[], "No hay reservas del día actual para eliminar"];
      }

      // Eliminar las reservas
      await repo
        .createQueryBuilder()
        .delete()
        .from(Reservation)
        .where("fechaReserva = CURRENT_DATE")
        .andWhere("carrera != :maintenance", { maintenance: "MAINTENANCE" })
        .execute();

      console.log(`Eliminadas ${todayReservations.length} reservas del día actual`);
      return [todayReservations, null];
    }
  } catch (error) {
    console.error("Error finalizando reservas activas:", error);
    return [null, "Error interno del servidor"];
  }
}

// Nueva función para vaciar completamente la bitácora (eliminar TODAS las reservas)
export async function clearAllReservationsService() {
  try {
    const repo = AppDataSource.getRepository(Reservation);
    
    // Obtener todas las reservas para contar
    const allReservations = await repo.find();
    const totalCount = allReservations.length;
    
    if (totalCount === 0) {
      return [0, "No hay reservas en la bitácora para eliminar"];
    }

    // Eliminar TODAS las reservas (incluyendo activas, finalizadas, mantenimiento, etc.)
    // Usar clear() que es más eficiente que delete() en masa
    await repo.createQueryBuilder()
      .delete()
      .from(Reservation)
      .execute();
    
    console.log(`Se eliminaron ${totalCount} reservas de la bitácora`);
    return [totalCount, null];
  } catch (error) {
    console.error("Error vaciando bitácora:", error);
    return [null, "Error interno del servidor"];
  }
}
