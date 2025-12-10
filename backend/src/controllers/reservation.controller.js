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
import { FEATURE_BITACORA_SESIONES } from "../config/configEnv.js";
import { getBitacoraData } from "../services/bitacoraAssembler.service.js";


export async function createReservation(req, res) {
  try {
    const { error } = reservationValidation.validate(req.body);
    if (error) return handleErrorClient(res, 400, error.message);

    const [reserva, err] = await createReservationService(req.body);
    if (err) return handleErrorClient(res, 400, err);

    // Detectar si es un mantenimiento
    const esMantenimiento = req.body.carrera === 'MAINTENANCE';
    
    // Detectar si es un bloque de clases (ADMIN)
    const esBloqueCLASES = req.body.carrera === 'ADMIN';
    
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
    } else if (!esBloqueCLASES) {
      // Si es una reserva individual (NO es mantenimiento NI bloque de clases)
      // Crear notificación personalizada para el usuario que hizo la reserva
      try {
        console.log('📋 Datos de la reserva creada:', {
          reserva,
          userFromReq: req.user,
          rutFromBody: req.body.rut,
          rutFromUser: req.user?.rut,
          fechaReservaOriginal: reserva.fechaReserva,
          tipoFecha: typeof reserva.fechaReserva
        });

        // Formatear fecha en formato dd-mm-yyyy de forma robusta y automática
        const fechaReserva = reserva.fechaReserva;
        let fechaFormateada = '';
        
        if (fechaReserva) {
          // Si la fecha viene como string en formato ISO (YYYY-MM-DD o con timestamp)
          if (typeof fechaReserva === 'string') {
            // Extraer solo la parte de la fecha (antes de 'T' si existe)
            const fechaSoloStr = fechaReserva.split('T')[0];
            
            // Si coincide con formato YYYY-MM-DD, parsear directamente
            const match = fechaSoloStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (match) {
              const [, year, month, day] = match;
              fechaFormateada = `${day}-${month}-${year}`;
            } else {
              // Si no coincide, intentar crear fecha local y formatear
              const fecha = new Date(fechaReserva);
              // Ajustar a zona horaria local del servidor
              const dia = String(fecha.getDate()).padStart(2, '0');
              const mes = String(fecha.getMonth() + 1).padStart(2, '0');
              const anio = fecha.getFullYear();
              fechaFormateada = `${dia}-${mes}-${anio}`;
            }
          } else if (fechaReserva instanceof Date) {
            // Si ya es un objeto Date, formatear directamente
            const dia = String(fechaReserva.getDate()).padStart(2, '0');
            const mes = String(fechaReserva.getMonth() + 1).padStart(2, '0');
            const anio = fechaReserva.getFullYear();
            fechaFormateada = `${dia}-${mes}-${anio}`;
          } else {
            // Último intento: convertir a string y procesar
            const fechaStr = String(fechaReserva).split('T')[0];
            const [year, month, day] = fechaStr.split('-');
            fechaFormateada = `${day}-${month}-${year}`;
          }
        } else {
          // Si no hay fecha en la reserva, usar fecha local actual del servidor
          const hoy = new Date();
          const dia = String(hoy.getDate()).padStart(2, '0');
          const mes = String(hoy.getMonth() + 1).padStart(2, '0');
          const anio = hoy.getFullYear();
          fechaFormateada = `${dia}-${mes}-${anio}`;
        }

        console.log(`📅 Fecha formateada: ${fechaFormateada} (original: ${fechaReserva})`);

        // Obtener el laboratorio desde el pcId
        let laboratorio = 'No especificado';
        if (reserva.pcId >= 1 && reserva.pcId <= 40) {
          laboratorio = 'LAB1';
        } else if (reserva.pcId >= 41 && reserva.pcId <= 60) {
          laboratorio = 'LAB2';
        } else if (reserva.pcId >= 61 && reserva.pcId <= 80) {
          laboratorio = 'LAB3';
        }

        // Determinar el RUT del destinatario (usar el RUT de la reserva que es el más confiable)
        const targetRut = reserva.rut || req.body.rut || req.user?.rut;
        
        console.log(`🔔 Intentando crear notificación para RUT: ${targetRut}`);

        await crearNotificacion(
          "reserva_equipo",
          "💻 Reserva de Equipo Confirmada",
          `Has reservado exitosamente el equipo PC-${reserva.pcId} en ${laboratorio} para el día ${fechaFormateada} de ${reserva.horaInicio} a ${reserva.horaTermino}`,
          {
            pcId: reserva.pcId,
            laboratorio: laboratorio,
            fecha: fechaFormateada,
            fechaReserva: fechaFormateada,
            horaInicio: reserva.horaInicio,
            horaTermino: reserva.horaTermino,
            carrera: reserva.carrera || 'No especificada',
            usuario: req.user?.nombreCompleto || req.user?.nombre || 'Usuario'
          },
          targetRut // Notificación para quien hizo la reserva
        );

        console.log(`✅ Notificación de reserva enviada a RUT: ${targetRut}`);
      } catch (notificationError) {
        console.error("❌ Error al crear notificación de reserva:", notificationError);
        // No afectar la operación principal si falla la notificación
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
    // Prevenir cache
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "Surrogate-Control": "no-store",
    });

    const [list, err] = await getAllReservationsService();

    // Log 
    console.log("Reservas obtenidas:", {
      cantidad: list?.length || 0,
      muestra: list?.slice(0, 2) || [],
    });

    if (err) {
      console.error("Error al obtener reservas:", err);
      return handleErrorClient(res, 404, err);
    }

    if (!Array.isArray(list)) {
      console.error("Lista de reservas no es un array:", list);
      return handleErrorClient(res, 500, "Formato de respuesta inválido");
    }

    const formattedList = list.map((reserva) => ({
      ...reserva,
      fechaReserva: new Date(reserva.fechaReserva).toISOString().split("T")[0],
      horaInicio: reserva.horaInicio.slice(0, 5), // HH:MM
      horaTermino: reserva.horaTermino.slice(0, 5), // HH:MM
      tipoActividad: reserva.tipoActividad || null,
    }));

   
    if (!FEATURE_BITACORA_SESIONES) {
      console.log("⚠️ FEATURE_BITACORA_SESIONES está desactivada");
      return handleSuccess(res, 200, "Reservas encontradas", formattedList);
    }

    console.log("✅ FEATURE_BITACORA_SESIONES activada, usando bitacoraAssembler");
    
    const today = new Date().toISOString().split("T")[0];
    const { from, to, labId } = req.query;

    console.log("📅 Parámetros de búsqueda:", {
      from: from ?? today,
      to: to ?? today,
      labId: labId ? Number(labId) : null,
    });

    const bitacoraList = await getBitacoraData({
      from: from ?? today,
      to: to ?? today,
      labId: labId ? Number(labId) : null,
    });

    console.log(`📋 Bitácora combinada: ${bitacoraList.length} registros`);

    return handleSuccess(res, 200, "Bitácora (reservas + sesiones)", bitacoraList);
  } catch (e) {
    console.error("Error en getAllReservations:", e);
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
        // Solo crear notificación si NO es un administrador quien elimina
        // (evitar notificaciones redundantes a administradores)
        if (req.user?.rol !== 'administrador') {
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


export async function clearAllReservations(req, res) { //nuevo
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

