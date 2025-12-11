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


// Lab 1 usa IPs 101-140 (PC 1-40), el resto es directo
function ipOctetToDeviceNumber(octet) {
  if (!Number.isFinite(octet)) return undefined;
  
 
  if (octet >= 101 && octet <= 140) {
    return octet - 100;
  }
  
  // Lab 2 y 3: directo
  if (octet >= 1 && octet <= 80) {
    return octet;
  }
  
  return undefined;
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

    
    const octet = lastOctet(ip);
    const deviceFromIP = ipOctetToDeviceNumber(octet);
    
    let numberToAssign = Number.isFinite(suggestedNumber)
      ? Number(suggestedNumber)
      : deviceFromIP;

    // Determinar laboratorio
    let resolvedLabId = labId
      ?? (Number.isFinite(numberToAssign) ? mapDeviceToLab(numberToAssign) : null);

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



