"use strict";
import User from "../entity/user.entity.js";
import { AppDataSource } from "../config/configDb.js";
import { comparePassword, encryptPassword } from "../helpers/bcrypt.helper.js";

function normalizeRut(rut) {
  if (!rut) return "";
  // Limpiar el RUT: quitar puntos, espacios y normalizar K
  return rut.toString()
    .replace(/\./g, "")
    .replace(/\s/g, "")
    .replace(/-k$/i, "-K")
    .toUpperCase()
    .trim();
}

export async function getUserService(query) {
  try {
    const { rut, id, email } = query;
    const userRepository = AppDataSource.getRepository(User);
    let userFound = null;
    if (rut) {
      const users = await userRepository.find();
      userFound = users.find((u) => normalizeRut(u.rut) === normalizeRut(rut));
    } else if (id) {
      userFound = await userRepository.findOne({ where: { id } });
    } else if (email) {
      userFound = await userRepository.findOne({ where: { email } });
    }
    if (!userFound) return [null, "Usuario no encontrado"];
    const { password, ...userData } = userFound;
    return [userData, null];
  } catch (error) {
    console.error("Error obtener el usuario:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function getUsersService() {
  try {
    const userRepository = AppDataSource.getRepository(User);

    const users = await userRepository.find();

    if (!users || users.length === 0) return [null, "No hay usuarios"];

    const usersData = users.map(({ password, ...user }) => user);

    return [usersData, null];
  } catch (error) {
    console.error("Error al obtener a los usuarios:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function updateUserService(query, body) {
  try {
    const { id, rut, email } = query;
    const userRepository = AppDataSource.getRepository(User);
    let userFound = null;
    if (rut) {
      const users = await userRepository.find();
      userFound = users.find((u) => normalizeRut(u.rut) === normalizeRut(rut));
    } else if (id) {
      userFound = await userRepository.findOne({ where: { id } });
    } else if (email) {
      userFound = await userRepository.findOne({ where: { email } });
    }
    if (!userFound) return [null, "Usuario no encontrado"];
    const existingUser = await userRepository.findOne({
      where: [{ rut: body.rut }, { email: body.email }],
    });
    if (existingUser && existingUser.id !== userFound.id) {
      return [null, "Ya existe un usuario con el mismo rut o email"];
    }
    if (body.password) {
      const matchPassword = await comparePassword(
        body.password,
        userFound.password,
      );
      if (!matchPassword) return [null, "La contraseña no coincide"];
    }
    const dataUserUpdate = {
      nombreCompleto: body.nombreCompleto,
      rut: body.rut,
      email: body.email,
      rol: body.rol,
      carrera: body.carrera,
      anioIngreso: body.anioIngreso,
      anioEgreso: body.anioEgreso,
      updatedAt: new Date(),
    };
    if (body.newPassword && body.newPassword.trim() !== "") {
      dataUserUpdate.password = await encryptPassword(body.newPassword);
    }
    // Prioridad: Si el campo activo viene explícito, respétalo
    if (typeof body.activo === 'boolean') {
      dataUserUpdate.activo = body.activo;
    } else if ((userFound.rol === "usuario" || userFound.rol === "estudiante") && body.anioEgreso && body.anioEgreso.trim() !== "") {
      dataUserUpdate.activo = false;
    } else {
      dataUserUpdate.activo = true;
    }
    await userRepository.update({ id: userFound.id }, dataUserUpdate);
    const userData = await userRepository.findOne({ where: { id: userFound.id } });
    if (!userData) {
      return [null, "Usuario no encontrado después de actualizar"];
    }
    const { password, ...userUpdated } = userData;
    return [userUpdated, null];
  } catch (error) {
    console.error("Error al modificar un usuario:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function deleteUserService(query) {
  try {
    const { id, rut, email } = query;
    const userRepository = AppDataSource.getRepository(User);
    let userFound = null;
    
    console.log(`🔍 Buscando usuario para eliminar - RUT: ${rut}, ID: ${id}, Email: ${email}`);
    
    if (rut) {
      const users = await userRepository.find();
      console.log(`📊 Total usuarios en BD: ${users.length}`);
      console.log(`🔎 Buscando RUT normalizado: ${normalizeRut(rut)}`);
      
      userFound = users.find((u) => {
        const rutNormalizado = normalizeRut(u.rut);
        console.log(`🔸 Comparando: ${rutNormalizado} === ${normalizeRut(rut)}`);
        return rutNormalizado === normalizeRut(rut);
      });
    } else if (id) {
      userFound = await userRepository.findOne({ where: { id } });
    } else if (email) {
      userFound = await userRepository.findOne({ where: { email } });
    }
    
    if (!userFound) {
      console.log(`❌ Usuario NO encontrado - RUT: ${rut}`);
      return [null, "Usuario no encontrado"];
    }
    
    console.log(`✅ Usuario encontrado: ${userFound.nombreCompleto} (${userFound.rut})`);
    
    if (userFound.rol === "administrador") {
      return [null, "No se puede eliminar un usuario con rol de administrador"];
    }
    
    // 🛠️ VERIFICAR Y MANEJAR RELACIONES ANTES DE ELIMINAR
    try {
      // Verificar si tiene tareas asignadas (como asignador o asignado)
      const taskCountAsignadoPor = await AppDataSource.query(
        'SELECT COUNT(*) as count FROM tareas WHERE "asignado_por_id" = $1',
        [userFound.id]
      );
      
      const taskCountAsignadoA = await AppDataSource.query(
        'SELECT COUNT(*) as count FROM tareas WHERE "asignado_a_id" = $1',
        [userFound.id]
      );
      
      const totalTasks = parseInt(taskCountAsignadoPor[0].count) + parseInt(taskCountAsignadoA[0].count);
      console.log(`📋 Tareas relacionadas al usuario: ${totalTasks}`);
      
      if (totalTasks > 0) {
        // Eliminar tareas donde el usuario es el asignador
        if (parseInt(taskCountAsignadoPor[0].count) > 0) {
          await AppDataSource.query(
            'DELETE FROM tareas WHERE "asignado_por_id" = $1',
            [userFound.id]
          );
          console.log(`🗑️ Tareas eliminadas (como asignador): ${taskCountAsignadoPor[0].count}`);
        }
        
        // Eliminar tareas donde el usuario es el asignado
        if (parseInt(taskCountAsignadoA[0].count) > 0) {
          await AppDataSource.query(
            'DELETE FROM tareas WHERE "asignado_a_id" = $1',
            [userFound.id]
          );
          console.log(`�️ Tareas eliminadas (como asignado): ${taskCountAsignadoA[0].count}`);
        }
      }
      
      // Verificar reservaciones por RUT (no por ID)
      const reservationCount = await AppDataSource.query(
        'SELECT COUNT(*) as count FROM reservations WHERE "rut" = $1',
        [userFound.rut]
      );
      
      if (parseInt(reservationCount[0].count) > 0) {
        await AppDataSource.query(
          'DELETE FROM reservations WHERE "rut" = $1',
          [userFound.rut]
        );
        console.log(`🗑️ Reservaciones eliminadas: ${reservationCount[0].count}`);
      }
      
      // Ahora sí eliminar el usuario
      const userDeleted = await userRepository.remove(userFound);
      console.log(`✅ Usuario eliminado exitosamente: ${userFound.nombreCompleto}`);
      
      const { password, ...dataUser } = userDeleted;
      return [dataUser, null];
      
    } catch (relationError) {
      console.error("Error manejando relaciones:", relationError);
      return [null, `No se puede eliminar el usuario porque tiene datos asociados: ${relationError.message}`];
    }
    
  } catch (error) {
    console.error("Error al eliminar un usuario:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function setUserActiveService(rut, activo) {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const users = await userRepository.find();
    const userFound = users.find((u) => normalizeRut(u.rut) === normalizeRut(rut));
    if (!userFound) return [null, "Usuario no encontrado"];
    userFound.activo = activo;
    await userRepository.save(userFound);
    const { password, ...userData } = userFound;
    return [userData, null];
  } catch (error) {
    console.error("Error al cambiar estado activo:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function getConsultoresService() {
  try {
    const userRepository = AppDataSource.getRepository(User);

    const consultores = await userRepository.find({
      where: { rol: "consultor", activo: true },
      select: ["id", "nombreCompleto", "rut", "email"]
    });

    return [consultores, null];
  } catch (error) {
    console.error("Error al obtener consultores:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function updateFotoPerfilService(email, fotoPerfil) {
  try {
    const userRepository = AppDataSource.getRepository(User);
    
    const userFound = await userRepository.findOne({ where: { email } });
    
    if (!userFound) {
      return [null, "Usuario no encontrado"];
    }

    userFound.fotoPerfil = fotoPerfil;
    await userRepository.save(userFound);

    const { password, ...userData } = userFound;
    return [userData, null];
  } catch (error) {
    console.error("Error al actualizar foto de perfil:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function getFotoPerfilService(email) {
  try {
    const userRepository = AppDataSource.getRepository(User);
    
    const userFound = await userRepository.findOne({ 
      where: { email },
      select: ["fotoPerfil"]
    });
    
    if (!userFound) {
      return [null, "Usuario no encontrado"];
    }

    return [userFound.fotoPerfil, null];
  } catch (error) {
    console.error("Error al obtener foto de perfil:", error);
    return [null, "Error interno del servidor"];
  }
}
