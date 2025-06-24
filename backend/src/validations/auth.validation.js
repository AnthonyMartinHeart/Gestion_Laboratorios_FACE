"use strict";
import Joi from "joi";

// Función personalizada para la validación del dominio de correo
const domainEmailValidator = (value, helper) => {
  const domain = value.toLowerCase(); // Solo para comparar

  if (
    !domain.endsWith("@gmail.cl") &&
    !domain.endsWith("@alumnos.ubiobio.cl") &&
    !domain.endsWith("@ubiobio.cl") 
  ) {
    return helper.message(
      "El correo electrónico debe finalizar en @gmail.cl, @alumnos.ubiobio.cl o @ubiobio.cl."
    );
  }

  return value; // ✅ Mantiene el email tal como lo escribió el usuario
};

// Esquema de validación para autenticación (login)
export const authValidation = Joi.object({
  email: Joi.string()
    .min(15)
    .max(50)
    .email()
    .pattern(/^[\w.-]+@(gmail\.cl|alumnos\.ubiobio\.cl|ubiobio\.cl)$/)
    .required()
    .messages({
      "string.empty": "El correo electrónico no puede estar vacío.",
      "any.required": "El correo electrónico es obligatorio.",
      "string.base": "El correo electrónico debe ser de tipo texto.",
      "string.email": "El correo electrónico debe finalizar en @gmail.cl, @alumnos.ubiobio.cl o @ubiobio.cl.",
      "string.min": "El correo electrónico debe tener al menos 15 caracteres.",
      "string.max": "El correo electrónico debe tener como máximo 50 caracteres.",
    })
    .custom(domainEmailValidator, "Validación dominio email"),
  password: Joi.string()
    .min(8)
    .max(26)
    .pattern(/^[a-zA-Z0-9]+$/)
    .required()
    .messages({
      "string.empty": "La contraseña no puede estar vacía.",
      "any.required": "La contraseña es obligatoria.",
      "string.base": "La contraseña debe ser de tipo texto.",
      "string.min": "La contraseña debe tener al menos 8 caracteres.",
      "string.max": "La contraseña debe tener como máximo 26 caracteres.",
      "string.pattern.base": "La contraseña solo puede contener letras y números.",
    }),
}).unknown(false).messages({
  "object.unknown": "No se permiten propiedades adicionales.",
});

// Esquema de validación para registro (signup)
export const registerValidation = Joi.object({
  nombreCompleto: Joi.string()
    .min(15)
    .max(50)
    .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .required()
    .messages({
      "string.empty": "El nombre completo no puede estar vacío.",
      "any.required": "El nombre completo es obligatorio.",
      "string.base": "El nombre completo debe ser de tipo texto.",
      "string.min": "El nombre completo debe tener al menos 15 caracteres.",
      "string.max": "El nombre completo debe tener como máximo 50 caracteres.",
      "string.pattern.base": "El nombre completo solo puede contener letras y espacios.",
    }),
  rut: Joi.string()
    .min(9)
    .max(12)
    .required()
    .pattern(/^(?:(?:[1-9]\d{0}|[1-2]\d{1})(\.\d{3}){2}|[1-9]\d{6}|[1-2]\d{7}|29\.999\.999|29999999)-[\dkK]$/)
    .messages({
      "string.empty": "El rut no puede estar vacío.",
      "string.base": "El rut debe ser de tipo string.",
      "string.min": "El rut debe tener como mínimo 9 caracteres.",
      "string.max": "El rut debe tener como máximo 12 caracteres.",
      "string.pattern.base": "Formato rut inválido, debe ser xx.xxx.xxx-x o xxxxxxxx-x.",
    }),
  email: Joi.string()
    .min(15)
    .max(50)
    .email()
    .pattern(/^[\w.-]+@(gmail\.cl|alumnos\.ubiobio\.cl|ubiobio\.cl)$/)
    .required()
    .messages({
      "string.empty": "El correo electrónico no puede estar vacío.",
      "any.required": "El correo electrónico es obligatorio.",
      "string.base": "El correo electrónico debe ser de tipo texto.",
      "string.email": "El correo electrónico debe finalizar en @gmail.cl, @alumnos.ubiobio.cl o @ubiobio.cl.",
      "string.min": "El correo electrónico debe tener al menos 15 caracteres.",
      "string.max": "El correo electrónico debe tener como máximo 50 caracteres.",
    })
    .custom(domainEmailValidator, "Validación dominio email"),
  password: Joi.string()
    .min(8)
    .max(26)
    .pattern(/^[a-zA-Z0-9]+$/)
    .required()
    .messages({
      "string.empty": "La contraseña no puede estar vacía.",
      "any.required": "La contraseña es obligatoria.",
      "string.base": "La contraseña debe ser de tipo texto.",
      "string.min": "La contraseña debe tener al menos 8 caracteres.",
      "string.max": "La contraseña debe tener como máximo 26 caracteres.",
      "string.pattern.base": "La contraseña solo puede contener letras y números.",
    }),
  carrera: Joi.string()
    .max(100)
    .allow(null, ''),
  anioIngreso: Joi.string()
    .max(10)
    .allow(null, ''),
})
  .unknown(false)
  .messages({
    "object.unknown": "No se permiten propiedades adicionales.",
  });
