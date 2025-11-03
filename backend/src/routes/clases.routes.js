import { Router } from "express";
import {
  obtenerMisClases,
  cancelarClase,
  obtenerNotificacionesCancelaciones,
  marcarNotificacionVista,
  contarNotificacionesPendientes
} from "../controllers/clases.controller.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { isAdmin, isProfesor } from "../middlewares/authorization.middleware.js";

const router = Router();

// Rutas para profesores
router.get("/mis-clases", 
  authenticateJwt,
  isProfesor,
  obtenerMisClases
);

router.post("/cancelar-clase",
  authenticateJwt,
  isProfesor,
  cancelarClase
);

// Rutas para administradores
router.get("/notificaciones-cancelaciones",
  authenticateJwt,
  isAdmin,
  obtenerNotificacionesCancelaciones
);

router.put("/notificaciones/:id/vista",
  authenticateJwt,
  isAdmin,
  marcarNotificacionVista
);

router.get("/notificaciones/count",
  authenticateJwt,
  isAdmin,
  contarNotificacionesPendientes
);

export default router;


