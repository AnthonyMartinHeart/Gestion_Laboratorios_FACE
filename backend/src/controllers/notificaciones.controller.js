import { AppDataSource } from "../config/configDb.js";
import Notificacion from "../entity/notificacion.entity.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";
import { In } from "typeorm";

const notificacionRepository = AppDataSource.getRepository(Notificacion);

export async function obtenerNotificaciones(req, res) {
  try {
    const { user } = req;
    
    // Permitir notificaciones para administradores, consultores, profesores, estudiantes y usuarios
    if (!['administrador', 'consultor', 'profesor', 'estudiante', 'usuario'].includes(user.rol)) {
      return handleErrorClient(res, 403, "No tienes permisos para ver notificaciones");
    }

    let notificaciones;

    if (user.rol === 'administrador') {
      // Los administradores ven:
      // 1. Notificaciones dirigidas específicamente a ellos
      // 2. Notificaciones generales (targetRut = null)
      // PERO NO las notificaciones dirigidas a otros usuarios específicos
      notificaciones = await notificacionRepository.find({
        where: [
          { targetRut: user.rut }, // Notificaciones específicas para este admin
          { targetRut: null }      // Notificaciones generales
        ],
        order: { fechaCreacion: "DESC" },
        take: 50
      });
    } else if (user.rol === 'profesor') {
      // Los profesores solo ven notificaciones relacionadas con sus solicitudes
      notificaciones = await notificacionRepository.find({
        where: [
          { tipo: 'solicitud_aprobada', targetRut: user.rut },
          { tipo: 'solicitud_rechazada', targetRut: user.rut }
        ],
        order: { fechaCreacion: "DESC" },
        take: 50
      });
    } else if (user.rol === 'consultor') {
      // Los consultores ven notificaciones de horarios, turnos, tareas y reservas
      notificaciones = await notificacionRepository.find({
        where: [
          { tipo: 'horario_actualizado' },
          { tipo: 'turno_asignado', targetRut: user.rut },
          { tipo: 'tarea_asignada', targetRut: user.rut },
          { tipo: 'reserva_equipo', targetRut: user.rut }
        ],
        order: { fechaCreacion: "DESC" },
        take: 50
      });
    } else if (user.rol === 'estudiante' || user.rol === 'usuario') {
      // Los estudiantes y usuarios solo ven sus notificaciones de reservas
      notificaciones = await notificacionRepository.find({
        where: [
          { tipo: 'reserva_equipo', targetRut: user.rut }
        ],
        order: { fechaCreacion: "DESC" },
        take: 50
      });
    }

    handleSuccess(res, 200, "Notificaciones obtenidas exitosamente", notificaciones);
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    handleErrorServer(res, 500, error.message);
  }
}

export async function obtenerConteoNoLeidas(req, res) {
  try {
    const { user } = req;
    
    // Permitir conteo para administradores, consultores, profesores, estudiantes y usuarios
    if (!['administrador', 'consultor', 'profesor', 'estudiante', 'usuario'].includes(user.rol)) {
      return handleErrorClient(res, 403, "No tienes permisos para ver notificaciones");
    }

    let count;

    if (user.rol === 'administrador') {
      count = await notificacionRepository.count({
        where: { leida: false }
      });
    } else if (user.rol === 'profesor') {
      count = await notificacionRepository.count({
        where: [
          { tipo: 'solicitud_aprobada', targetRut: user.rut, leida: false },
          { tipo: 'solicitud_rechazada', targetRut: user.rut, leida: false }
        ]
      });
    } else if (user.rol === 'consultor') {
      count = await notificacionRepository.count({
        where: [
          { tipo: 'horario_actualizado', leida: false },
          { tipo: 'turno_asignado', targetRut: user.rut, leida: false },
          { tipo: 'tarea_asignada', targetRut: user.rut, leida: false },
          { tipo: 'reserva_equipo', targetRut: user.rut, leida: false }
        ]
      });
    } else if (user.rol === 'estudiante' || user.rol === 'usuario') {
      count = await notificacionRepository.count({
        where: [
          { tipo: 'reserva_equipo', targetRut: user.rut, leida: false }
        ]
      });
    }

    handleSuccess(res, 200, "Conteo obtenido exitosamente", { count });
  } catch (error) {
    console.error("Error al obtener conteo de notificaciones:", error);
    handleErrorServer(res, 500, error.message);
  }
}

export async function marcarComoLeida(req, res) {
  try {
    const { user } = req;
    const { id } = req.params;
    
    // Permitir marcar para administradores, consultores, profesores, estudiantes y usuarios
    if (!['administrador', 'consultor', 'profesor', 'estudiante', 'usuario'].includes(user.rol)) {
      return handleErrorClient(res, 403, "No tienes permisos para modificar notificaciones");
    }

    const notificacion = await notificacionRepository.findOne({
      where: { id: parseInt(id) }
    });

    if (!notificacion) {
      return handleErrorClient(res, 404, "Notificación no encontrada");
    }

    // Verificar que el usuario tenga acceso a esta notificación específica
    if (user.rol !== 'administrador') {
      if (notificacion.targetRut && notificacion.targetRut !== user.rut) {
        return handleErrorClient(res, 403, "No tienes permisos para modificar esta notificación");
      }
    }

    notificacion.leida = true;
    notificacion.fechaLectura = new Date();
    
    await notificacionRepository.save(notificacion);

    handleSuccess(res, 200, "Notificación marcada como leída", notificacion);
  } catch (error) {
    console.error("Error al marcar notificación como leída:", error);
    handleErrorServer(res, 500, error.message);
  }
}

