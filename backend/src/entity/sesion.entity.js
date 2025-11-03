"use strict";
import { EntitySchema } from "typeorm";

const SesionSchema = new EntitySchema({
  name: "Sesion",
  tableName: "sesiones",
  columns: {
    id: { type: "int", primary: true, generated: true },
    rut: { type: "varchar", length: 12, nullable: false }, // consistente con Reservation/User
    labId: { type: "int", nullable: false },
    deviceNumber: { type: "int", nullable: false }, // pcId
    ip: { type: "varchar", length: 64, nullable: true },
    hostname: { type: "varchar", length: 255, nullable: true },
    deviceId: { type: "varchar", length: 64, nullable: true },
    reservationId: { type: "int", nullable: true }, // link a reservas si matchea
    startedAt: {
      type: "timestamp with time zone",
      default: () => "CURRENT_TIMESTAMP",
      nullable: false,
    },
    endedAt: { type: "timestamp with time zone", nullable: true },
    status: {
      type: "varchar",
      length: 20,
      default: "active", // active | ending | ended
      nullable: false,
    },
    createdAt: {
      type: "timestamp with time zone",
      default: () => "CURRENT_TIMESTAMP",
      nullable: false,
    },
    updatedAt: {
      type: "timestamp with time zone",
      default: () => "CURRENT_TIMESTAMP",
      onUpdate: "CURRENT_TIMESTAMP",
      nullable: false,
    },
  },
  indices: [
    { name: "IDX_SESSION_DAY_PC", columns: ["deviceNumber", "labId", "status"] },
    { name: "IDX_SESSION_RUT", columns: ["rut"] },
  ],
});

export default SesionSchema;
