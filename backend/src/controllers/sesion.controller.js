"use strict";
import { endSessionService, startSessionService } from "../services/sesion.service.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";

export async function startSession(req, res) {
  try {
    const [data, err] = await startSessionService(req.body);
    if (err) return handleErrorClient(res, 400, err);
    return handleSuccess(res, 201, "Sesión iniciada", data);
  } catch (e) {
    return handleErrorServer(res, 500, e.message);
  }
}

export async function endSession(req, res) {
  try {
    const sessionId = Number(req.body.sessionId || req.params.id);
    if (!sessionId) return handleErrorClient(res, 400, "sessionId requerido");
    const [data, err] = await endSessionService(sessionId, req.body);
    if (err) return handleErrorClient(res, 400, err);
    return handleSuccess(res, 200, "Sesión finalizada", data);
  } catch (e) {
    return handleErrorServer(res, 500, e.message);
  }
}
