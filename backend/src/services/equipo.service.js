"use strict";
import { AppDataSource } from "../config/configDb.js";
import Device from "../entity/equipo.entity.js";

export async function registerOrResolveDeviceService(payload) {
  try {
    const { labId, ip, hostname, deviceId, suggestedNumber } = payload;
    if (!labId || !hostname || !deviceId) return [null, "labId, hostname y deviceId son requeridos"];

    const repo = AppDataSource.getRepository(Device);

    // Busca por deviceId o hostname
    let device = await repo.findOne({ where: [{ deviceId }, { hostname }] });
    if (device) {
      device.ip = ip || device.ip;
      await repo.save(device);
      return [ { deviceNumber: device.deviceNumber, fixed: true }, null ];
    }

    // Si no existe, asigna un numero
    let numberToAssign = suggestedNumber;
    const taken = (await repo.find({ where: { labId } }))
      .map(d => d.deviceNumber)
      .filter(Boolean);

    if (!numberToAssign || taken.includes(numberToAssign)) {
      for (let i = 1; i <= 200; i++) { // un rango suficiente xd
        if (!taken.includes(i)) { numberToAssign = i; break; }
      }
    }

    device = repo.create({ labId, deviceNumber: numberToAssign, hostname, deviceId, ip });
    await repo.save(device);
    return [ { deviceNumber: numberToAssign, fixed: true }, null ];
  } catch (e) {
    console.error("registerOrResolveDeviceService error:", e);
    return [null, "Error interno del servidor"];
  }
}
