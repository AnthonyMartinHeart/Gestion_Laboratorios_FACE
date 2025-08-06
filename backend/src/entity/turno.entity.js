import { EntitySchema } from "typeorm";

const Turno = new EntitySchema({
  name: "Turno",
  tableName: "turnos",
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
      nullable: false,
    },
    horaEntradaAsignada: {
      type: "varchar",
      length: 20,
      nullable: true,
    },
    horaSalidaAsignada: {
      type: "varchar",
      length: 20,
      nullable: true,
    },
    horaEntradaMarcada: {
      type: "varchar",
      length: 20,
      nullable: true,
    },
    horaSalidaMarcada: {
      type: "varchar",
      length: 20,
      nullable: true,
    },
    observacion: {
      type: "text",
      nullable: true,
    },
    createdAt: {
      type: "timestamp",
      createDate: true,
    },
    updatedAt: {
      type: "timestamp",
      updateDate: true,
    },
  },
  indices: [
    {
      name: "IDX_TURNO_RUT_FECHA",
      columns: ["rut", "fecha"],
      unique: true,
    },
  ],
});

export default Turno;
