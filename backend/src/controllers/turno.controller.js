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
    
    console.log('📥 Datos recibidos en controller:', turnoData);
    
    // Validaciones más robustas
    if (!turnoData.rut || !turnoData.fecha) {
      return res.status(400).json({
        message: "El RUT y la fecha son requeridos",
        data: null
      });
    }

    // Asegurar que las horas vacías sean strings vacíos, no undefined/null
    const datosLimpios = {
      rut: turnoData.rut,
      nombre: turnoData.nombre || "",
      fecha: turnoData.fecha,
      horaEntradaAsignada: turnoData.horaEntradaAsignada || "",
      horaSalidaAsignada: turnoData.horaSalidaAsignada || "",
      horaEntradaMarcada: turnoData.horaEntradaMarcada || "",
      horaSalidaMarcada: turnoData.horaSalidaMarcada || "",
      observacion: turnoData.observacion || ""
    };

    console.log('🧹 Datos limpiados:', datosLimpios);

    const turno = await saveOrUpdateTurnoService(datosLimpios);
    
    console.log('✅ Turno guardado exitosamente:', turno);
    
    res.status(200).json({
      message: "Turno guardado exitosamente",
      data: turno
    });
  } catch (error) {
    console.error('❌ Error en saveOrUpdateTurno controller:', error);
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
