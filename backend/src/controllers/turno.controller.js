"use strict";
import {
  getTurnosByFechaService,
  getTurnoByRutAndFechaService,
  saveOrUpdateTurnoService,
  deleteTurnoService
} from "../services/turno.service.js";
import NotificacionesService from "../services/notificaciones.service.js";
import { handleErrorServer } from "../handlers/responseHandlers.js";

export async function getTurnosByFecha(req, res) {
  try {
    const { fecha } = req.params;
    
    if (!fecha) {
      return res.status(400).json({
        message: "La fecha es requerida",
        data: null
      });
    }

    const turnos = await getTurnosByFechaService(fecha);
    
    res.status(200).json({
      message: "Turnos obtenidos exitosamente",
      data: turnos
    });
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getTurnoByRutAndFecha(req, res) {
  try {
    const { rut, fecha } = req.params;
    
    if (!rut || !fecha) {
      return res.status(400).json({
        message: "El RUT y la fecha son requeridos",
        data: null
      });
    }

    const turno = await getTurnoByRutAndFechaService(rut, fecha);
    
    res.status(200).json({
      message: "Turno obtenido exitosamente",
      data: turno
    });
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function saveOrUpdateTurno(req, res) {
  try {
    const turnoData = req.body;
    
    console.log('📥 Datos recibidos en controller:', turnoData);
    
    // Validaciones más robustas
    if (!turnoData.rut || !turnoData.fecha) {
      return res.status(400).json({
        message: "El RUT y la fecha son requeridos",
        data: null
      });
    }

    // Obtener el turno existente ANTES de la actualización para comparar
    const turnoExistente = await getTurnoByRutAndFechaService(turnoData.rut, turnoData.fecha);
    console.log('🔍 Turno existente antes de actualizar:', turnoExistente);

    // Asegurar que las horas vacías sean strings vacíos, no undefined/null
    const datosLimpios = {
      rut: turnoData.rut,
      nombre: turnoData.nombre || "",
      fecha: turnoData.fecha,
      horaEntradaAsignada: turnoData.horaEntradaAsignada || "",
      horaSalidaAsignada: turnoData.horaSalidaAsignada || "",
      horaEntradaMarcada: turnoData.horaEntradaMarcada || "",
      horaSalidaMarcada: turnoData.horaSalidaMarcada || "",
      observacion: turnoData.observacion || ""
    };

    console.log('🧹 Datos limpiados:', datosLimpios);

    const turno = await saveOrUpdateTurnoService(datosLimpios);
    
    console.log('✅ Turno guardado exitosamente:', turno);

    // Crear notificación SOLO si es una asignación nueva de horarios (no cuando se marca entrada/salida)
    try {
      const hayHorasAsignadas = datosLimpios.horaEntradaAsignada || datosLimpios.horaSalidaAsignada;
      
      // Verificar si es una asignación nueva comparando con el turno existente
      const esAsignacionNueva = hayHorasAsignadas && (
        !turnoExistente || 
        (turnoExistente.horaEntradaAsignada !== datosLimpios.horaEntradaAsignada) ||
        (turnoExistente.horaSalidaAsignada !== datosLimpios.horaSalidaAsignada)
      );
      
      // NUEVO: También considerar como asignación nueva si antes no tenía horarios
      const antesNoTeniaHorarios = !turnoExistente || (!turnoExistente.horaEntradaAsignada && !turnoExistente.horaSalidaAsignada);
      const ahoraHayHorarios = datosLimpios.horaEntradaAsignada || datosLimpios.horaSalidaAsignada;
      const primeraAsignacion = antesNoTeniaHorarios && ahoraHayHorarios;
      
      // ARREGLO: Verificar si SOLO se marcó entrada/salida (sin cambios en horarios asignados)
      const soloSeMarcoEntradaOSalida = (datosLimpios.horaEntradaMarcada || datosLimpios.horaSalidaMarcada) && 
                                        !esAsignacionNueva && !primeraAsignacion;
      
      console.log('🔍 Análisis DETALLADO de notificación:', {
        hayHorasAsignadas,
        soloSeMarcoEntradaOSalida,
        esAsignacionNueva,
        primeraAsignacion,
        antesNoTeniaHorarios,
        ahoraHayHorarios,
        turnoExistente: turnoExistente ? 'Existe' : 'No existe',
        horaEntradaAnterior: turnoExistente?.horaEntradaAsignada || 'VACÍO',
        horaEntradaNueva: datosLimpios.horaEntradaAsignada || 'VACÍO',
        horaSalidaAnterior: turnoExistente?.horaSalidaAsignada || 'VACÍO',
        horaSalidaNueva: datosLimpios.horaSalidaAsignada || 'VACÍO',
        horaEntradaMarcada: datosLimpios.horaEntradaMarcada || 'VACÍO',
        horaSalidaMarcada: datosLimpios.horaSalidaMarcada || 'VACÍO'
      });
      
      // Solo enviar notificación si es una asignación nueva de horarios Y NO es solo marcado de entrada/salida
      if ((esAsignacionNueva || primeraAsignacion) && !soloSeMarcoEntradaOSalida) {
        console.log('🔔 ENVIANDO NOTIFICACIÓN: Turno asignado a:', datosLimpios.nombre, '(', datosLimpios.rut, ')');
        console.log('📨 Detalles de la notificación a enviar:', {
          consultorRut: datosLimpios.rut,
          consultorNombre: datosLimpios.nombre,
          turnoData: datosLimpios
        });
        
        await NotificacionesService.notificarTurnoAsignado(
          datosLimpios.rut,
          datosLimpios.nombre,
          datosLimpios
        );
        console.log('✅ Notificación enviada exitosamente al consultor');
      } else {
        console.log('❌ NO SE ENVÍA NOTIFICACIÓN:', {
          esAsignacionNueva,
          soloSeMarcoEntradaOSalida,
          razon: !esAsignacionNueva ? 'No es asignación nueva' : 'Solo se marcó entrada/salida'
        });
      }
    } catch (notifError) {
      console.error("❌ Error al crear notificación de turno asignado:", notifError);
      // No devolvemos error porque el turno se guardó correctamente
    }
    
    res.status(200).json({
      message: "Turno guardado exitosamente",
      data: turno
    });
  } catch (error) {
    console.error('❌ Error en saveOrUpdateTurno controller:', error);
    handleErrorServer(res, 500, error.message);
  }
}

export async function deleteTurno(req, res) {
  try {
    const { rut, fecha } = req.params;
    
    if (!rut || !fecha) {
      return res.status(400).json({
        message: "El RUT y la fecha son requeridos",
        data: null
      });
    }

    await deleteTurnoService(rut, fecha);
    
    res.status(200).json({
      message: "Turno eliminado exitosamente",
      data: null
    });
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}
