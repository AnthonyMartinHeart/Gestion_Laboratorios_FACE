"use strict";
import {
    getAllLabConfigsService,
    setLabFreeModeService
} from "../services/labConfig.service.js";
import {
    handleErrorClient,
    handleErrorServer,
    handleSuccess,
} from "../handlers/responseHandlers.js";

import { getIO } from "../services/socket.service.js";

export async function updateLabFreeMode(req, res) {
  try {
    const labId = Number(req.params.labId);
    const { freeMode } = req.body;

    if (!Number.isFinite(labId)) {
      return handleErrorClient(res, 400, "labId inválido");
    }

    if (typeof freeMode !== "boolean") {
      return handleErrorClient(res, 400, "freeMode debe ser boolean");
    }

    const [config, err] = await setLabFreeModeService(labId, freeMode);
    if (err || !config) {
      return handleErrorClient(
        res,
        400,
        err || "No se pudo actualizar el modo libre",
      );
    }

   
    try {
      const io = getIO();
      const roomName = `lab_${config.labId}`;

      io.to(roomName).emit("lab_free_mode_changed", {
        type: "lab_free_mode_changed",
        labId: config.labId,
        freeMode: config.freeMode,
      });

      console.log(
        ` Emitido lab_free_mode_changed a sala ${roomName}:`,
        config.freeMode,
      );
    } catch (socketError) {
      console.error("Error al emitir evento de modo libre:", socketError);
      
    }

    return handleSuccess(res, 200, "Modo libre actualizado", {
      labId: config.labId,
      freeMode: config.freeMode,
    });
  } catch (e) {
    return handleErrorServer(res, 500, e.message);
  }
}


export async function getLabsConfig(req, res) {
  try {
    const [configs, err] = await getAllLabConfigsService();
    if (err) {
      return handleErrorClient(res, 400, err);
    }

    const data = configs.map((c) => ({
      labId: c.labId,
      freeMode: c.freeMode,
    }));

    return handleSuccess(res, 200, "Configuración de laboratorios", data);
  } catch (e) {
    return handleErrorServer(res, 500, e.message);
  }
}
