"use strict";
import {
  getTurnosByFechaService,
  getTurnoByRutAndFechaService,
  saveOrUpdateTurnoService,
  deleteTurnoService
} from "../services/turno.service.js";
import { handleErrorServer } from "../handlers/responseHandlers.js";

export async function getTurnosByFecha(req, res) {
  try {
    const { fecha } = req.params;
    
    if (!fecha) {
      return res.status(400).json({
        message: "La fecha es requerida",
        data: null
      });
    }

    const turnos = await getTurnosByFechaService(fecha);
    
    res.status(200).json({
      message: "Turnos obtenidos exitosamente",
      data: turnos
    });
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getTurnoByRutAndFecha(req, res) {
  try {
    const { rut, fecha } = req.params;
    
    if (!rut || !fecha) {
      return res.status(400).json({
        message: "El RUT y la fecha son requeridos",
        data: null
      });
    }

    const turno = await getTurnoByRutAndFechaService(rut, fecha);
    
    res.status(200).json({
      message: "Turno obtenido exitosamente",
      data: turno
    });
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function saveOrUpdateTurno(req, res) {
  try {
    const turnoData = req.body;
    
    // Validaciones básicas
    if (!turnoData.rut || !turnoData.fecha) {
      return res.status(400).json({
        message: "El RUT y la fecha son requeridos",
        data: null
      });
    }

    const turno = await saveOrUpdateTurnoService(turnoData);
    
    res.status(200).json({
      message: "Turno guardado exitosamente",
      data: turno
    });
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function deleteTurno(req, res) {
  try {
    const { rut, fecha } = req.params;
    
    if (!rut || !fecha) {
      return res.status(400).json({
        message: "El RUT y la fecha son requeridos",
        data: null
      });
    }

    await deleteTurnoService(rut, fecha);
    
    res.status(200).json({
      message: "Turno eliminado exitosamente",
      data: null
    });
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}
