import { Router } from "express";
import { 
  crearSolicitud, 
  obtenerSolicitudes, 
  actualizarEstadoSolicitud, 
  eliminarSolicitud 
} from "../controllers/solicitud.controller.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { isAdmin, isProfesor } from "../middlewares/authorization.middleware.js";

const router = Router();

// Crear solicitud (solo profesores)
router.post('/', authenticateJwt, isProfesor, crearSolicitud);

// Obtener solicitudes (profesores ven las suyas, administradores ven todas)
router.get('/', authenticateJwt, (req, res, next) => {
  // Verificar que sea administrador o profesor
  if (req.user.rol !== 'administrador' && req.user.rol !== 'profesor') {
    return res.status(403).json({ 
      success: false, 
      error: "No tienes permisos para acceder a esta funcionalidad" 
    });
  }
  next();
}, obtenerSolicitudes);

// Actualizar estado de solicitud (solo administradores)
router.put('/:id', authenticateJwt, isAdmin, actualizarEstadoSolicitud);

// Eliminar solicitud (profesores y administradores)
router.delete('/:id', authenticateJwt, (req, res, next) => {
  // Verificar que sea administrador o profesor
  if (req.user.rol !== 'administrador' && req.user.rol !== 'profesor') {
    return res.status(403).json({ 
      success: false, 
      error: "No tienes permisos para realizar esta acción" 
    });
  }
  next();
}, eliminarSolicitud);

export default router;
