"use strict";
import { EntitySchema } from "typeorm";

const TareaSchema = new EntitySchema({
  name: "Tarea",
  tableName: "tareas",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    titulo: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    descripcion: {
      type: "text",
      nullable: false,
    },
    fechaAsignacion: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP",
    },
    fechaLimite: {
      type: "date",
      nullable: true, // Permitir NULL temporalmente para migración
    },
    estado: {
      type: "enum",
      enum: ["pendiente", "completada", "no_completada"],
      default: "pendiente",
    },
    observaciones: {
      type: "text",
      nullable: true,
    },
    fechaCompletacion: {
      type: "timestamp",
      nullable: true,
    },
    prioridad: {
      type: "enum",
      enum: ["baja", "media", "alta"],
      default: "media",
    },
    createdAt: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP",
    },
    updatedAt: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP",
      onUpdate: "CURRENT_TIMESTAMP",
    },
  },
  relations: {
    asignadoPor: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "asignado_por_id" },
      nullable: false,
    },
    asignadoA: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "asignado_a_id" },
      nullable: false,
    },
  },
});

export default TareaSchema;
