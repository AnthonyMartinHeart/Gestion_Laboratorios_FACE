"use strict";
import { EntitySchema } from "typeorm";

const LabConfigSchema = new EntitySchema({
  name: "LabConfig",
  tableName: "labs_config",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    labId: {
      type: "int",
      nullable: false,
      unique: true,
    },
    freeMode: {
      type: "boolean",
      nullable: false,
      default: false,
    },
    updatedAt: {
      type: "timestamp with time zone",
      nullable: false,
      default: () => "CURRENT_TIMESTAMP",
      onUpdate: "CURRENT_TIMESTAMP",
    },
  },
});

export default LabConfigSchema;
