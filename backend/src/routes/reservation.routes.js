"use strict";
import { Router } from "express";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import {
  createReservation,
  getReservationsByPC,
  updateReservation,
  deleteReservation,
} from "../controllers/reservation.controller.js";

const router = Router();
router.use(authenticateJwt);

router
  .post("/create", authenticateJwt, createReservation)
  .get("/get", authenticateJwt, getReservationsByPC)
  .put("/:id", updateReservation) //actualiza id de creacion no id de pc

  .delete("/:id", deleteReservation); //elimina id de creacion no id de pc

export default router;
