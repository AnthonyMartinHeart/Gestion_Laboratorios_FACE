import { EntitySchema } from "typeorm";

const SolicitudEntity = new EntitySchema({
  name: "Solicitud",
  tableName: "solicitudes",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true
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
    profesorEmail: {
      type: "varchar",
      length: 255,
      nullable: false
    },
    titulo: {
      type: "varchar",
      length: 255,
      nullable: false
    },
    descripcion: {
      type: "text",
      nullable: true
    },
    laboratorio: {
      type: "varchar",
      length: 10,
      nullable: false // lab1, lab2, lab3
    },
    fecha: {
      type: "varchar", // Cambiado de "date" a "varchar" para evitar conversiones de timezone
      length: 10,
      nullable: true // Formato: YYYY-MM-DD
    },
    fechaTermino: {
      type: "varchar", // Cambiado de "date" a "varchar" para evitar conversiones de timezone
      length: 10,
      nullable: true // Formato: YYYY-MM-DD
    },
    tipoSolicitud: {
      type: "enum",
      enum: ["unica", "recurrente"],
      default: "unica"
    },
    diasSemana: {
      type: "json",
      nullable: true // Array de días para solicitudes recurrentes: ["lunes", "martes"]
    },
    horaInicio: {
      type: "varchar",
      length: 5,
      nullable: false
    },
    horaTermino: {
      type: "varchar",
      length: 5,
      nullable: false
    },
    estado: {
      type: "enum",
      enum: ["pendiente", "aprobada", "rechazada"],
      default: "pendiente"
    },
    motivoRechazo: {
      type: "text",
      nullable: true
    },
    administradorRut: {
      type: "varchar",
      length: 12,
      nullable: true // Se llena cuando se aprueba/rechaza
    },
    fechaRespuesta: {
      type: "timestamp",
      nullable: true
    },
    createdAt: {
      type: "timestamp",
      createDate: true
    },
    updatedAt: {
      type: "timestamp",
      updateDate: true
    }
  },
  relations: {
    clasesCanceladas: {
      type: "one-to-many",
      target: "Cancelacion",
      inverseSide: "solicitud"
    }
  }
});

export default SolicitudEntity;
