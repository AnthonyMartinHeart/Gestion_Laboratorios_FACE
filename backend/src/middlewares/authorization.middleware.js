import User from "../entity/user.entity.js";
import { AppDataSource } from "../config/configDb.js";


import { // aqui importe las funciones para manejar errores (cliente y servidor)
  handleErrorClient,
  handleErrorServer,
} from "../handlers/responseHandlers.js";

/**
 * esto permite el acceso solo a usuarios con rol "administrador"
 */
export async function isAdmin(req, res, next) {
  try {
    // Obtengo el repositorio de usuarios para hacer consultas a la BD
    const userRepository = AppDataSource.getRepository(User);

    // Busco al usuario actual por su email (debería estar en req.user.email gracias a algún middleware previo como auth)
    const userFound = await userRepository.findOneBy({ email: req.user.email });

    // Si no se encuentra el usuario, devolvemos error 404 que singifica el rango de error
    if (!userFound) {
      return handleErrorClient(
        res,
        404,
        "Usuario no encontrado en la base de datos",
      );
    }

    // Obtenemos el rol del usuario
    const rolUser = userFound.rol;

    // Verificamos si su rol NO es "administrador"
    if (rolUser !== "administrador") {
      return handleErrorClient(
        res,
        403,
        "Error al acceder al recurso",
        "Se requiere un rol de administrador para realizar esta acción."
      );
    }

    // Si todo está bien, dejamos que continúe con el siguiente middleware o controlador
    next();
  } catch (error) {
    // Si ocurre algún error inesperado en el servidor, lo manejamos aquí
    handleErrorServer(
      res,
      500,
      error.message,
    );
  }
}

/**
 * esto permite el acceso solo a usuarios con rol "consultor"
 */
export async function isConsultor(req, res, next) {
  try {
    // Igual que arriba, obtenemos el repositorio
    const userRepository = AppDataSource.getRepository(User);

    // Buscamos el usuario por su email
    const userFound = await userRepository.findOneBy({ email: req.user.email });

    // Si no lo encontramos, error 404
    if (!userFound) {
      return handleErrorClient(
        res,
        404,
        "Usuario no encontrado en la base de datos",
      );
    }

    // Obtenemos el rol del usuario
    const rolUser = userFound.rol;

    // Verificamos si su rol NO es "consultor"
    if (rolUser !== "consultor") {
      return handleErrorClient(
        res,
        403,
        "Error al acceder al recurso",
        "Se requiere un rol de consultor para realizar esta acción."
      );
    }

    // Si es consultor, continuamos
    next();
  } catch (error) {
    // Manejamos errores de servidor
    handleErrorServer(
      res,
      500,
      error.message,
    );
  }
}
