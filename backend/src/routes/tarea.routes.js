"use strict";
import { Router } from "express";
import {
  createTarea,
  getTareas,
  getTareaById,
  updateTarea,
  deleteTarea,
  getMisTareas,
  completarTarea
} from "../controllers/tarea.controller.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { isAdmin, isAdminOrConsultor } from "../middlewares/authorization.middleware.js";

const router = Router();

// Middleware de autenticación para todas las rutas
router.use(authenticateJwt);

// Rutas para administradores
router.post("/", isAdmin, createTarea);                    // Crear tarea
router.get("/", isAdminOrConsultor, getTareas);            // Obtener tareas (filtradas por rol)
router.get("/:id", isAdminOrConsultor, getTareaById);      // Obtener tarea por ID
router.put("/:id", isAdmin, updateTarea);                 // Actualizar tarea (solo admin)
router.delete("/:id", isAdmin, deleteTarea);              // Eliminar tarea (solo admin)

// Rutas para consultores
router.get("/mis-tareas/list", isAdminOrConsultor, getMisTareas);             // Obtener mis tareas asignadas
router.patch("/:id/completar", isAdminOrConsultor, completarTarea);           // Marcar tarea como completada/no completada

export default router;
