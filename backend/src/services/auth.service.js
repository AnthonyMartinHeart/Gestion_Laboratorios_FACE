"use strict";
import User from "../entity/user.entity.js";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/configDb.js";
import { comparePassword, encryptPassword } from "../helpers/bcrypt.helper.js";
import { ACCESS_TOKEN_SECRET } from "../config/configEnv.js";

export async function loginService(user) {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const { email, password } = user;

    const createErrorMessage = (dataInfo, message) => ({
      dataInfo,
      message
    });

    // Buscamos al usuario por su correo electrónico (en minúsculas)
    const userFound = await userRepository.findOne({
      where: { email: email.toLowerCase() },  // Comparamos el correo en minúsculas
    });

    if (!userFound) {
      return [null, createErrorMessage("email", "El correo electrónico es incorrecto")];
    }

    // Comparamos la contraseña ingresada (convertida a minúsculas) con la almacenada (que ya está en minúsculas)
    const isMatch = await comparePassword(password.toLowerCase(), userFound.password);

    if (!isMatch) {
      return [null, createErrorMessage("password", "La contraseña es incorrecta")];
    }

    // Si la contraseña es correcta, generamos el token JWT
    const payload = {
      nombreCompleto: userFound.nombreCompleto,
      email: userFound.email,
      rut: userFound.rut,
      rol: userFound.rol,
    };

    const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
      expiresIn: "1d",
    });

    return [accessToken, null];
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return [null, "Error interno del servidor"];
  }
}


export async function registerService(user) {
  try {
    const userRepository = AppDataSource.getRepository(User);

    const { nombreCompleto, rut, email, password } = user;

    const createErrorMessage = (dataInfo, message) => ({
      dataInfo,
      message
    });

    // Verificar si el correo electrónico ya está en uso
    const existingEmailUser = await userRepository.findOne({
      where: { email: email.toLowerCase() },  // Comparamos el correo en minúsculas
    });
    
    if (existingEmailUser) return [null, createErrorMessage("email", "Correo electrónico en uso")];

    // Verificar si el RUT ya está asociado a otra cuenta
    const existingRutUser = await userRepository.findOne({
      where: { rut },
    });

    if (existingRutUser) return [null, createErrorMessage("rut", "Rut ya asociado a una cuenta")];

    // Convertimos la contraseña a minúsculas antes de guardarla
    const newUser = userRepository.create({
      nombreCompleto,
      email: email.toLowerCase(), // Guardamos el correo en minúsculas
      rut,
      password: await encryptPassword(password.toLowerCase()),  // Convertir solo la contraseña a minúsculas
      rol: "usuario",
    });

    await userRepository.save(newUser);

    const { password: _, ...dataUser } = newUser;

    return [dataUser, null];
  } catch (error) {
    console.error("Error al registrar un usuario", error);
    return [null, "Error interno del servidor"];
  }
}

