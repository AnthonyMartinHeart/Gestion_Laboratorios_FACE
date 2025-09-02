"use strict";
import { 
  getHorariosService, 
  saveHorariosService 
} from "../services/horario.service.js";
import NotificacionesService from "../services/notificaciones.service.js";
import { 
  handleErrorClient, 
  handleErrorServer, 
  handleSuccess 
} from "../handlers/responseHandlers.js";
import { crearNotificacion } from "./notificaciones.controller.js";

export async function getHorarios(req, res) {
  try {
    // Prevenir caché
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });

    const [horarios, err] = await getHorariosService();
    
    if (err) {
      console.error('Error al obtener horarios:', err);
      return handleErrorClient(res, 404, err);
    }

    console.log('Horarios obtenidos del backend:', {
      lastModified: horarios.lastModified,
      modifiedBy: horarios.modifiedBy,
      hasLab1: !!horarios.lab1,
      hasLab2: !!horarios.lab2,
      hasLab3: !!horarios.lab3
    });

    handleSuccess(res, 200, "Horarios encontrados", horarios);
  } catch (e) {
    console.error('Error en getHorarios:', e);
    handleErrorServer(res, 500, e.message);
  }
}

export async function saveHorarios(req, res) {
  try {
    const { lab1, lab2, lab3, modifiedBy } = req.body;
    
    if (!lab1 || !lab2 || !lab3) {
      return handleErrorClient(res, 400, "Faltan datos de laboratorios");
    }

    const horariosData = { lab1, lab2, lab3 };
    const [saved, err] = await saveHorariosService(horariosData, modifiedBy);
    
    if (err) {
      console.error('Error al guardar horarios:', err);
      return handleErrorClient(res, 500, err);
    }

    console.log('Horarios guardados exitosamente:', {
      lastModified: saved.lastModified,
      modifiedBy: saved.modifiedBy
    });

    // Crear notificación para consultores sobre actualización de horarios
    try {
      await NotificacionesService.notificarHorarioActualizado(modifiedBy);
    } catch (notifError) {
      console.error("Error al crear notificación de horario actualizado:", notifError);
      // No devolvemos error porque los horarios se guardaron correctamente
    }

    handleSuccess(res, 200, "Horarios guardados exitosamente", saved);
  } catch (e) {
    console.error('Error en saveHorarios:', e);
    handleErrorServer(res, 500, e.message);
  }
}

export async function actualizarHorariosConClases(req, res) {
  try {
    const { nombreCompleto } = req.user;
    
    console.log('🔄 Forzando actualización de horarios con clases aprobadas...');
    
    // Obtener horarios actualizados con clases integradas
    const [horariosActualizados, err] = await getHorariosService();
    
    if (err) {
      console.error('Error al obtener horarios actualizados:', err);
      return handleErrorClient(res, 500, err);
    }
    
    // Guardar los horarios actualizados
    const [saved, saveErr] = await saveHorariosService(
      horariosActualizados, 
      `${nombreCompleto || 'Administrador'} (Actualización manual)`
    );
    
    if (saveErr) {
      console.error('Error al guardar horarios actualizados:', saveErr);
      return handleErrorClient(res, 500, saveErr);
    }
    
    console.log('✅ Horarios actualizados manualmente con clases aprobadas');
    
    handleSuccess(res, 200, "Horarios actualizados con clases aprobadas", saved);
  } catch (e) {
    console.error('Error en actualizarHorariosConClases:', e);
    handleErrorServer(res, 500, e.message);
  }
}

export async function cancelarClase(req, res) {
  try {
    const { laboratorio, claseIndex, motivo } = req.body;
    const { user } = req;
    
    if (!laboratorio || claseIndex === undefined || !motivo) {
      return handleErrorClient(res, 400, "Faltan datos para cancelar la clase");
    }

    // Obtener horarios actuales
    const [horarios, err] = await getHorariosService();
    if (err) {
      return handleErrorClient(res, 404, "No se pudieron obtener los horarios");
    }

    // Verificar que el laboratorio existe
    if (!horarios[laboratorio]) {
      return handleErrorClient(res, 404, "Laboratorio no encontrado");
    }

    // Verificar que la clase existe
    if (!horarios[laboratorio][claseIndex]) {
      return handleErrorClient(res, 404, "Clase no encontrada");
    }

    const clase = horarios[laboratorio][claseIndex];
    
    // Marcar la clase como cancelada
    horarios[laboratorio][claseIndex] = {
      ...clase,
      cancelada: true,
      motivoCancelacion: motivo,
      fechaCancelacion: new Date().toISOString(),
      canceladaPor: user.nombreCompleto || user.email
    };

    // Guardar horarios actualizados
    const [saved, saveErr] = await saveHorariosService(horarios, user.nombreCompleto || user.email);
    if (saveErr) {
      return handleErrorClient(res, 500, "Error al guardar la cancelación");
    }

    // Crear notificación
    try {
      await crearNotificacion(
        "cancelacion",
        "Clase Cancelada",
        `Se ha cancelado la clase de ${clase.materia} en ${laboratorio} del ${clase.fecha} de ${clase.horaInicio} a ${clase.horaFin}`,
        {
          laboratorio,
          profesor: user.nombreCompleto || user.email,
          materia: clase.materia,
          fecha: clase.fecha,
          hora: `${clase.horaInicio} - ${clase.horaFin}`,
          motivo
        }
      );
    } catch (notificationError) {
      console.error("Error al crear notificación:", notificationError);
      // No afectar la operación principal si falla la notificación
    }

    handleSuccess(res, 200, "Clase cancelada exitosamente", {
      laboratorio,
      claseIndex,
      claseCancelada: horarios[laboratorio][claseIndex]
    });
  } catch (e) {
    console.error('Error en cancelarClase:', e);
    handleErrorServer(res, 500, e.message);
  }
}
