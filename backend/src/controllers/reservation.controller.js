"use strict";
import { reservationValidation } from "../validations/reservation.validation.js";
import {
  createReservationService,
  getReservationsByPCService,
  updateReservationService,
  deleteReservationService,
} from "../services/reservation.service.js";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";

export async function createReservation(req, res) {
  try {
    const { error } = reservationValidation.validate(req.body);
    if (error) return handleErrorClient(res, 400, error.message);

    const [reserva, err] = await createReservationService(req.body);
    if (err) return handleErrorClient(res, 400, err);

    handleSuccess(res, 201, "Reserva creada correctamente", reserva);
  } catch (e) {
    handleErrorServer(res, 500, e.message);
  }
}

export async function getReservationsByPC(req, res) {
    try {
      const pcId = Number(req.query.pcId);
      const fechaReserva = req.query.fechaReserva;
  
      if (!req.query.pcId || isNaN(pcId)) {
        return handleErrorClient(res, 400, "Debe especificar un pcId válido");
      }
  
      const [list, err] = await getReservationsByPCService(pcId, fechaReserva);
      if (err) return handleErrorClient(res, 404, err);
  
      handleSuccess(res, 200, "Reservas encontradas", list);
    } catch (e) {
      handleErrorServer(res, 500, e.message);
    }
  }
  

export async function updateReservation(req, res) {
  try {
    const id = Number(req.params.id);
    const { error } = reservationValidation.validate(req.body);
    if (error) return handleErrorClient(res, 400, error.message);

    const [updated, err] = await updateReservationService(id, req.body);
    if (err) return handleErrorClient(res, 400, err);

    handleSuccess(res, 200, "Reserva actualizada", updated);
  } catch (e) {
    handleErrorServer(res, 500, e.message);
  }
}

export async function deleteReservation(req, res) {
  try {
    const id = Number(req.params.id);
    const [deleted, err] = await deleteReservationService(id);
    if (err) return handleErrorClient(res, 404, err);

    handleSuccess(res, 200, "Reserva eliminada", deleted);
  } catch (e) {
    handleErrorServer(res, 500, e.message);
  }
}
