"use strict";
import Joi from "joi";

const labRanges = {
  1: { min: 1, max: 40 },
  2: { min: 41, max: 60 },
  3: { min: 61, max: 80 },
};

const checkPcInLab = (value, helpers) => {
  const { labId, pcId } = helpers.state.ancestors[0];
  const range = labRanges[labId];
  if (!range) {
    return helpers.message("LabId inválido, debe ser 1, 2 o 3");
  }
  if (pcId < range.min || pcId > range.max) {
    return helpers.message(`El PC ${pcId} no pertenece al laboratorio ${labId}`);
  }
  return value;
};

const horariosInicio = [
  "08:10",
  "09:40",
  "11:10",
  "12:40",
  "14:10",
  "15:40",
  "17:10",
  "00:00", // Para mantenimiento
];

const horariosTermino = [
  "09:30",
  "11:00",
  "12:30",
  "14:00",
  "15:30",
  "17:00",
  "18:30",
  "20:00",
  "23:59", // Para mantenimiento
];

export const reservationValidation = Joi.object({
  rut: Joi.string()
    .min(9)
    .max(12)
    .pattern(/^(?:(?:[1-9]\d{0}|[1-2]\d{1})(\.\d{3}){2}|[1-9]\d{6}|[1-2]\d{7}|29\.999\.999|29999999|00\.000\.000)-[\dkK]$/)
    .required()
    .messages({
      "string.base": "El rut debe ser un texto.",
      "string.empty": "El rut no puede estar vacío.",
      "string.pattern.base": "Formato RUT inválido.",
    }),

  carrera: Joi.string()
    .min(2)
    .max(15)
    .pattern(/^[A-Z]+$/)
    .required()
    .messages({
      "string.base": "La carrera debe ser un texto.",
      "string.empty": "La carrera no puede estar vacía.",
      "string.min": "La carrera debe tener al menos 2 caracteres.",
      "string.max": "La carrera no puede tener más de 15 caracteres.",
      "string.pattern.base": "La carrera debe contener solo letras mayúsculas.",
    }),

  horaInicio: Joi.string()
    .valid(...horariosInicio)
    .required()
    .messages({
      "any.only": "Hora de inicio inválida. Debe seleccionar una de las opciones disponibles.",
    }),

  horaTermino: Joi.string()
    .valid(...horariosTermino)
    .required()
    .messages({
      "any.only": "Hora de término inválida. Debe seleccionar una de las opciones disponibles.",
    }),

  labId: Joi.number()
    .integer()
    .valid(1, 2, 3)
    .required()
    .messages({
      "any.only": "LabId debe ser 1, 2 o 3.",
    }),

  pcId: Joi.number()
    .integer()
    .positive()
    .required()
    .custom(checkPcInLab, "Validación de PC dentro del laboratorio"),
});
