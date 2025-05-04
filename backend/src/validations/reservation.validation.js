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

export const reservationValidation = Joi.object({
  rut: Joi.string()
    .min(9).max(12)
    .pattern(/^(?:(?:[1-9]\d{0}|[1-2]\d{1})(\.\d{3}){2}|[1-9]\d{6}|[1-2]\d{7}|29\.999\.999|29999999)-[\dkK]$/)
    .required()
    .messages({
      "string.base": "El rut debe ser un texto.",
      "string.empty": "El rut no puede estar vacío.",
      "string.pattern.base": "Formato RUT inválido.",
    }),
  carrera: Joi.string().min(2).max(100).required(),
  horaInicio: Joi.string()
    .pattern(/^([0-1]\d|2[0-3]):[0-5]\d$/)
    .required()
    .messages({
      "string.pattern.base": "Hora de inicio debe tener formato HH:mm.",
    }),
  horaTermino: Joi.string()
    .pattern(/^([0-1]\d|2[0-3]):[0-5]\d$/)
    .required()
    .messages({
      "string.pattern.base": "Hora de término debe tener formato HH:mm.",
    }),
  labId: Joi.number()
    .integer().valid(1, 2, 3)
    .required()
    .messages({
      "any.only": "LabId debe ser 1, 2 o 3.",
    }),
  pcId: Joi.number()
    .integer().positive()
    .required()
    .custom(checkPcInLab, "Validación de PC dentro del laboratorio"),
});
