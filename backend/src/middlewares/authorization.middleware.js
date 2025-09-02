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
  // Permitir solicitudes OPTIONS para el preflight de CORS
  if (req.method === 'OPTIONS') {
    return next();
  }
  
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

    // Agregar información del usuario a la request para uso posterior
    req.userId = userFound.id;
    req.userRole = rolUser;

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

    // Agregar información del usuario a la request para uso posterior
    req.userId = userFound.id;
    req.userRole = rolUser;

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

/**
 * esto permite el acceso solo a usuarios con rol "usuario"
 */
export async function isUsuario(req, res, next) {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const userFound = await userRepository.findOneBy({ email: req.user.email });

    if (!userFound) {
      return handleErrorClient(
        res,
        404,
        "Usuario no encontrado en la base de datos",
      );
    }

    const rolUser = userFound.rol;

    if (rolUser !== "usuario") {
      return handleErrorClient(
        res,
        403,
        "Error al acceder al recurso",
        "Se requiere un rol de usuario para realizar esta acción."
      );
    }

    next();
  } catch (error) {
    handleErrorServer(
      res,
      500,
      error.message,
    );
  }
}

/**
 * esto permite el acceso solo a usuarios con rol "estudiante" (mismo comportamiento que usuario)
 */
export async function isEstudiante(req, res, next) {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const userFound = await userRepository.findOneBy({ email: req.user.email });

    if (!userFound) {
      return handleErrorClient(
        res,
        404,
        "Usuario no encontrado en la base de datos",
      );
    }

    const rolUser = userFound.rol;

    if (rolUser !== "estudiante") {
      return handleErrorClient(
        res,
        403,
        "Error al acceder al recurso",
        "Se requiere un rol de estudiante para realizar esta acción."
      );
    }

    next();
  } catch (error) {
    handleErrorServer(
      res,
      500,
      error.message,
    );
  }
}

/**
 * esto permite el acceso a usuarios con rol "usuario" o "estudiante"
 */
export async function isUsuarioOrEstudiante(req, res, next) {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const userFound = await userRepository.findOneBy({ email: req.user.email });

    if (!userFound) {
      return handleErrorClient(
        res,
        404,
        "Usuario no encontrado en la base de datos",
      );
    }

    const rolUser = userFound.rol;

    if (rolUser !== "usuario" && rolUser !== "estudiante") {
      return handleErrorClient(
        res,
        403,
        "Error al acceder al recurso",
        "Se requiere un rol de usuario o estudiante para realizar esta acción."
      );
    }

    next();
  } catch (error) {
    handleErrorServer(
      res,
      500,
      error.message,
    );
  }
}

/**
 * esto permite el acceso solo a usuarios con rol "profesor"
 */
export async function isProfesor(req, res, next) {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const userFound = await userRepository.findOneBy({ email: req.user.email });

    if (!userFound) {
      return handleErrorClient(
        res,
        404,
        "Usuario no encontrado en la base de datos",
      );
    }

    const rolUser = userFound.rol;

    if (rolUser !== "profesor") {
      return handleErrorClient(
        res,
        403,
        "Error al acceder al recurso",
        "Se requiere un rol de profesor para realizar esta acción."
      );
    }

    next();
  } catch (error) {
    handleErrorServer(
      res,
      500,
      error.message,
    );
  }
}

/**
 * esto permite el acceso a usuarios con rol "administrador" o "consultor"
 */
export async function isAdminOrConsultor(req, res, next) {
  // Permitir solicitudes OPTIONS para el preflight de CORS
  if (req.method === 'OPTIONS') {
    return next();
  }
  
  try {
    const userRepository = AppDataSource.getRepository(User);
    const userFound = await userRepository.findOneBy({ email: req.user.email });

    if (!userFound) {
      return handleErrorClient(
        res,
        404,
        "Usuario no encontrado en la base de datos",
      );
    }

    const rolUser = userFound.rol;

    if (rolUser !== "administrador" && rolUser !== "consultor") {
      return handleErrorClient(
        res,
        403,
        "Error al acceder al recurso",
        "Se requiere un rol de administrador o consultor para realizar esta acción."
      );
    }

    // Agregar información del usuario a la request para uso posterior
    req.userId = userFound.id;
    req.userRole = rolUser;

    next();
  } catch (error) {
    handleErrorServer(
      res,
      500,
      error.message,
    );
  }
}
