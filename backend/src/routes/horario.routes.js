"use strict";
import { Router } from "express";
import { 
  getHorarios, 
  saveHorarios,
  cancelarClase,
  actualizarHorariosConClases
} from "../controllers/horario.controller.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { isAdmin } from "../middlewares/authorization.middleware.js";

const router = Router();

// Obtener horarios (accesible para todos los usuarios autenticados)
router.get("/", authenticateJwt, getHorarios);

// Guardar/actualizar horarios (solo administradores)
router.post("/", authenticateJwt, isAdmin, saveHorarios);
router.put("/", authenticateJwt, isAdmin, saveHorarios);

// Actualizar horarios con clases aprobadas (accesible para administradores)
router.post("/actualizar-con-clases", authenticateJwt, isAdmin, actualizarHorariosConClases);

// Cancelar una clase específica (solo profesores pueden cancelar sus clases)
router.patch("/cancelar-clase", authenticateJwt, cancelarClase);

export default router;
