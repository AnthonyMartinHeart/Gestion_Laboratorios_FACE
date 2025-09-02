"use strict";
import { EntitySchema } from "typeorm";

const Horario = new EntitySchema({
  name: "Horario",
  tableName: "horarios",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    data: {
      type: "jsonb", // Usar jsonb para mejor rendimiento en PostgreSQL
      nullable: false,
    },
    lastModified: {
      type: "timestamp", // Cambiado de datetime a timestamp para PostgreSQL
      nullable: false,
      default: () => "CURRENT_TIMESTAMP",
    },
    modifiedBy: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    createdAt: {
      type: "timestamp", // Cambiado de datetime a timestamp
      default: () => "CURRENT_TIMESTAMP",
      nullable: false,
    },
    updatedAt: {
      type: "timestamp", // Cambiado de datetime a timestamp
      default: () => "CURRENT_TIMESTAMP",
      onUpdate: "CURRENT_TIMESTAMP",
      nullable: false,
    },
  },
});

export default Horario;
