"use strict";
import { EntitySchema } from "typeorm";

const ObservacionSchema = new EntitySchema({
  name: "Observacion",
  tableName: "observaciones",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    rut: {
      type: "varchar",
      length: 12,
      nullable: false,
    },
    nombre: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    fecha: {
      type: "date",
      nullable: true, // Permitir NULL temporalmente para migración
    },
    observacion: {
      type: "text",
      nullable: true,
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
    {
      name: "IDX_OBSERVACION_RUT_FECHA",
      columns: ["rut", "fecha"],
      unique: true,
    },
  ],
});

export default ObservacionSchema;
