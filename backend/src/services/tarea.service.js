import { AppDataSource } from "../config/configDb.js";
import { crearNotificacion } from "../controllers/notificaciones.controller.js";

const tareaRepository = AppDataSource.getRepository("Tarea");
const userRepository = AppDataSource.getRepository("User");

export async function createTareaService(tareaData) {
  try {
    const { titulo, descripcion, fechaLimite, prioridad, asignadoPorId, asignadoAId } = tareaData;

    // Verificar que el usuario asignador existe y es administrador
    const asignadoPor = await userRepository.findOne({
      where: { id: asignadoPorId }
    });

    if (!asignadoPor) {
      return [null, "Usuario asignador no encontrado"];
    }

    if (asignadoPor.rol !== "administrador") {
      return [null, "Solo los administradores pueden asignar tareas"];
    }

    // Verificar que el usuario asignado existe y es consultor
    const asignadoA = await userRepository.findOne({
      where: { id: asignadoAId }
    });

    if (!asignadoA) {
      return [null, "Usuario asignado no encontrado"];
    }

    if (asignadoA.rol !== "consultor") {
      return [null, "Solo se pueden asignar tareas a consultores"];
    }

    const nuevaTarea = tareaRepository.create({
      titulo,
      descripcion,
      fechaLimite: fechaLimite, // Guardar directamente como string YYYY-MM-DD
      fechaAsignacion: new Date(),
      prioridad,
      estado: "pendiente",
      asignadoPor: asignadoPor,
      asignadoA: asignadoA
    });

    const tareaGuardada = await tareaRepository.save(nuevaTarea);

    // Crear notificación para el consultor (receptor de la tarea)
    try {
      await crearNotificacion(
        "tarea_asignada",
        "Nueva tarea asignada",
        `Se te ha asignado una nueva tarea: ${titulo}`,
        {
          tareaId: tareaGuardada.id,
          titulo: titulo,
          prioridad: prioridad,
          fechaLimite: fechaLimite,
          asignadoPor: asignadoPor.nombreCompleto
        },
        asignadoA.rut
      );
      console.log(`📧 Notificación de tarea enviada a ${asignadoA.nombreCompleto} (${asignadoA.rut})`);
    } catch (notifError) {
      console.error("Error al crear notificación para consultor:", notifError);
    }

    // Crear notificación para el administrador que asignó la tarea
    try {
      await crearNotificacion(
        "tarea_asignada_admin",
        "Tarea asignada exitosamente",
        `Se ha asignado una nueva tarea: ${titulo} a ${asignadoA.nombreCompleto}`,
        {
          tareaId: tareaGuardada.id,
          titulo: titulo,
          prioridad: prioridad,
          fechaLimite: fechaLimite,
          asignadoA: asignadoA.nombreCompleto
        },
        asignadoPor.rut
      );
      console.log(`📧 Notificación de confirmación enviada a admin ${asignadoPor.nombreCompleto} (${asignadoPor.rut})`);
    } catch (notifError) {
      console.error("Error al crear notificación para administrador:", notifError);
    }

    return [tareaGuardada, null];
  } catch (error) {
    console.error("Error al crear tarea:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function getTareasService(filters) {
  try {
    const { userRole, userId, fechaLimite, fechaAsignacion, estado, prioridad } = filters;

    let whereConditions = {};

    // Filtros basados en el rol
    if (userRole === "administrador") {
      // Los administradores pueden ver todas las tareas que han asignado
      whereConditions = { ...whereConditions, asignadoPor: { id: userId } };
    } else if (userRole === "consultor") {
      // Los consultores solo ven sus tareas asignadas
      whereConditions = { ...whereConditions, asignadoA: { id: userId } };
    } else {
      return [null, "No tienes permisos para ver tareas"];
    }

    // Aplicar filtros adicionales
    if (estado) {
      whereConditions.estado = estado;
    }

    if (prioridad) {
      whereConditions.prioridad = prioridad;
    }

    let queryBuilder = tareaRepository.createQueryBuilder("tarea")
      .leftJoinAndSelect("tarea.asignadoPor", "asignadoPor")
      .leftJoinAndSelect("tarea.asignadoA", "asignadoA");

    // Aplicar condiciones WHERE para relaciones
    if (userRole === "administrador") {
      queryBuilder = queryBuilder.where("asignadoPor.id = :userId", { userId });
    } else if (userRole === "consultor") {
      queryBuilder = queryBuilder.where("asignadoA.id = :userId", { userId });
    }

    // Aplicar filtros adicionales
    if (estado) {
      queryBuilder = queryBuilder.andWhere("tarea.estado = :estado", { estado });
    }

    if (prioridad) {
      queryBuilder = queryBuilder.andWhere("tarea.prioridad = :prioridad", { prioridad });
    }

    // Filtro por fecha límite
    if (fechaLimite) {
      console.log('DEBUG ADMIN - Fecha límite recibida:', fechaLimite);
      
      // Convertir la fecha a formato YYYY-MM-DD
      const fechaFormateada = fechaLimite.split('T')[0];
      console.log('DEBUG ADMIN - Fecha formateada:', fechaFormateada);
      
      queryBuilder = queryBuilder.andWhere(
        "DATE(tarea.fechaLimite) = :fechaLimite",
        { fechaLimite: fechaFormateada }
      );
      
      console.log('DEBUG ADMIN - Aplicado filtro fecha límite:', fechaFormateada);
    }

    // Filtro por fecha de asignación
    if (fechaAsignacion) {
      const fechaAsignacionInicio = new Date(fechaAsignacion + 'T00:00:00');
      
      console.log('DEBUG - Filtro fecha asignación:', {
        fechaOriginal: fechaAsignacion,
        inicio: fechaAsignacionInicio
      });

      queryBuilder = queryBuilder.andWhere(
        "DATE(tarea.fechaAsignacion) = DATE(:fechaAsignacion)",
        { fechaAsignacion: fechaAsignacionInicio }
      );
    }

    // Log de la consulta final
    const [query, parameters] = queryBuilder.getQueryAndParameters();
    console.log('DEBUG ADMIN - Query final:', query);
    console.log('DEBUG ADMIN - Parámetros:', parameters);

    const tareas = await queryBuilder
      .orderBy("tarea.fechaLimite", "ASC")
      .addOrderBy("tarea.prioridad", "DESC")
      .getMany();

    console.log('DEBUG ADMIN - Tareas encontradas:', tareas.length);
    console.log('DEBUG ADMIN - Detalle de tareas:', tareas.map(t => ({
      id: t.id,
      titulo: t.titulo,
      fechaLimiteOriginal: t.fechaLimite,
      fechaLimiteFormateada: new Date(t.fechaLimite).toISOString().split('T')[0],
      fechaLimiteTipo: typeof t.fechaLimite
    })));

    return [tareas, null];
  } catch (error) {
    console.error("Error al obtener tareas:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function getTareaByIdService(tareaId, userId, userRole) {
  try {
    const tarea = await tareaRepository.findOne({
      where: { id: tareaId },
      relations: ["asignadoPor", "asignadoA"]
    });

    if (!tarea) {
      return [null, "Tarea no encontrada"];
    }

    // Verificar permisos
    const puedeVer = userRole === "administrador" && tarea.asignadoPor.id === userId ||
                     userRole === "consultor" && tarea.asignadoA.id === userId;

    if (!puedeVer) {
      return [null, "No tienes permisos para ver esta tarea"];
    }

    return [tarea, null];
  } catch (error) {
    console.error("Error al obtener tarea:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function updateTareaService(tareaId, updateData, userId, userRole) {
  try {
    const tarea = await tareaRepository.findOne({
      where: { id: tareaId },
      relations: ["asignadoPor", "asignadoA"]
    });

    if (!tarea) {
      return [null, "Tarea no encontrada"];
    }

    // Solo el administrador que creó la tarea puede editarla
    if (userRole !== "administrador" || tarea.asignadoPor.id !== userId) {
      return [null, "No tienes permisos para editar esta tarea"];
    }

    // Actualizar campos permitidos
    const camposPermitidos = ["titulo", "descripcion", "fechaLimite", "prioridad"];
    camposPermitidos.forEach(campo => {
      if (updateData[campo] !== undefined) {
        tarea[campo] = updateData[campo];
      }
    });

    const tareaActualizada = await tareaRepository.save(tarea);
    return [tareaActualizada, null];
  } catch (error) {
    console.error("Error al actualizar tarea:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function deleteTareaService(tareaId, userId, userRole) {
  try {
    const tarea = await tareaRepository.findOne({
      where: { id: tareaId },
      relations: ["asignadoPor"]
    });

    if (!tarea) {
      return [null, "Tarea no encontrada"];
    }

    // Solo el administrador que creó la tarea puede eliminarla
    if (userRole !== "administrador" || tarea.asignadoPor.id !== userId) {
      return [null, "No tienes permisos para eliminar esta tarea"];
    }

    await tareaRepository.remove(tarea);
    return [true, null];
  } catch (error) {
    console.error("Error al eliminar tarea:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function getTareasByConsultorService(consultorId, filters) {
  try {
    const { fechaLimite, fechaAsignacion, estado, prioridad } = filters;

    let queryBuilder = tareaRepository.createQueryBuilder("tarea")
      .leftJoinAndSelect("tarea.asignadoPor", "asignadoPor")
      .leftJoinAndSelect("tarea.asignadoA", "asignadoA")
      .where("tarea.asignadoA.id = :consultorId", { consultorId });

    // Aplicar filtros adicionales
    if (estado) {
      queryBuilder = queryBuilder.andWhere("tarea.estado = :estado", { estado });
    }

    if (prioridad) {
      queryBuilder = queryBuilder.andWhere("tarea.prioridad = :prioridad", { prioridad });
    }

    // Filtro por fecha límite
    if (fechaLimite) {
      console.log('DEBUG CONSULTOR - Fecha límite recibida:', fechaLimite);
      
      const fechaFormateada = fechaLimite.split('T')[0];
      console.log('DEBUG CONSULTOR - Fecha formateada:', fechaFormateada);
      
      queryBuilder = queryBuilder.andWhere(
        "DATE(tarea.fechaLimite) = :fechaLimite",
        { fechaLimite: fechaFormateada }
      );
      
      console.log('DEBUG CONSULTOR - Aplicado filtro fecha límite:', fechaFormateada);
    }

    // Filtro por fecha de asignación
    if (fechaAsignacion) {
      console.log('DEBUG CONSULTOR - Fecha asignación recibida:', fechaAsignacion);
      
      const fechaAsignacionInicio = new Date(fechaAsignacion + 'T00:00:00');
      
      console.log('DEBUG CONSULTOR - Filtro fecha asignación:', {
        fechaOriginal: fechaAsignacion,
        inicio: fechaAsignacionInicio
      });

      queryBuilder = queryBuilder.andWhere(
        "DATE(tarea.fechaAsignacion) = DATE(:fechaAsignacion)",
        { fechaAsignacion: fechaAsignacionInicio }
      );
    }

    // Log de la consulta final
    const [query, parameters] = queryBuilder.getQueryAndParameters();
    console.log('DEBUG CONSULTOR - Query final:', query);
    console.log('DEBUG CONSULTOR - Parámetros:', parameters);

    const tareas = await queryBuilder
      .orderBy("tarea.fechaLimite", "ASC")
      .addOrderBy("tarea.prioridad", "DESC")
      .getMany();

    console.log('DEBUG CONSULTOR - Tareas encontradas:', tareas.length);
    console.log('DEBUG CONSULTOR - Detalle de tareas:', tareas.map(t => ({
      id: t.id,
      titulo: t.titulo,
      fechaLimiteOriginal: t.fechaLimite,
      fechaLimiteFormateada: new Date(t.fechaLimite).toISOString().split('T')[0],
      fechaLimiteTipo: typeof t.fechaLimite
    })));

    return [tareas, null];
  } catch (error) {
    console.error("Error al obtener tareas del consultor:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function completarTareaService(tareaId, consultorId, completada, observaciones) {
  try {
    const tarea = await tareaRepository.findOne({
      where: { id: tareaId },
      relations: ["asignadoPor", "asignadoA"]
    });

    if (!tarea) {
      return [null, "Tarea no encontrada"];
    }

    // Verificar que la tarea pertenece al consultor
    if (tarea.asignadoA.id !== consultorId) {
      return [null, "No tienes permisos para completar esta tarea"];
    }

    // Actualizar estado y datos de completación
    tarea.estado = completada ? "completada" : "no_completada";
    tarea.observaciones = observaciones || null;
    tarea.fechaCompletacion = new Date();

    const tareaActualizada = await tareaRepository.save(tarea);

    // Crear notificación para el administrador
    try {
      await crearNotificacion(
        completada ? "tarea_completada" : "tarea_no_completada",
        completada ? "Tarea completada" : "Tarea no completada",
        `${tarea.asignadoA.nombreCompleto} ha marcado la tarea "${tarea.titulo}" como ${completada ? "completada" : "no completada"}`,
        {
          tareaId: tarea.id,
          titulo: tarea.titulo,
          consultor: tarea.asignadoA.nombreCompleto,
          observaciones: observaciones
        },
        tarea.asignadoPor.rut
      );
    } catch (notifError) {
      console.error("Error al crear notificación:", notifError);
      // No fallar si la notificación no se puede crear
    }

    return [tareaActualizada, null];
  } catch (error) {
    console.error("Error al completar tarea:", error);
    return [null, "Error interno del servidor"];
  }
}

// Función auxiliar para obtener consultores
export async function getConsultoresService() {
  try {
    const consultores = await userRepository.find({
      where: { rol: "consultor" },
      select: ["id", "nombreCompleto", "rut", "email"]
    });

    return [consultores, null];
  } catch (error) {
    console.error("Error al obtener consultores:", error);
    return [null, "Error interno del servidor"];
  }
}
