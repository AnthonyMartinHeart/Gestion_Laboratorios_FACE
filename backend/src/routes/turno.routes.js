"use strict";
import { Router } from "express";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { isAdmin } from "../middlewares/authorization.middleware.js";
import {
  getTurnosByFecha,
  getTurnoByRutAndFecha,
  saveOrUpdateTurno,
  deleteTurno
} from "../controllers/turno.controller.js";

const router = Router();

// Middleware para autenticación
router.use(authenticateJwt);

// Obtener turnos por fecha (accesible para todos los usuarios autenticados)
router.get("/fecha/:fecha", getTurnosByFecha);

// Obtener turno específico por RUT y fecha
router.get("/:rut/:fecha", getTurnoByRutAndFecha);

// Crear/actualizar turno (administradores pueden asignar, consultores pueden marcar)
router.post("/", saveOrUpdateTurno);
router.put("/", saveOrUpdateTurno);

// Eliminar turno (solo administradores)
router.delete("/:rut/:fecha", isAdmin, deleteTurno);

export default router;
