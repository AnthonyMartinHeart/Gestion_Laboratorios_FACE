import SolicitudService from "../services/solicitud.service.js";
import NotificacionesService from "../services/notificaciones.service.js";
import { saveHorariosService } from "../services/horario.service.js";
import { handleSuccess, handleErrorClient, handleErrorServer } from "../handlers/responseHandlers.js";

const crearSolicitud = async (req, res) => {
  try {
    const { 
      titulo, 
      descripcion, 
      laboratorio, 
      fecha, 
      fechaInicio, 
      fechaTermino,
      horaInicio, 
      horaTermino, 
      tipoSolicitud,
      diasSemana 
    } = req.body;
    const { rut, nombreCompleto, email } = req.user;

    // Validaciones básicas comunes
    if (!titulo || !laboratorio || !horaInicio || !horaTermino) {
      return handleErrorClient(res, "Todos los campos obligatorios deben ser completados", 400);
    }

    // Validaciones específicas según tipo de solicitud
    if (tipoSolicitud === 'recurrente') {
      // Validaciones para solicitud recurrente
      if (!fechaInicio || !fechaTermino || !diasSemana || diasSemana.length === 0) {
        return handleErrorClient(res, "Para solicitudes recurrentes se requiere fecha de inicio, término y días de la semana", 400);
      }

      const inicio = new Date(fechaInicio);
      const termino = new Date(fechaTermino);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      if (inicio < hoy) {
        return handleErrorClient(res, "La fecha de inicio no puede ser pasada", 400);
      }

      if (inicio >= termino) {
        return handleErrorClient(res, "La fecha de término debe ser posterior a la fecha de inicio", 400);
      }
    } else {
      // Validaciones para solicitud única
      if (!fecha) {
        return handleErrorClient(res, "La fecha es obligatoria para solicitudes únicas", 400);
      }

      const fechaSolicitud = new Date(fecha);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      if (fechaSolicitud < hoy) {
        return handleErrorClient(res, "No se pueden crear solicitudes para fechas pasadas", 400);
      }

      // Validar que no sea domingo
      if (fechaSolicitud.getDay() === 0) {
        return handleErrorClient(res, "No se pueden solicitar bloques para los domingos", 400);
      }
    }

    // Validar horarios
    const horasInicioValidas = ["08:10", "09:40", "11:10", "12:40", "14:10", "15:40", "17:10"];
    const horasTerminoValidas = ["09:30", "11:00", "12:30", "14:00", "15:30", "17:00", "18:30", "20:00"];
    
    if (!horasInicioValidas.includes(horaInicio)) {
      return handleErrorClient(res, "Hora de inicio no válida", 400);
    }
    
    if (!horasTerminoValidas.includes(horaTermino)) {
      return handleErrorClient(res, "Hora de término no válida", 400);
    }

    // Validar que la hora de término sea mayor que la de inicio
    const horaAMinutos = (hora) => {
      const [h, m] = hora.split(':').map(Number);
      return h * 60 + m;
    };
    
    if (horaAMinutos(horaInicio) >= horaAMinutos(horaTermino)) {
      return handleErrorClient(res, "La hora de término debe ser mayor que la hora de inicio", 400);
    }

    // Preparar datos de solicitud
    const solicitudData = {
      profesorRut: rut,
      profesorNombre: nombreCompleto,
      profesorEmail: email,
      titulo,
      descripcion: descripcion || '',
      laboratorio,
      horaInicio,
      horaTermino,
      tipoSolicitud: tipoSolicitud || 'unica'
    };

    // Agregar campos específicos según tipo de solicitud
    if (tipoSolicitud === 'recurrente') {
      solicitudData.fechaInicio = fechaInicio;
      solicitudData.fechaTermino = fechaTermino;
      solicitudData.diasSemana = diasSemana;
    } else {
      solicitudData.fecha = fecha;
      
      // Verificar conflictos para solicitud única
      const [conflictos, errorConflicto] = await SolicitudService.verificarConflictoHorario(
        laboratorio, 
        fecha,
        horaInicio, 
        horaTermino
      );
      
      if (errorConflicto) {
        return handleErrorServer(res, 500, errorConflicto);
      }
      
      if (conflictos.length > 0) {
        return handleErrorClient(res, "Ya existe una solicitud aprobada en ese horario y laboratorio", 409);
      }
    }

    const [resultado, error] = await SolicitudService.crearSolicitud(solicitudData);
    
    if (error) {
      return handleErrorClient(res, 400, error);
    }

    // Crear notificación para administradores sobre nueva solicitud
    try {
      await NotificacionesService.notificarNuevaSolicitud(
        nombreCompleto,
        resultado
      );
    } catch (notifError) {
      console.error("Error al crear notificación de nueva solicitud:", notifError);
      // No devolvemos error porque la solicitud se creó correctamente
    }

    // Mensaje de éxito
    const mensaje = tipoSolicitud === 'recurrente' 
      ? 'Solicitud recurrente creada exitosamente'
      : 'Solicitud creada exitosamente';

    return handleSuccess(res, 201, mensaje, resultado);
  } catch (error) {
    console.error("Error en crearSolicitud:", error);
    handleErrorServer(res, 500, "Error interno del servidor");
  }
};

