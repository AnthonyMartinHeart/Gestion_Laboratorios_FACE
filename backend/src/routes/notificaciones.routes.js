import { Router } from "express";
import { 
  obtenerNotificaciones, 
  obtenerConteoNoLeidas, 
  marcarComoLeida, 
  marcarTodasComoLeidas,
  limpiarNotificaciones
} from "../controllers/notificaciones.controller.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateJwt);

// Obtener todas las notificaciones para el usuario autenticado
router.get("/", obtenerNotificaciones);

// Obtener conteo de notificaciones no leídas
router.get("/no-leidas/count", obtenerConteoNoLeidas);

// Marcar una notificación como leída
router.patch("/:id/leida", marcarComoLeida);

// Marcar todas las notificaciones como leídas
router.patch("/marcar-todas-leidas", marcarTodasComoLeidas);

// Limpiar todas las notificaciones
router.delete("/limpiar", limpiarNotificaciones);

export default router;
