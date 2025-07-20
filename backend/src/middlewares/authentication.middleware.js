"use strict";
import passport from "passport";
import {
  handleErrorClient,
  handleErrorServer,
  } from "../handlers/responseHandlers.js";

export function authenticateJwt(req, res, next) {
  // Permitir solicitudes OPTIONS para el preflight de CORS
  if (req.method === 'OPTIONS') {
    return next();
  }
  
  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (err) {
      return handleErrorServer(
        res,
        500,
        "Error de autenticación en el servidor"
      );
    }

    if (!user) {
      return handleErrorClient(
        res,
        401,
        "No tienes permiso para acceder a este recurso",
        { info: info ? info.message : "No se encontró el usuario" }
      )
    }

    req.user = user;
    next();
  })(req, res, next);
}
