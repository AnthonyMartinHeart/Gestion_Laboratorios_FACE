"use strict";
import { Router } from "express";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import {
  createReservation,
  getReservationsByPC,
  getAllReservations,
  updateReservation,
  deleteReservation,
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

// Eliminar una reserva por ID
router.delete("/:id", deleteReservation);

export default router;
