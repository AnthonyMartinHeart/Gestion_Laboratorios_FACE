"use strict";

import Observacion from "../entity/observacion.entity.js";
import { AppDataSource } from "../config/configDb.js";
import { handleErrorClient, handleErrorServer } from "../handlers/responseHandlers.js";
import NotificacionesService from "../services/notificaciones.service.js";

export async function getObservacionesByFecha(req, res) {
  try {
    const { fecha } = req.params;
    
    const observacionRepository = AppDataSource.getRepository(Observacion);
    const observaciones = await observacionRepository.find({
      where: { fecha }
    });

    res.status(200).json({
      message: "Observaciones obtenidas con éxito",
      data: observaciones
    });
  } catch (error) {
    handleErrorServer(res, error);
  }
}

export async function saveOrUpdateObservacion(req, res) {
  try {
    const { fecha } = req.params;
    const { rut, nombre, observacion } = req.body;

    const observacionRepository = AppDataSource.getRepository(Observacion);
    
    // Buscar si ya existe una observación para este usuario y fecha
    let observacionExistente = await observacionRepository.findOne({
      where: { rut, fecha }
    });

    let esNuevaObservacion = !observacionExistente;
    let resultado;

    if (observacionExistente) {
      // Actualizar observación existente
      observacionExistente.observacion = observacion;
      observacionExistente.nombre = nombre; // Actualizar nombre por si cambió
      resultado = await observacionRepository.save(observacionExistente);
      
      // Enviar notificación de actualización
      await NotificacionesService.notificarObservacion(nombre, fecha, false);
      
      return res.status(200).json({
        message: "Observación actualizada con éxito",
        data: resultado
      });
    } else {
      // Crear nueva observación
      const nuevaObservacion = observacionRepository.create({
        rut,
        nombre,
        fecha,
        observacion
      });
      
      resultado = await observacionRepository.save(nuevaObservacion);
      
      // Enviar notificación de nueva observación
      await NotificacionesService.notificarObservacion(nombre, fecha, true);
      
      return res.status(201).json({
        message: "Observación creada con éxito",
        data: resultado
      });
    }
  } catch (error) {
    handleErrorServer(res, error);
  }
}

export async function deleteObservacion(req, res) {
  try {
    const { fecha } = req.params;
    const { rut } = req.body;

    const observacionRepository = AppDataSource.getRepository(Observacion);
    
    const observacion = await observacionRepository.findOne({
      where: { rut, fecha }
    });

    if (!observacion) {
      return handleErrorClient(res, 404, "Observación no encontrada");
    }

    await observacionRepository.remove(observacion);

    res.status(200).json({
      message: "Observación eliminada con éxito"
    });
  } catch (error) {
    handleErrorServer(res, error);
  }
}
