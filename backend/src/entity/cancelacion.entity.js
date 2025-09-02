import { EntitySchema } from "typeorm";

const CancelacionEntity = new EntitySchema({
  name: "Cancelacion",
  tableName: "cancelaciones",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true
    },
    solicitudId: {
      type: "int",
      nullable: false
    },
    fechaEspecifica: {
      type: "date",
      nullable: false // Fecha específica de la clase cancelada
    },
    profesorRut: {
      type: "varchar",
      length: 12,
      nullable: false
    },
    profesorNombre: {
      type: "varchar",
      length: 255,
      nullable: false
    },
    motivoCancelacion: {
      type: "text",
      nullable: false
    },
    estado: {
      type: "enum",
      enum: ["pendiente", "vista", "archivada"],
      default: "pendiente"
    },
    fechaCancelacion: {
      type: "timestamp",
      createDate: true
    },
    vistaPorAdmin: {
      type: "timestamp",
      nullable: true
    }
  },
  relations: {
    solicitud: {
      target: "Solicitud",
      type: "many-to-one",
      joinColumn: { name: "solicitudId" }
    }
  }
});

export default CancelacionEntity;
