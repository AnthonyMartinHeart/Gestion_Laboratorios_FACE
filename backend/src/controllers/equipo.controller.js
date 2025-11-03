"use strict";
import { registerOrResolveDeviceService } from "../services/equipo.service.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";

export async function registerOrResolveDevice(req, res) {
  try {
    const [data, err] = await registerOrResolveDeviceService(req.body);
    if (err) return handleErrorClient(res, 400, err);
    return handleSuccess(res, 200, "Device resuelto", data);
  } catch (e) {
    return handleErrorServer(res, 500, e.message);
  }
}
