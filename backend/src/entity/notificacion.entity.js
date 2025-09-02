import { EntitySchema } from "typeorm";

const NotificacionSchema = new EntitySchema({
  name: "Notificacion",
  tableName: "notificaciones",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    tipo: {
      type: "varchar",
      length: 50,
      nullable: false,
      comment: "cancelacion, solicitud, mantenimiento, etc."
    },
    titulo: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    mensaje: {
      type: "text",
      nullable: false,
    },
    detalles: {
      type: "text",
      nullable: true,
      comment: "JSON con detalles adicionales"
    },
    targetRut: {
      type: "varchar",
      length: 12,
      nullable: true,
      comment: "RUT del usuario al que se dirige la notificación (null = para todos)"
    },
    fechaCreacion: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP",
      nullable: false,
    },
    leida: {
      type: "boolean",
      default: false,
      nullable: false,
    },
    fechaLectura: {
      type: "timestamp",
      nullable: true,
    },
  },
  indices: [
    {
      name: "IDX_NOTIFICACION_TIPO",
      columns: ["tipo"],
    },
    {
      name: "IDX_NOTIFICACION_FECHA",
      columns: ["fechaCreacion"],
    },
    {
      name: "IDX_NOTIFICACION_LEIDA",
      columns: ["leida"],
    },
    {
      name: "IDX_NOTIFICACION_TARGET_RUT",
      columns: ["targetRut"],
    },
  ],
});

export default NotificacionSchema;