const obtenerSolicitudes = async (req, res) => {
  try {
    const { rol, rut } = req.user;
    
    let filtros = {};
    
    // Si es profesor, solo ver sus propias solicitudes
    if (rol === "profesor") {
      filtros.profesorRut = rut;
    }
    // Si es administrador, puede ver todas las solicitudes (sin filtros adicionales)
    
    const [solicitudes, error] = await SolicitudService.obtenerSolicitudes(filtros);
    
    if (error) {
      return handleErrorServer(res, 500, error);
    }

    handleSuccess(res, 200, "Solicitudes obtenidas exitosamente", solicitudes);
  } catch (error) {
    console.error("Error en obtenerSolicitudes:", error);
    handleErrorServer(res, 500, "Error interno del servidor");
  }
};

const actualizarEstadoSolicitud = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, motivoRechazo } = req.body;
    const { rut, rol, nombreCompleto } = req.user;

    // Solo administradores pueden cambiar el estado
    if (rol !== "administrador") {
      return handleErrorClient(res, "No tienes permisos para realizar esta acción", 403);
    }

    if (!estado || !["aprobada", "rechazada"].includes(estado)) {
      return handleErrorClient(res, "Estado no válido", 400);
    }

    if (estado === "rechazada" && !motivoRechazo) {
      return handleErrorClient(res, "Debe proporcionar un motivo de rechazo", 400);
    }

    const [solicitud, error] = await SolicitudService.actualizarEstadoSolicitud(
      id, 
      estado, 
      rut, 
      motivoRechazo
    );
    
    if (error) {
      return handleErrorClient(res, error.includes("no encontrada") ? 404 : 400, error);
    }

    // Si la solicitud fue aprobada, forzar actualización de horarios
    if (estado === "aprobada") {
      try {
        console.log('🔄 Solicitud aprobada, actualizando horarios automáticamente...');
        
        // Obtener horarios actuales y forzar regeneración
        const { getHorariosService } = await import("../services/horario.service.js");
        const [horariosActualizados, errorHorarios] = await getHorariosService();
        
        if (!errorHorarios) {
          // Guardar los horarios actualizados para que se reflejen inmediatamente
          await saveHorariosService(
            horariosActualizados, 
            `Sistema (Aprobación por ${nombreCompleto || 'Admin'})`
          );
          console.log('✅ Horarios actualizados automáticamente tras aprobación');
        } else {
          console.warn('⚠️ Error al actualizar horarios tras aprobación:', errorHorarios);
        }
      } catch (horarioError) {
        console.error('❌ Error al actualizar horarios tras aprobación:', horarioError);
        // No afectar la operación principal si falla la actualización de horarios
      }
    }

    // Crear notificación para el profesor
    try {
      if (estado === "aprobada") {
        await NotificacionesService.notificarSolicitudAprobada(
          solicitud.profesorRut,
          solicitud.profesorNombre,
          solicitud
        );
      } else if (estado === "rechazada") {
        await NotificacionesService.notificarSolicitudRechazada(
          solicitud.profesorRut,
          solicitud.profesorNombre,
          solicitud,
          motivoRechazo
        );
      }
    } catch (notifError) {
      console.error("Error al crear notificación:", notifError);
      // No devolvemos error porque la solicitud se procesó correctamente
    }

    handleSuccess(res, 200, `Solicitud ${estado} exitosamente`, solicitud);
  } catch (error) {
    console.error("Error en actualizarEstadoSolicitud:", error);
    handleErrorServer(res, 500, "Error interno del servidor");
  }
};

const eliminarSolicitud = async (req, res) => {
  try {
    const { id } = req.params;
    const { rut, rol } = req.user;

    // Validar que el usuario tenga permisos para eliminar solicitudes
    if (rol !== "profesor" && rol !== "administrador") {
      return handleErrorClient(res, "No tienes permisos para realizar esta acción", 403);
    }

    const [resultado, error] = await SolicitudService.eliminarSolicitud(id, rut, rol);
    
    if (error) {
      const statusCode = error.includes("no encontrada") ? 404 : 
                        error.includes("No tienes permiso") || error.includes("No tienes permisos") ? 403 : 400;
      return handleErrorClient(res, error, statusCode);
    }

    handleSuccess(res, 200, "Solicitud eliminada exitosamente", resultado);
  } catch (error) {
    console.error("Error en eliminarSolicitud:", error);
    handleErrorServer(res, 500, "Error interno del servidor");
  }
};

export {
  crearSolicitud,
  obtenerSolicitudes,
  actualizarEstadoSolicitud,
  eliminarSolicitud
};
