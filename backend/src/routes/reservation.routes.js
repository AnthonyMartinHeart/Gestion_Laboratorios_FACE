"use strict";
import { Router } from "express";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import {
  createReservation,
  getReservationsByPC,
  getAllReservations,
  updateReservation,
  deleteReservation,
  finishReservation,
  finishActiveReservations,
  clearAllReservations,
} from "../controllers/reservation.controller.js";

const router = Router();

// Proteger todas las rutas con JWT
router.use(authenticateJwt);

// Crear una nueva reserva
router.post("/create", createReservation);

// Obtener reservas por PC y fecha
router.get("/get", getReservationsByPC);

// Obtener todas las reservas 
router.get("/all", authenticateJwt, getAllReservations); 


// Actualizar una reserva por ID
router.put("/:id", updateReservation);

// Eliminar una reserva por ID (hard delete)
router.delete("/:id", deleteReservation);

// Finalizar una reserva específica (soft delete)
router.patch("/:id/finish", finishReservation);

// Liberar todos los equipos (finalizar todas las reservas activas del día)
router.patch("/finish-all", finishActiveReservations);

// Vaciar completamente la bitácora (eliminar TODAS las reservas)
router.delete("/clear-all", clearAllReservations);

export default router;
