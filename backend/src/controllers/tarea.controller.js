"use strict";
import { 
  createTareaService,
  getTareasService,
  getTareaByIdService,
  updateTareaService,
  deleteTareaService,
  getTareasByConsultorService,
  completarTareaService
} from "../services/tarea.service.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";

export async function createTarea(req, res) {
  try {
    const { titulo, descripcion, fechaLimite, asignadoAId, prioridad = "media" } = req.body;
    const asignadoPorId = req.userId; // Del middleware de autenticación

    if (!titulo || !descripcion || !fechaLimite || !asignadoAId) {
      return handleErrorClient(res, 400, "Faltan campos obligatorios");
    }

    const [tarea, error] = await createTareaService({
      titulo,
      descripcion,
      fechaLimite,
      asignadoPorId,
      asignadoAId,
      prioridad
    });

    if (error) return handleErrorClient(res, 400, error);

    handleSuccess(res, 201, "Tarea creada exitosamente", tarea);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getTareas(req, res) {
  try {
    const userRole = req.userRole;
    const userId = req.userId;
    const { fecha, estado, prioridad } = req.query;

    const [tareas, error] = await getTareasService({
      userRole,
      userId,
      fecha,
      estado,
      prioridad
    });

    if (error) return handleErrorClient(res, 400, error);

    handleSuccess(res, 200, "Tareas obtenidas exitosamente", tareas);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getTareaById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const userRole = req.userRole;

    const [tarea, error] = await getTareaByIdService(id, userId, userRole);

    if (error) return handleErrorClient(res, 400, error);

    handleSuccess(res, 200, "Tarea obtenida exitosamente", tarea);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function updateTarea(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.userId;
    const userRole = req.userRole;

    const [tarea, error] = await updateTareaService(id, updateData, userId, userRole);

    if (error) return handleErrorClient(res, 400, error);

    handleSuccess(res, 200, "Tarea actualizada exitosamente", tarea);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function deleteTarea(req, res) {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const userRole = req.userRole;

    const [result, error] = await deleteTareaService(id, userId, userRole);

    if (error) return handleErrorClient(res, 400, error);

    handleSuccess(res, 200, "Tarea eliminada exitosamente");
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getMisTareas(req, res) {
  try {
    const userId = req.userId;
    const { fecha, estado } = req.query;

    const [tareas, error] = await getTareasByConsultorService(userId, { fecha, estado });

    if (error) return handleErrorClient(res, 400, error);

    handleSuccess(res, 200, "Mis tareas obtenidas exitosamente", tareas);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function completarTarea(req, res) {
  try {
    const { id } = req.params;
    const { completada, observaciones } = req.body;
    const userId = req.userId;

    if (typeof completada !== "boolean") {
      return handleErrorClient(res, 400, "El campo 'completada' es obligatorio y debe ser booleano");
    }

    const [tarea, error] = await completarTareaService(id, userId, completada, observaciones);

    if (error) return handleErrorClient(res, 400, error);

    handleSuccess(res, 200, "Tarea actualizada exitosamente", tarea);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}
