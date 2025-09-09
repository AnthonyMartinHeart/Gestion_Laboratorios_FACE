"use strict";
import { reservationValidation } from "../validations/reservation.validation.js";
import {
  createReservationService,
  getReservationsByPCService,
  updateReservationService,
  deleteReservationService,
  getAllReservationsService,
  finishReservationService,
  finishActiveReservationsService,
  clearAllReservationsService, 
} from "../services/reservation.service.js";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";
import { crearNotificacion } from "./notificaciones.controller.js";

export async function createReservation(req, res) {
  try {
    const { error } = reservationValidation.validate(req.body);
    if (error) return handleErrorClient(res, 400, error.message);

    const [reserva, err] = await createReservationService(req.body);
    if (err) return handleErrorClient(res, 400, err);

    // Detectar si es un mantenimiento
    const esMantenimiento = req.body.carrera === 'MAINTENANCE';
    
    if (esMantenimiento) {
      // Crear notificación para el usuario que marca el mantenimiento
      try {
        await crearNotificacion(
          "mantenimiento_marcado",
          "🔧 Equipo Marcado en Mantenimiento",
          `Has marcado el equipo PC-${req.body.pcId} en mantenimiento`,
          {
            pcId: req.body.pcId,
            usuario: req.body.usuario || "Sistema",
            laboratorio: req.body.laboratorio || "No especificado",
            motivo: "Mantenimiento de equipo",
            accion: "marcar"
          },
          req.user?.rut // Notificación para quien lo marca
        );

        // Crear notificación general para administradores (si no es admin quien lo marca)
        if (req.userRole !== 'administrador') {
          await crearNotificacion(
            "mantenimiento_reportado",
            "🔧 Equipo Reportado en Mantenimiento",
            `Se ha reportado el equipo PC-${req.body.pcId} en mantenimiento por ${req.body.usuario || req.user?.nombreCompleto || 'Usuario'}`,
            {
              pcId: req.body.pcId,
              usuario: req.body.usuario || req.user?.nombreCompleto || "Sistema",
              laboratorio: req.body.laboratorio || "No especificado",
              motivo: "Equipo reportado para mantenimiento",
              reportadoPor: req.user?.nombreCompleto || 'Usuario'
            }
            // Sin targetRut = notificación para administradores
          );
        }
      } catch (notificationError) {
        console.error("Error al crear notificación de mantenimiento:", notificationError);
      }
    }

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
  
  export async function getAllReservations(req, res) {
    try {
        // Prevenir caché
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
        });

        const [list, err] = await getAllReservationsService();
        
        // Log para depuración
        console.log('Reservas obtenidas:', {
            cantidad: list?.length || 0,
            muestra: list?.slice(0, 2) || [] // mostrar primeras 2 reservas como ejemplo
        });

        if (err) {
            console.error('Error al obtener reservas:', err);
            return handleErrorClient(res, 404, err);
        }

        if (!Array.isArray(list)) {
            console.error('Lista de reservas no es un array:', list);
            return handleErrorClient(res, 500, 'Formato de respuesta inválido');
        }

        // Transformar fechas y asegurar formato consistente
        const formattedList = list.map(reserva => ({
            ...reserva,
            fechaReserva: new Date(reserva.fechaReserva).toISOString().split('T')[0],
            horaInicio: reserva.horaInicio.slice(0, 5), // Asegurar formato HH:MM
            horaTermino: reserva.horaTermino.slice(0, 5) // Asegurar formato HH:MM
        }));

        handleSuccess(res, 200, "Reservas encontradas", formattedList);
    } catch (e) {
        console.error('Error en getAllReservations:', e);
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

    // Detectar si era un mantenimiento
    const eraMantenimiento = deleted.carrera === 'MAINTENANCE';
    
    // Crear notificación apropiada
    try {
      if (eraMantenimiento) {
        // Notificación para quien desmarca el mantenimiento
        await crearNotificacion(
          "mantenimiento_finalizado",
          "🔧 Mantenimiento Finalizado",
          `Has finalizado el mantenimiento del equipo PC-${deleted.pcId}`,
          {
            pcId: deleted.pcId,
            usuario: deleted.user?.nombre || "Sistema",
            laboratorio: deleted.laboratorio || "No especificado",
            motivo: "Mantenimiento completado",
            accion: "finalizar"
          },
          req.user?.rut // Notificación para quien lo desmarca
        );

        // Notificación general para administradores (si no es admin quien lo desmarca)
        if (req.userRole !== 'administrador') {
          await crearNotificacion(
            "mantenimiento_completado_general",
            "🔧 Mantenimiento Completado",
            `Se ha completado el mantenimiento del equipo PC-${deleted.pcId} por ${req.user?.nombreCompleto || 'Usuario'}`,
            {
              pcId: deleted.pcId,
              usuario: deleted.user?.nombre || "Sistema",
              laboratorio: deleted.laboratorio || "No especificado",
              completadoPor: req.user?.nombreCompleto || 'Usuario'
            }
            // Sin targetRut = notificación para administradores
          );
        }
      } else {
        await crearNotificacion(
          "cancelacion",
          "Reserva Cancelada",
          `Se ha cancelado una reserva para el ${deleted.fechaReserva} de ${deleted.horaInicio} a ${deleted.horaTermino}`,
          {
            reservaId: deleted.id,
            usuario: deleted.user?.nombre || "Usuario desconocido",
            laboratorio: deleted.laboratorio || "No especificado",
            motivo: "Cancelación manual"
          }
          // Notificación general para administradores
        );
      }
    } catch (notificationError) {
      console.error("Error al crear notificación:", notificationError);
      // No afectar la operación principal si falla la notificación
    }

    handleSuccess(res, 200, "Reserva eliminada", deleted);
  } catch (e) {
    handleErrorServer(res, 500, e.message);
  }
}

// Nuevo endpoint para finalizar (liberar) una reserva específica
export async function finishReservation(req, res) {
  try {
    const id = Number(req.params.id);
    const [finished, err] = await finishReservationService(id);
    if (err) return handleErrorClient(res, 404, err);

    handleSuccess(res, 200, "Reserva finalizada", finished);
  } catch (e) {
    handleErrorServer(res, 500, e.message);
  }
}

// Nuevo endpoint para liberar todos los equipos (finalizar reservas activas)
export async function finishActiveReservations(req, res) {
  try {
    const [finished, err] = await finishActiveReservationsService();
    if (err) return handleErrorClient(res, 404, err);

    handleSuccess(res, 200, "Equipos liberados", { 
      count: finished.length,
      reservations: finished 
    });
  } catch (e) {
    handleErrorServer(res, 500, e.message);
  }
}

// Nuevo endpoint para vaciar completamente la bitácora
export async function clearAllReservations(req, res) {
  try {
    const [count, err] = await clearAllReservationsService();
    if (err) return handleErrorClient(res, 404, err);

    handleSuccess(res, 200, "Bitácora vaciada", { 
      deletedCount: count 
    });
  } catch (e) {
    handleErrorServer(res, 500, e.message);
  }
}
