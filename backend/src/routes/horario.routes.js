"use strict";
import { Router } from "express";
import { 
  getHorarios, 
  saveHorarios 
} from "../controllers/horario.controller.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { isAdmin } from "../middlewares/authorization.middleware.js";

const router = Router();

// Obtener horarios (accesible para todos los usuarios autenticados)
router.get("/", authenticateJwt, getHorarios);

// Guardar/actualizar horarios (solo administradores)
router.post("/", authenticateJwt, isAdmin, saveHorarios);
router.put("/", authenticateJwt, isAdmin, saveHorarios);

export default router;
