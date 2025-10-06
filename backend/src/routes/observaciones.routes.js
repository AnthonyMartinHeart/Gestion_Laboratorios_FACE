"use strict";
import { Router } from "express";
import { 
  getObservacionesByFecha, 
  saveOrUpdateObservacion,
  deleteObservacion
} from "../controllers/observaciones.controller.js";
import { isAdmin, isConsultor } from "../middlewares/authorization.middleware.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateJwt);

// Obtener observaciones por fecha (admin y consultor)
router.get("/:fecha", getObservacionesByFecha);

// Guardar o actualizar observación (admin y consultor)
router.post("/:fecha", saveOrUpdateObservacion);

// Eliminar observación (solo admin)
router.delete("/:fecha", isAdmin, deleteObservacion);

export default router;
