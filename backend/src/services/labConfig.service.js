"use strict";
import { AppDataSource } from "../config/configDb.js";
import LabConfig from "../entity/labConfig.entity.js";

export async function setLabFreeModeService(labId, freeMode) {
  try {
    const repo = AppDataSource.getRepository(LabConfig);

    let config = await repo.findOne({ where: { labId } });
    if (!config) {
      config = repo.create({
        labId,
        freeMode: !!freeMode,
      });
    } else {
      config.freeMode = !!freeMode;
    }

    const saved = await repo.save(config);
    return [saved, null];
  } catch (e) {
    console.error("setLabFreeModeService error:", e);
    return [null, "Error interno al actualizar modo libre del laboratorio"];
  }
}

export async function getAllLabConfigsService() {
  try {
    const repo = AppDataSource.getRepository(LabConfig);
    const configs = await repo.find();
    return [configs, null];
  } catch (e) {
    console.error("getAllLabConfigsService error:", e);
    return [null, "Error interno al obtener configuración de laboratorios"];
  }
}

export async function getLabFreeModeService(labId) {
  try {
    const repo = AppDataSource.getRepository(LabConfig);
    const config = await repo.findOne({ where: { labId } });
    return [config?.freeMode ?? false, null];
  } catch (e) {
    console.error("getLabFreeModeService error:", e);
    return [false, "Error interno al obtener modo libre del laboratorio"];
  }
}
