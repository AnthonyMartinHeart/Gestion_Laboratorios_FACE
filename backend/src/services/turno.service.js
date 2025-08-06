"use strict";
import Turno from "../entity/turno.entity.js";
import { AppDataSource } from "../config/configDb.js";

export async function getTurnosByFechaService(fecha) {
  try {
    const turnoRepository = AppDataSource.getRepository(Turno);
    const turnos = await turnoRepository.find({
      where: { fecha },
      order: { nombre: "ASC" }
    });
    return turnos;
  } catch (error) {
    console.error("Error al obtener turnos por fecha:", error);
    throw error;
  }
}

export async function getTurnoByRutAndFechaService(rut, fecha) {
  try {
    const turnoRepository = AppDataSource.getRepository(Turno);
    const turno = await turnoRepository.findOne({
      where: { rut, fecha }
    });
    return turno;
  } catch (error) {
    console.error("Error al obtener turno por RUT y fecha:", error);
    throw error;
  }
}

export async function saveOrUpdateTurnoService(turnoData) {
  try {
    const turnoRepository = AppDataSource.getRepository(Turno);
    
    // Buscar si existe un turno para este RUT y fecha
    const existingTurno = await turnoRepository.findOne({
      where: { 
        rut: turnoData.rut, 
        fecha: turnoData.fecha 
      }
    });

    if (existingTurno) {
      // Actualizar turno existente
      await turnoRepository.update(
        { rut: turnoData.rut, fecha: turnoData.fecha },
        turnoData
      );
      
      // Obtener el turno actualizado
      const updatedTurno = await turnoRepository.findOne({
        where: { rut: turnoData.rut, fecha: turnoData.fecha }
      });
      return updatedTurno;
    } else {
      // Crear nuevo turno
      const newTurno = turnoRepository.create(turnoData);
      const savedTurno = await turnoRepository.save(newTurno);
      return savedTurno;
    }
  } catch (error) {
    console.error("Error al guardar/actualizar turno:", error);
    throw error;
  }
}

export async function deleteTurnoService(rut, fecha) {
  try {
    const turnoRepository = AppDataSource.getRepository(Turno);
    const result = await turnoRepository.delete({ rut, fecha });
    return result;
  } catch (error) {
    console.error("Error al eliminar turno:", error);
    throw error;
  }
}
