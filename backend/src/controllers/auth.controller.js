"use strict";
import { loginService, registerService } from "../services/auth.service.js";
import { sendCredentialsEmail } from "../services/email.service.js";
import {
  authValidation,
  registerValidation,
} from "../validations/auth.validation.js";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";

export async function login(req, res) {
  try {
    const { body } = req;

    const { error } = authValidation.validate(body);

    
    if (error) {
      return handleErrorClient(res, 400, "Error de validación", error.message);
    }
    const [accessToken, errorToken] = await loginService(body);

  
    if (errorToken) return handleErrorClient(res, 400, "Error iniciando sesión", errorToken);

    res.cookie("jwt", accessToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    handleSuccess(res, 200, "Inicio de sesión exitoso", { token: accessToken });
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function register(req, res) {
  try {
    const { body } = req;

    const { error } = registerValidation.validate(body);

    if (error)
      return handleErrorClient(res, 400, "Error de validación", error.message);

    // Guardar la contraseña original antes de que sea encriptada
    const originalPassword = body.password;

    const [newUser, errorNewUser] = await registerService(body);

    if (errorNewUser) return handleErrorClient(res, 400, "Error registrando al usuario", errorNewUser);

    // Enviar correo con las credenciales
    try {
      const [emailSent, emailError] = await sendCredentialsEmail(
        newUser.email, 
        originalPassword, 
        newUser.nombreCompleto
      );

      if (!emailSent) {
        console.warn('No se pudo enviar el correo de credenciales:', emailError);
        // No fallar el registro si no se puede enviar el correo
        handleSuccess(res, 201, "Usuario registrado con éxito. Nota: No se pudo enviar el correo de credenciales.", newUser);
        return;
      }

      console.log('✅ Correo de credenciales enviado exitosamente a:', newUser.email);
      handleSuccess(res, 201, "Usuario registrado con éxito. Se han enviado las credenciales a tu correo.", newUser);

    } catch (emailError) {
      console.warn('Error al enviar correo de credenciales:', emailError);
      // El registro fue exitoso, solo falló el envío del correo
      handleSuccess(res, 201, "Usuario registrado con éxito. Nota: No se pudo enviar el correo de credenciales.", newUser);
    }

  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function logout(req, res) {
  try {
    res.clearCookie("jwt", { httpOnly: true });
    handleSuccess(res, 200, "Sesión cerrada exitosamente");
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}
