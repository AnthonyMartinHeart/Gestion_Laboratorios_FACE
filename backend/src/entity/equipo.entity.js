"use strict";
import { EntitySchema } from "typeorm";

const EquipoSchema = new EntitySchema({
  name: "Equipo",
  tableName: "equipos",
  columns: {
    id: { type: "int", primary: true, generated: true },
    labId: { type: "int", nullable: false },
    deviceNumber: { type: "int", nullable: false }, // tu pcId (1..80)
    hostname: { type: "varchar", length: 255, nullable: false },
    deviceId: { type: "varchar", length: 64, nullable: false }, // UUID de la app
    ip: { type: "varchar", length: 64, nullable: true },
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
    { name: "IDX_DEVICE_LAB_NUM", columns: ["labId", "deviceNumber"], unique: true },
    { name: "IDX_DEVICE_ID", columns: ["deviceId"], unique: true },
    { name: "IDX_DEVICE_HOSTNAME", columns: ["hostname"], unique: true },
  ],
});

export default EquipoSchema;