export async function marcarTodasComoLeidas(req, res) {
  try {
    const { user } = req;
    
    // Permitir marcar todas para administradores, consultores, profesores, estudiantes y usuarios
    if (!['administrador', 'consultor', 'profesor', 'estudiante', 'usuario'].includes(user.rol)) {
      return handleErrorClient(res, 403, "No tienes permisos para modificar notificaciones");
    }

    if (user.rol === 'administrador') {
      // Los administradores marcan todas las notificaciones como leídas
      await notificacionRepository.update(
        { leida: false },
        { 
          leida: true,
          fechaLectura: new Date()
        }
      );
    } else if (user.rol === 'profesor') {
      // Los profesores solo marcan sus notificaciones como leídas
      await notificacionRepository.update(
        { 
          leida: false,
          targetRut: user.rut,
          tipo: In(['solicitud_aprobada', 'solicitud_rechazada'])
        },
        { 
          leida: true,
          fechaLectura: new Date()
        }
      );
    } else if (user.rol === 'consultor') {
      // Los consultores marcan sus notificaciones como leídas
      await notificacionRepository.update(
        { 
          leida: false,
          tipo: In(['horario_actualizado', 'turno_asignado', 'tarea_asignada', 'reserva_equipo'])
        },
        { 
          leida: true,
          fechaLectura: new Date()
        }
      );
    } else if (user.rol === 'estudiante' || user.rol === 'usuario') {
      // Los estudiantes y usuarios marcan sus notificaciones de reservas como leídas
      await notificacionRepository.update(
        { 
          leida: false,
          targetRut: user.rut,
          tipo: 'reserva_equipo'
        },
        { 
          leida: true,
          fechaLectura: new Date()
        }
      );
    }

    handleSuccess(res, 200, "Todas las notificaciones marcadas como leídas");
  } catch (error) {
    console.error("Error al marcar todas las notificaciones como leídas:", error);
    handleErrorServer(res, 500, error.message);
  }
}

export async function limpiarNotificaciones(req, res) {
  try {
    const { user } = req;
    
    // Permitir limpiar para administradores, consultores, profesores, estudiantes y usuarios
    if (!['administrador', 'consultor', 'profesor', 'estudiante', 'usuario'].includes(user.rol)) {
      return handleErrorClient(res, 403, "No tienes permisos para limpiar notificaciones");
    }

    if (user.rol === 'administrador') {
      // Los administradores pueden limpiar todas las notificaciones
      await notificacionRepository.delete({});
    } else if (user.rol === 'profesor') {
      // Los profesores solo pueden limpiar sus notificaciones específicas
      await notificacionRepository.delete({
        targetRut: user.rut,
        tipo: In(['solicitud_aprobada', 'solicitud_rechazada'])
      });
    } else if (user.rol === 'consultor') {
      // Los consultores pueden limpiar sus notificaciones específicas
      await notificacionRepository.delete([
        { tipo: 'horario_actualizado' },
        { tipo: 'turno_asignado', targetRut: user.rut },
        { tipo: 'tarea_asignada', targetRut: user.rut },
        { tipo: 'reserva_equipo', targetRut: user.rut }
      ]);
    } else if (user.rol === 'estudiante' || user.rol === 'usuario') {
      // Los estudiantes y usuarios pueden limpiar sus notificaciones de reservas
      await notificacionRepository.delete({
        targetRut: user.rut,
        tipo: 'reserva_equipo'
      });
    }

    handleSuccess(res, 200, "Notificaciones limpiadas exitosamente");
  } catch (error) {
    console.error("Error al limpiar notificaciones:", error);
    handleErrorServer(res, 500, error.message);
  }
}

export async function crearNotificacion(tipo, titulo, mensaje, detalles = {}, targetRut = null) {
  try {
    console.log(`🔔 Creando notificación:`, { tipo, titulo, targetRut });
    
    const notificacion = notificacionRepository.create({
      tipo,
      titulo,
      mensaje,
      detalles: JSON.stringify(detalles),
      targetRut,
      fechaCreacion: new Date(),
      leida: false
    });

    const notificacionGuardada = await notificacionRepository.save(notificacion);
    console.log(`✅ Notificación creada con ID: ${notificacionGuardada.id} ${targetRut ? `para ${targetRut}` : 'para todos'}`);
    
    return notificacionGuardada;
  } catch (error) {
    console.error("❌ Error al crear notificación:", error);
    throw error;
  }
}
