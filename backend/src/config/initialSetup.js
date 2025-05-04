"use strict";
import User from "../entity/user.entity.js";
import { AppDataSource } from "./configDb.js";
import { encryptPassword } from "../helpers/bcrypt.helper.js";

async function createUsers() {
  try {
    const userRepository = AppDataSource.getRepository(User);

    const count = await userRepository.count();
    if (count > 0) return;

    await Promise.all([
      userRepository.save(
        userRepository.create({
          nombreCompleto: "Jorge Antonio Martinez Henriquez",
          rut: "21.069.508-7",
          email: "administrador2024@gmail.cl",
          password: await encryptPassword("admin1234"),
          rol: "administrador",
        }),
      ),
      userRepository.save(
        userRepository.create({
          nombreCompleto: "Hector Patricio Salazar Robinson",
          rut: "10.844.835-0",
          email: "admin2506.2025@gmail.cl",
          password: await encryptPassword("admin451234"),
          rol: "administrador",
        })
      ),
        userRepository.save(
          userRepository.create({
            nombreCompleto: "Verónica María Venegas Herrera",
            rut: "12.697.072-2",
            email: "Verovenegas.2025@gmail.cl",
            password: await encryptPassword("vero5234"),
            rol: "administrador",
          }),
      ),
      userRepository.save(
        userRepository.create({
          nombreCompleto: "Luis Alfredo Fernandez Canullan",
          rut: "20.255.005-3",
          email: "admin3.2025@gmail.cl",
          password: await encryptPassword("fernan454"),
          rol: "consultor",
        }),
      ),
      userRepository.save(
        userRepository.create({
          nombreCompleto: "Felipe Nicolas Medina Retamal",
          rut: "19.814.553-K",
          email: "felipnicme.2025@gmail.cl",
          password: await encryptPassword("felipnicmed1234"),
          rol: "consultor",
        }),
      ),
await userRepository.save(
  userRepository.create({
    nombreCompleto: "Camila Fernanda Soto Vargas",
    rut: "19.524.639-8",
    email: "c.soto2024@gmail.com",
    password: await encryptPassword("user1234"),
    rol: "usuario",
        }),
      ),
await userRepository.save(
  userRepository.create({
    nombreCompleto: "Matías Andrés Navarro Pérez",
    rut: "22.684.120-5",
    email: "m.navarro2024@gmail.com",
    password: await encryptPassword("user1234"),
    rol: "usuario",
        }),
      ),
    ]);
    console.log("* => Usuarios creados exitosamente");
  } catch (error) {
    console.error("Error al crear usuarios:", error);
  }
}

export { createUsers };
