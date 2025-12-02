"use strict";
import { AppDataSource } from "../config/configDb.js";
import Device from "../entity/equipo.entity.js";
import LabConfig from "../entity/labConfig.entity.js";

function mapDeviceToLab(deviceNumber) {
  if (deviceNumber >= 1 && deviceNumber <= 40) return 1;
  if (deviceNumber >= 41 && deviceNumber <= 60) return 2;
  if (deviceNumber >= 61 && deviceNumber <= 80) return 3;
  return null; 
}

function lastOctet(ip) {
  if (!ip || typeof ip !== "string") return undefined;
  const parts = ip.trim().split(".");
  const n = Number(parts[parts.length - 1]);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

async function getFreeModeForLab(labId) {
  if (!Number.isFinite(labId)) return false;
  const repo = AppDataSource.getRepository(LabConfig);
  const config = await repo.findOne({ where: { labId } });
  return config?.freeMode ?? false;
}

export async function registerOrResolveDeviceService(payload) {
  try {
    const { labId, ip, hostname, deviceId, suggestedNumber } = payload;

    if (!hostname || !deviceId) {
      return [null, "hostname y deviceId son requeridos"];
    }

    const repo = AppDataSource.getRepository(Device);

    // 1) Buscar equipo por deviceId o hostname
    let device = await repo.findOne({ where: [{ deviceId }, { hostname }] });
    if (device) {
      const newIp = ip || device.ip;
      if (newIp !== device.ip) {
        device.ip = newIp;
        await repo.save(device);
      }

      const freeMode = await getFreeModeForLab(device.labId);

      return [
        {
          deviceNumber: device.deviceNumber,
          labId: device.labId,
          freeMode,
          fixed: true,
        },
        null,
      ];
    }

    
    let numberToAssign = Number.isFinite(suggestedNumber)
      ? Number(suggestedNumber)
      : lastOctet(ip);

    
    let resolvedLabId =
      labId ??
      (Number.isFinite(numberToAssign) ? mapDeviceToLab(numberToAssign) : null);

    if (!resolvedLabId) {
      return [null, "No se pudo asignar laboratorio al equipo"];
    }

    
    const taken = (await repo.find({ where: { labId: resolvedLabId } }))
      .map((d) => d.deviceNumber)
      .filter((n) => Number.isFinite(n));

    
    if (!Number.isFinite(numberToAssign) || taken.includes(numberToAssign)) {
      for (let i = 1; i <= 200; i++) {
        if (!taken.includes(i)) {
          numberToAssign = i;
          break;
        }
      }
    }

    
    device = repo.create({
      labId: resolvedLabId,
      deviceNumber: numberToAssign,
      hostname,
      deviceId,
      ip: ip || null,
    });

    await repo.save(device);

    const freeMode = await getFreeModeForLab(resolvedLabId);

    return [
      {
        deviceNumber: numberToAssign,
        labId: resolvedLabId,
        freeMode,
        fixed: true,
      },
      null,
    ];
  } catch (e) {
    console.error("registerOrResolveDeviceService error:", e);
    return [null, "Error interno del servidor"];
  }
}



