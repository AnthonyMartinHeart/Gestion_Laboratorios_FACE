import ClasesService from "../services/clases.service.js";
import { saveHorariosService } from "../services/horario.service.js";
import { handleSuccess, handleErrorClient, handleErrorServer } from "../handlers/responseHandlers.js";
import { crearNotificacion } from "./notificaciones.controller.js";

const obtenerMisClases = async (req, res) => {
  try {
    const { rut } = req.user;

    const [clases, error] = await ClasesService.obtenerClasesAprobadas(rut);
    
    if (error) {
      return handleErrorServer(res, 500, error);
    }

    return handleSuccess(res, 200, "Clases obtenidas exitosamente", clases);
  } catch (error) {
    console.error("Error en obtenerMisClases:", error);
    return handleErrorServer(res, 500, "Error interno del servidor");
  }
};

const cancelarClase = async (req, res) => {
  try {
    const { solicitudId, fechaEspecifica, motivoCancelacion } = req.body;
    const { rut, nombreCompleto } = req.user;

    // Validaciones básicas
    if (!solicitudId || !fechaEspecifica || !motivoCancelacion) {
      return handleErrorClient(res, 400, "Faltan datos requeridos");
    }

    // Validar que la fecha no sea pasada
    console.log('Fecha específica recibida:', fechaEspecifica);
    
    // Crear fecha actual en zona horaria local y establecerla al inicio del día
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Parsear la fecha específica asegurándonos de que esté en la zona horaria local
    let fechaCancelacion;
    if (fechaEspecifica.includes('T')) {
      // Si viene con timestamp, tomar solo la parte de la fecha
      const [fecha] = fechaEspecifica.split('T');
      fechaCancelacion = new Date(fecha + 'T00:00:00');
    } else {
      // Si es solo fecha YYYY-MM-DD
      fechaCancelacion = new Date(fechaEspecifica + 'T00:00:00');
    }
    
    console.log('Comparación de fechas:', {
      fechaRecibida: fechaEspecifica,
      fechaCancelacion: fechaCancelacion.toLocaleDateString(),
      hoy: hoy.toLocaleDateString(),
      sonIguales: fechaCancelacion.getTime() === hoy.getTime()
    });
    
    // Permitir cancelar clases del día actual y futuras
    if (fechaCancelacion.getTime() < hoy.getTime()) {
      return handleErrorClient(res, 400, "No se pueden cancelar clases de días anteriores");
    }

    const cancelacionData = {
      solicitudId,
      fechaEspecifica,
      profesorRut: rut,
      profesorNombre: nombreCompleto,
      motivoCancelacion
    };

    const [cancelacion, error] = await ClasesService.cancelarClase(cancelacionData);
    
    if (error) {
      return handleErrorClient(res, 400, error);
    }

    // Actualizar horarios automáticamente tras cancelación
    try {
      console.log('🔄 Clase cancelada, actualizando horarios automáticamente...');
      
      // Obtener horarios actuales y forzar regeneración
      const { getHorariosService } = await import("../services/horario.service.js");
      const [horariosActualizados, errorHorarios] = await getHorariosService();
      
      if (!errorHorarios) {
        // Guardar los horarios actualizados para que se reflejen inmediatamente
        await saveHorariosService(
          horariosActualizados, 
          `Sistema (Cancelación por ${nombreCompleto || 'Profesor'})`
        );
        console.log('✅ Horarios actualizados automáticamente tras cancelación');
      } else {
        console.warn('⚠️ Error al actualizar horarios tras cancelación:', errorHorarios);
      }
    } catch (horarioError) {
      console.error('❌ Error al actualizar horarios tras cancelación:', horarioError);
      // No afectar la operación principal si falla la actualización de horarios
    }

    // Crear notificación para administradores y consultores
    try {
      console.log("🔔 Intentando crear notificación de cancelación...");
      
      // Formatear el nombre del profesor correctamente
      const formatearNombre = (nombre) => {
        if (!nombre) return '';
        return nombre
          .toLowerCase()
          .split(' ')
          .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
          .join(' ');
      };
      
      const nombreFormateado = formatearNombre(nombreCompleto);
      
      await crearNotificacion(
        "cancelacion_clase_profesor",
        "Clase Cancelada por Profesor",
        `${nombreFormateado} canceló su clase del ${fechaEspecifica}`,
        {
          profesorRut: rut,
          profesorNombre: nombreCompleto,
          solicitudId,
          fecha: fechaEspecifica,
          motivo: motivoCancelacion,
          laboratorio: cancelacion.solicitud?.laboratorio,
          horaInicio: cancelacion.solicitud?.horaInicio,
          horaTermino: cancelacion.solicitud?.horaTermino
        }
      );
      console.log("✅ Notificación de cancelación creada exitosamente");
    } catch (notificationError) {
      console.error("❌ Error al crear notificación:", notificationError);
      // No afectar la operación principal si falla la notificación
    }

    return handleSuccess(res, 201, "Clase cancelada exitosamente", cancelacion);
  } catch (error) {
    console.error("Error en cancelarClase:", error);
    return handleErrorServer(res, 500, "Error interno del servidor");
  }
};

const obtenerNotificacionesCancelaciones = async (req, res) => {
  try {
    const [notificaciones, error] = await ClasesService.obtenerNotificacionesCancelaciones();
    
    if (error) {
      return handleErrorServer(res, 500, error);
    }

    return handleSuccess(res, 200, "Notificaciones obtenidas exitosamente", notificaciones);
  } catch (error) {
    console.error("Error en obtenerNotificacionesCancelaciones:", error);
    return handleErrorServer(res, 500, "Error interno del servidor");
  }
};

const marcarNotificacionVista = async (req, res) => {
  try {
    const { id } = req.params;

    const [notificacion, error] = await ClasesService.marcarNotificacionVista(id);
    
    if (error) {
      return handleErrorClient(res, 400, error);
    }

    return handleSuccess(res, 200, "Notificación marcada como vista", notificacion);
  } catch (error) {
    console.error("Error en marcarNotificacionVista:", error);
    return handleErrorServer(res, 500, "Error interno del servidor");
  }
};

const contarNotificacionesPendientes = async (req, res) => {
  try {
    const [count, error] = await ClasesService.contarNotificacionesPendientes();
    
    if (error) {
      return handleErrorServer(res, 500, error);
    }

    return handleSuccess(res, 200, "Contador obtenido exitosamente", { count });
  } catch (error) {
    console.error("Error en contarNotificacionesPendientes:", error);
    return handleErrorServer(res, 500, "Error interno del servidor");
  }
};

export {
  obtenerMisClases,
  cancelarClase,
  obtenerNotificacionesCancelaciones,
  marcarNotificacionVista,
  contarNotificacionesPendientes
};
