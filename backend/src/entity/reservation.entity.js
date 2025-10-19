"use strict";
import { EntitySchema } from "typeorm";

const ReservationSchema = new EntitySchema({
  name: "Reservation",
  tableName: "reservations",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    rut: {
      type: "varchar",
      length: 12,
      nullable: false,
    },
    carrera: {
      type: "varchar",
      length: 100,
      nullable: false,
    },
    horaInicio: {
      type: "time",
      nullable: false,
    },
    horaTermino: {
      type: "time",
      nullable: false,
    },
    fechaReserva: {
      type: "date",
      default: () => "CURRENT_DATE",
      nullable: true, // Permitir NULL temporalmente para migración
    },
    labId: {
      type: "int",
      nullable: false,
    },
    pcId: {
      type: "int",
      nullable: false,
    },
    status: {
      type: "varchar",
      length: 20,
      default: "active",
      nullable: false,
    },
  },
  indices: [
    {
      name: "IDX_RES_PC_TIME",
      columns: ["pcId", "horaInicio", "horaTermino", "fechaReserva"],
    },
  ],
});

export default ReservationSchema;
