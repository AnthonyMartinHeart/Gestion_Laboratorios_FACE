"use strict";
import {
  deleteUserService,
  getUserService,
  getUsersService,
  updateUserService,
  setUserActiveService,
  getConsultoresService,
  updateFotoPerfilService,
  getFotoPerfilService,
} from "../services/user.service.js";
import {
  userBodyValidation,
  userQueryValidation,
} from "../validations/user.validation.js";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";

export async function getUser(req, res) {
  try {
    const { rut, id, email } = req.query;

    const { error } = userQueryValidation.validate({ rut, id, email });

    if (error) return handleErrorClient(res, 400, error.message);

    const [user, errorUser] = await getUserService({ rut, id, email });

    if (errorUser) return handleErrorClient(res, 404, errorUser);

    handleSuccess(res, 200, "Usuario encontrado", user);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getUsers(req, res) {
  try {
    const [users, errorUsers] = await getUsersService();

    if (errorUsers) return handleErrorClient(res, 404, errorUsers);

    users.length === 0
      ? handleSuccess(res, 204)
      : handleSuccess(res, 200, "Usuarios encontrados", users);
  } catch (error) {
    handleErrorServer(
      res,
      500,
      error.message,
    );
  }
}

export async function updateUser(req, res) {
  try {
    const { rut, id, email } = req.query;
    const { body } = req;

    const { error: queryError } = userQueryValidation.validate({
      rut,
      id,
      email,
    });

    if (queryError) {
      return handleErrorClient(
        res,
        400,
        "Error de validación en la consulta",
        queryError.message,
      );
    }

    const { error: bodyError } = userBodyValidation.validate(body);

    if (bodyError)
      return handleErrorClient(
        res,
        400,
        "Error de validación en los datos enviados",
        bodyError.message,
      );

    const [user, userError] = await updateUserService({ rut, id, email }, body);

    if (userError) return handleErrorClient(res, 400, "Error modificando al usuario", userError);

    handleSuccess(res, 200, "Usuario modificado correctamente", user);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function deleteUser(req, res) {
  try {
    const { rut, id, email } = req.query;

    const { error: queryError } = userQueryValidation.validate({
      rut,
      id,
      email,
    });

    if (queryError) {
      return handleErrorClient(
        res,
        400,
        "Error de validación en la consulta",
        queryError.message,
      );
    }

    const [userDelete, errorUserDelete] = await deleteUserService({
      rut,
      id,
      email,
    });

    if (errorUserDelete) {
      // Mejorar el mensaje de error específico
      if (errorUserDelete === "Usuario no encontrado") {
        return handleErrorClient(res, 404, "Usuario no encontrado", `El usuario con RUT ${rut} no existe o ya fue eliminado`);
      }
      return handleErrorClient(res, 400, "Error eliminando al usuario", errorUserDelete);
    }

    handleSuccess(res, 200, "Usuario eliminado correctamente", userDelete);
  } catch (error) {
    console.error("Error en deleteUser controller:", error);
    handleErrorServer(res, 500, error.message);
  }
}

export async function setUserActive(req, res) {
  try {
    const { rut } = req.query;
    const { activo } = req.body;
    if (typeof activo !== 'boolean') {
      return handleErrorClient(res, 400, 'El campo "activo" debe ser booleano.');
    }
    const [user, error] = await setUserActiveService(rut, activo);
    if (error) return handleErrorClient(res, 400, error);
    handleSuccess(res, 200, `Usuario ${activo ? 'activado' : 'desactivado'} correctamente`, user);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getConsultores(req, res) {
  try {
    const [consultores, error] = await getConsultoresService();

    if (error) return handleErrorClient(res, 400, error);

    handleSuccess(res, 200, "Consultores obtenidos exitosamente", consultores);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function updateFotoPerfil(req, res) {
  try {
    const { email } = req.query;
    const { fotoPerfil } = req.body;

    if (!email) {
      return handleErrorClient(res, 400, "Email es requerido");
    }

    // Permitir null o string vacío para eliminar la foto
    if (fotoPerfil !== null && fotoPerfil !== undefined && fotoPerfil !== "" && !fotoPerfil.startsWith('data:image/')) {
      return handleErrorClient(res, 400, "Formato de imagen inválido");
    }

    const [user, error] = await updateFotoPerfilService(email, fotoPerfil);

    if (error) return handleErrorClient(res, 400, error);

    const mensaje = fotoPerfil ? "Foto de perfil actualizada correctamente" : "Foto de perfil eliminada correctamente";
    handleSuccess(res, 200, mensaje, user);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getFotoPerfil(req, res) {
  try {
    const { email } = req.query;

    if (!email) {
      return handleErrorClient(res, 400, "Email es requerido");
    }

    const [fotoPerfil, error] = await getFotoPerfilService(email);

    if (error) return handleErrorClient(res, 404, error);

    handleSuccess(res, 200, "Foto de perfil obtenida", { fotoPerfil });
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}
