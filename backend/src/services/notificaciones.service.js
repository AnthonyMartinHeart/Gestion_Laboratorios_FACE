import { crearNotificacion } from "../controllers/notificaciones.controller.js";

class NotificacionesService {
  // Notificaciones para profesores - cuando se aprueba/rechaza una solicitud
  async notificarSolicitudAprobada(profesorRut, profesorNombre, solicitud) {
    try {
      const titulo = "✅ Solicitud Aprobada";
      const mensaje = `Tu solicitud "${solicitud.titulo}" ha sido aprobada`;
      const detalles = {
        solicitudId: solicitud.id,
        laboratorio: solicitud.laboratorio,
        fecha: solicitud.fecha,
        horaInicio: solicitud.horaInicio,
        horaTermino: solicitud.horaTermino
      };

      await crearNotificacion(
        'solicitud_aprobada',
        titulo,
        mensaje,
        detalles,
        profesorRut
      );

      console.log(`📧 Notificación de aprobación enviada a ${profesorNombre}`);
    } catch (error) {
      console.error("Error al crear notificación de solicitud aprobada:", error);
    }
  }

  async notificarSolicitudRechazada(profesorRut, profesorNombre, solicitud, motivoRechazo) {
    try {
      const titulo = "❌ Solicitud Rechazada";
      const mensaje = `Tu solicitud "${solicitud.titulo}" ha sido rechazada`;
      const detalles = {
        solicitudId: solicitud.id,
        laboratorio: solicitud.laboratorio,
        fecha: solicitud.fecha,
        horaInicio: solicitud.horaInicio,
        horaTermino: solicitud.horaTermino,
        motivoRechazo: motivoRechazo
      };

      await crearNotificacion(
        'solicitud_rechazada',
        titulo,
        mensaje,
        detalles,
        profesorRut
      );

      console.log(`📧 Notificación de rechazo enviada a ${profesorNombre}`);
    } catch (error) {
      console.error("Error al crear notificación de solicitud rechazada:", error);
    }
  }

  // Notificaciones para consultores - cuando se actualizan horarios
  async notificarHorarioActualizado(administradorNombre) {
    try {
      const titulo = "📅 Horarios Actualizados";
      const mensaje = `Los horarios de laboratorio han sido actualizados por ${administradorNombre}`;
      const detalles = {
        actualizadoPor: administradorNombre,
        fechaActualizacion: new Date().toISOString()
      };

      // Esta notificación va para todos los consultores (sin targetRut específico)
      await crearNotificacion(
        'horario_actualizado',
        titulo,
        mensaje,
        detalles,
        null // null = para todos los consultores
      );

      console.log(`📧 Notificación de horarios enviada a todos los consultores`);
    } catch (error) {
      console.error("Error al crear notificación de horario actualizado:", error);
    }
  }

  // Notificaciones para consultores - cuando se les asigna un turno
  async notificarTurnoAsignado(consultorRut, consultorNombre, turnoData) {
    try {
      console.log(`🔔 Iniciando notificación de turno para ${consultorNombre} (${consultorRut})`);
      console.log(`📅 Fecha recibida:`, turnoData.fecha);
      
      // Formatear fecha de manera más segura para evitar problemas de zona horaria
      const formatearFecha = (fechaStr) => {
        // Si viene en formato YYYY-MM-DD, lo procesamos directamente
        if (typeof fechaStr === 'string' && fechaStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = fechaStr.split('-');
          return `${day}-${month}-${year}`;
        }
        // Si viene como Date object o string ISO, usamos toLocaleDateString
        return new Date(fechaStr).toLocaleDateString('es-CL');
      };
      
      const fechaFormateada = formatearFecha(turnoData.fecha);
      console.log(`📅 Fecha formateada:`, fechaFormateada);
      
      const titulo = "⏰ Turno Asignado";
      const mensaje = `Se te ha asignado un nuevo turno para el ${fechaFormateada}`;
      const detalles = {
        fecha: turnoData.fecha,
        horaEntrada: turnoData.horaEntradaAsignada,
        horaSalida: turnoData.horaSalidaAsignada,
        observacion: turnoData.observacion
      };

      console.log(`📝 Datos de la notificación:`, { titulo, mensaje, detalles, consultorRut });

      const notificacionCreada = await crearNotificacion(
        'turno_asignado',
        titulo,
        mensaje,
        detalles,
        consultorRut
      );

      console.log(`✅ Notificación de turno creada con ID: ${notificacionCreada?.id} para consultor ${consultorNombre} (${consultorRut})`);
      console.log(`📤 Notificación enviada exitosamente a ${consultorNombre}`);
    } catch (error) {
      console.error("❌ Error al crear notificación de turno asignado:", error);
    }
  }

  // Notificaciones para administradores - cuando hay nuevas solicitudes
  async notificarNuevaSolicitud(profesorNombre, solicitud) {
    try {
      const titulo = "📋 Nueva Solicitud de Clase";
      const mensaje = `${profesorNombre} ha creado una nueva solicitud: "${solicitud.titulo}"`;
      const detalles = {
        profesorRut: solicitud.profesorRut,
        profesorNombre: profesorNombre,
        solicitudId: solicitud.id,
        laboratorio: solicitud.laboratorio,
        fecha: solicitud.fecha,
        tipoSolicitud: solicitud.tipoSolicitud
      };

      // Esta notificación va para todos los administradores
      await crearNotificacion(
        'solicitud',
        titulo,
        mensaje,
        detalles,
        null // null = para todos los administradores
      );

      console.log(`📧 Notificación de nueva solicitud enviada a administradores`);
    } catch (error) {
      console.error("Error al crear notificación de nueva solicitud:", error);
    }
  }

  // Notificaciones de cancelaciones (para administradores)
  async notificarCancelacion(usuario, laboratorio, motivo) {
    try {
      const titulo = "❌ Reserva Cancelada";
      const mensaje = `Se ha cancelado una reserva en ${laboratorio}`;
      const detalles = {
        usuario: usuario,
        laboratorio: laboratorio,
        motivo: motivo,
        fechaCancelacion: new Date().toISOString()
      };

      await crearNotificacion(
        'cancelacion',
        titulo,
        mensaje,
        detalles,
        null // Para todos los administradores
      );

      console.log(`📧 Notificación de cancelación enviada a administradores`);
    } catch (error) {
      console.error("Error al crear notificación de cancelación:", error);
    }
  }

  // Notificaciones para observaciones - cuando se actualizan o crean observaciones
  async notificarObservacion(usuarioQueActualiza, fecha, esNuevaObservacion = false) {
    try {
      const titulo = esNuevaObservacion ? "📝 Nueva Observación" : "📝 Observación Actualizada";
      const mensaje = `${usuarioQueActualiza} ha ${esNuevaObservacion ? 'creado' : 'actualizado'} una observación con fecha ${fecha}`;
      const detalles = {
        actualizadoPor: usuarioQueActualiza,
        fecha: fecha,
        fechaActualizacion: new Date().toISOString(),
        tipoAccion: esNuevaObservacion ? 'crear' : 'actualizar'
      };

      // Esta notificación va para administradores y consultores
      await crearNotificacion(
        'observacion_actualizada',
        titulo,
        mensaje,
        detalles,
        null // null = para todos los usuarios autenticados
      );

      console.log(`📧 Notificación de observación enviada - ${usuarioQueActualiza} ${esNuevaObservacion ? 'creó' : 'actualizó'} observación del ${fecha}`);
    } catch (error) {
      console.error("Error al crear notificación de observación:", error);
    }
  }
}

export default new NotificacionesService();
