"use strict";
import Joi from "joi";

const domainEmailValidator = (value, helper) => {
  if (

    !value.endsWith("@alumnos.ubiobio.cl") &&
    !value.endsWith("@ubiobio.cl")
  ) {
    return helper.message(
       "El correo electrónico debe ser del dominio @alumnos.ubiobio.cl o @ubiobio.cl."
    );
  }
  return value;
};

export const userQueryValidation = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .messages({
      "number.base": "El id debe ser un número.",
      "number.integer": "El id debe ser un número entero.",
      "number.positive": "El id debe ser un número positivo.",
    }),
  email: Joi.string()
    .min(15)
    .max(50)
    .email()
    .pattern(/^[\w.-]+@(gmail\.cl|alumnos\.ubiobio\.cl|ubiobio\.cl)$/) 
    .messages({
      "string.empty": "El correo electrónico no puede estar vacío.",
      "string.base": "El correo electrónico debe ser de tipo string.",
      "string.email": "El correo electrónico debe finalizar en @gmail.cl, @alumnos.ubiobio.cl o @ubiobio.cl.",
      "string.min": "El correo electrónico debe tener como mínimo 15 caracteres.",
      "string.max": "El correo electrónico debe tener como máximo 50 caracteres.",
    })
    .custom(domainEmailValidator, "Validación dominio email"),

    rut: Joi.string()
    .min(9)
    .max(12)
    .pattern(/^(?:(?:[1-9]\d{0}|[1-2]\d{1})(\.\d{3}){2}|[1-9]\d{6}|[1-2]\d{7}|29\.999\.999|29999999)-[\dkK]$/)
    .messages({
      "string.empty": "El rut no puede estar vacío.",
      "string.base": "El rut debe ser de tipo string.",
      "string.min": "El rut debe tener como mínimo 9 caracteres.",
      "string.max": "El rut debe tener como máximo 12 caracteres.",
      "string.pattern.base": "Formato rut inválido, debe ser xx.xxx.xxx-x o xxxxxxxx-x.",
    }),
})
  .or("id", "email", "rut")
  .unknown(false)
  .messages({
    "object.unknown": "No se permiten propiedades adicionales.",
    "object.missing":
      "Debes proporcionar al menos un parámetro: id, email o rut.",
  });

export const userBodyValidation = Joi.object({
  nombreCompleto: Joi.string()
    .min(15)
    .max(50)
    .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .messages({
      "string.empty": "El nombre completo no puede estar vacío.",
      "string.base": "El nombre completo debe ser de tipo string.",
      "string.min": "El nombre completo debe tener como mínimo 15 caracteres.",
      "string.max": "El nombre completo debe tener como máximo 50 caracteres.",
      "string.pattern.base":
        "El nombre completo solo puede contener letras y espacios.",
    }),
  email: Joi.string()
    .min(15)
    .max(50)
    .email()
    .pattern(/^[\w.-]+@(gmail\.cl|alumnos\.ubiobio\.cl|ubiobio\.cl)$/) 
    .messages({
      "string.empty": "El correo electrónico no puede estar vacío.",
      "string.base": "El correo electrónico debe ser de tipo string.",
      "string.email": "El correo electrónico debe finalizar en @gmail.cl, @alumnos.ubiobio.cl o @ubiobio.cl.",
      "string.min": "El correo electrónico debe tener como mínimo 15 caracteres.",
      "string.max": "El correo electrónico debe tener como máximo 50 caracteres.",
    })
    .custom(domainEmailValidator, "Validación dominio email"),
  password: Joi.string()
    .min(8)
    .max(26)
    .pattern(/^[a-zA-Z0-9]+$/)
    .messages({
      "string.empty": "La contraseña no puede estar vacía.",
      "string.base": "La contraseña debe ser de tipo string.",
      "string.min": "La contraseña debe tener como mínimo 8 caracteres.",
      "string.max": "La contraseña debe tener como máximo 26 caracteres.",
      "string.pattern.base":
        "La contraseña solo puede contener letras y números.",
    }),
  newPassword: Joi.string()
    .min(8)
    .max(26)
    .allow("")
    .pattern(/^[a-zA-Z0-9]+$/)
    .messages({
      "string.empty": "La nueva contraseña no puede estar vacía.",
      "string.base": "La nueva contraseña debe ser de tipo string.",
      "string.min": "La nueva contraseña debe tener como mínimo 8 caracteres.",
      "string.max": "La nueva contraseña debe tener como máximo 26 caracteres.",
      "string.pattern.base":
        "La nueva contraseña solo puede contener letras y números.",
    }),
  rut: Joi.string()
    .min(9)
    .max(12)
    .pattern(/^(?:(?:[1-9]\d{0}|[1-2]\d{1})(\.\d{3}){2}|[1-9]\d{6}|[1-2]\d{7}|29\.999\.999|29999999)-[\dkK]$/)
    .messages({
      "string.empty": "El rut no puede estar vacío.",
      "string.base": "El rut debe ser de tipo string.",
      "string.min": "El rut debe tener como mínimo 9 caracteres.",
      "string.max": "El rut debe tener como máximo 12 caracteres.",
      "string.pattern.base": "Formato rut inválido, debe ser xx.xxx.xxx-x o xxxxxxxx-x.",
    }),
  rol: Joi.string()
    .min(4)
    .max(15)
    .messages({
      "string.base": "El rol debe ser de tipo string.",
      "string.min": "El rol debe tener como mínimo 4 caracteres.",
      "string.max": "El rol debe tener como máximo 15 caracteres.",
    }),
  carrera: Joi.string()
    .max(100)
    .allow(null, ''),
  anioIngreso: Joi.string()
    .pattern(/^[0-9]{4}$/)
    .custom((value, helper) => {
      if (!value) return value; // Permitir null/vacío
      
      const year = parseInt(value);
      const currentYear = new Date().getFullYear();
      
      if (year < 1950) {
        return helper.message("El año de ingreso no puede ser anterior a 1950");
      }
      if (year > currentYear + 1) {
        return helper.message("El año de ingreso no puede ser mayor al año siguiente");
      }
      
      return value;
    })
    .messages({
      "string.pattern.base": "El año de ingreso debe ser un año válido de 4 dígitos",
    })
    .allow(null, ''),
  anioEgreso: Joi.string()
    .custom((value, helper) => {
      if (!value) return value; // Permitir null/vacío
      
      // Valores especiales permitidos
      const specialValues = ['N/A', 'n/a', 'No aplica', 'no aplica', 'Sin definir', 'sin definir'];
      if (specialValues.includes(value)) {
        return value;
      }
      
      // Validar formato de año
      if (!/^[0-9]{4}$/.test(value)) {
        return helper.message("El año de egreso debe ser un año válido de 4 dígitos o un valor especial (N/A, No aplica, Sin definir)");
      }
      
      const year = parseInt(value);
      const currentYear = new Date().getFullYear();
      
      if (year < 1950) {
        return helper.message("El año de egreso no puede ser anterior a 1950");
      }
      if (year > currentYear + 10) {
        return helper.message("El año de egreso no puede ser muy lejano al futuro");
      }
      
      return value;
    })
    .messages({
      "string.base": "El año de egreso debe ser de tipo texto",
    })
    .allow(null, ''),
  activo: Joi.boolean().default(true),
})
  .or(
    "nombreCompleto",
    "email",
    "password",
    "newPassword",
    "rut",
    "rol"
  )
  .unknown(false)
  .messages({
    "object.unknown": "No se permiten propiedades adicionales.",
    "object.missing":
      "Debes proporcionar al menos un campo: nombreCompleto, email, password, newPassword, rut o rol.",
  });
