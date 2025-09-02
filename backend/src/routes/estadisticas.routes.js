"use strict";
import { Router } from "express";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { isAdmin } from "../middlewares/authorization.middleware.js";
import {
  getEstadisticasGenerales,
  getEstadisticasEquipos,
  getEstadisticasTemporales,
  getReporteCompleto,
  getEstadisticasAsistencia
} from "../controllers/estadisticas.controller.js";

const router = Router();

// Proteger todas las rutas con JWT y rol de administrador
router.use(authenticateJwt);
router.use(isAdmin);

// Ruta para obtener estadísticas generales con filtros
router.get("/generales", getEstadisticasGenerales);

// Ruta para obtener estadísticas específicas de equipos
router.get("/equipos", getEstadisticasEquipos);

// Ruta para obtener tendencias temporales
router.get("/temporales", getEstadisticasTemporales);

// Ruta para obtener reporte completo (todas las estadísticas)
router.get("/reporte-completo", getReporteCompleto);

// Ruta para obtener estadísticas de asistencia de consultores
router.get("/asistencia", getEstadisticasAsistencia);

export default router;
