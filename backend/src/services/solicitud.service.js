import { AppDataSource } from "../config/configDb.js";
import SolicitudEntity from "../entity/solicitud.entity.js";
import { handleSuccess, handleErrorClient, handleErrorServer } from "../handlers/responseHandlers.js";

class SolicitudService {
  constructor() {
    this.solicitudRepository = AppDataSource.getRepository("Solicitud");
  }

  async crearSolicitud(solicitudData) {
    try {
      // Validaciones específicas para solicitudes recurrentes
      if (solicitudData.tipoSolicitud === 'recurrente') {
        const { fechaInicio, fechaTermino, diasSemana } = solicitudData;
        
        // Validar que los campos requeridos estén presentes
        if (!fechaInicio || !fechaTermino || !diasSemana || diasSemana.length === 0) {
          return [null, "Faltan datos requeridos para solicitud recurrente"];
        }

        // Para solicitudes recurrentes, verificar conflictos en todas las fechas del período
        const conflictos = await this.verificarConflictosRecurrentes(
          solicitudData.laboratorio,
          new Date(fechaInicio),
          new Date(fechaTermino),
          diasSemana,
          solicitudData.horaInicio,
          solicitudData.horaTermino
        );

        if (conflictos.length > 0) {
          const fechaConflicto = conflictos[0].fecha;
          return [null, `Conflicto de horario detectado el ${new Date(fechaConflicto).toLocaleDateString('es-CL')}`];
        }

        // Crear solicitud recurrente única
        const solicitudRecurrente = this.solicitudRepository.create({
          ...solicitudData,
          fecha: fechaInicio, // Usamos fecha como fecha de inicio
          fechaTermino: fechaTermino,
          tipoSolicitud: 'recurrente',
          diasSemana: diasSemana
        });

        const solicitudGuardada = await this.solicitudRepository.save(solicitudRecurrente);
        return [solicitudGuardada, null];
      }
      
      // Solicitud única (comportamiento original)
      console.log('📅 DATOS QUE SE VAN A GUARDAR:', solicitudData);
      console.log('📅 FECHA EN solicitudData:', solicitudData.fecha);
      
      const nuevaSolicitud = this.solicitudRepository.create(solicitudData);
      console.log('📅 FECHA DESPUÉS DE CREATE:', nuevaSolicitud.fecha);
      
      const solicitudGuardada = await this.solicitudRepository.save(nuevaSolicitud);
      console.log('📅 FECHA DESPUÉS DE SAVE (guardada en DB):', solicitudGuardada.fecha);
      
      return [solicitudGuardada, null];
    } catch (error) {
      console.error("Error al crear solicitud:", error);
      return [null, "Error interno del servidor"];
    }
  }

  async verificarConflictosRecurrentes(laboratorio, fechaInicio, fechaTermino, diasSemana, horaInicio, horaTermino) {
    try {
      const conflictos = [];
      const diasSemanaMap = {
        'lunes': 1, 'martes': 2, 'miercoles': 3, 
        'jueves': 4, 'viernes': 5, 'sabado': 6, 'domingo': 0
      };

      // Convertir nombres de días a números
      const diasNumeros = diasSemana.map(dia => diasSemanaMap[dia.toLowerCase()]);
      
      // Verificar cada fecha en el rango
      const fechaActual = new Date(fechaInicio);
      while (fechaActual <= fechaTermino) {
        const diaSemana = fechaActual.getDay();
        
        if (diasNumeros.includes(diaSemana)) {
          // Verificar conflictos para esta fecha específica
          const [conflictosEnFecha] = await this.verificarConflictoHorario(
            laboratorio,
            fechaActual.toISOString().split('T')[0],
            horaInicio,
            horaTermino
          );
          
          if (conflictosEnFecha && conflictosEnFecha.length > 0) {
            conflictos.push({
              fecha: new Date(fechaActual),
              conflictos: conflictosEnFecha
            });
          }
        }
        
        fechaActual.setDate(fechaActual.getDate() + 1);
      }
      
      return conflictos;
    } catch (error) {
      console.error("Error al verificar conflictos recurrentes:", error);
      return [];
    }
  }

  async obtenerSolicitudes(filtros = {}) {
    try {
      const queryBuilder = this.solicitudRepository.createQueryBuilder("solicitud");
      
      // Incluir la relación de clases canceladas
      queryBuilder.leftJoinAndSelect("solicitud.clasesCanceladas", "cancelacion");
      
      // Filtros opcionales
      if (filtros.profesorRut) {
        queryBuilder.andWhere("solicitud.profesorRut = :profesorRut", { profesorRut: filtros.profesorRut });
      }
      
      if (filtros.estado) {
        queryBuilder.andWhere("solicitud.estado = :estado", { estado: filtros.estado });
      }
      
      if (filtros.laboratorio) {
        queryBuilder.andWhere("solicitud.laboratorio = :laboratorio", { laboratorio: filtros.laboratorio });
      }
      
      // Ordenar por fecha de creación (más recientes primero)
      queryBuilder.orderBy("solicitud.createdAt", "DESC");
      
      const solicitudes = await queryBuilder.getMany();
      
      // LOG: Ver qué fechas se leen de la DB
      if (solicitudes.length > 0) {
        console.log('📅 PRIMERA SOLICITUD LEÍDA DE DB:', {
          id: solicitudes[0].id,
          titulo: solicitudes[0].titulo,
          fecha: solicitudes[0].fecha,
          tipoFecha: typeof solicitudes[0].fecha,
          cancelaciones: solicitudes[0].clasesCanceladas?.length || 0
        });
      }
      
      return [solicitudes, null];
    } catch (error) {
      console.error("Error al obtener solicitudes:", error);
      return [null, "Error interno del servidor"];
    }
  }

  async obtenerSolicitudPorId(id) {
    try {
      const solicitud = await this.solicitudRepository.findOne({
        where: { id: parseInt(id) }
      });
      
      if (!solicitud) {
        return [null, "Solicitud no encontrada"];
      }
      
      return [solicitud, null];
    } catch (error) {
      console.error("Error al obtener solicitud:", error);
      return [null, "Error interno del servidor"];
    }
  }

  async actualizarEstadoSolicitud(id, estado, administradorRut, motivoRechazo = null) {
    try {
      const solicitud = await this.solicitudRepository.findOne({
        where: { id: parseInt(id) }
      });
      
      if (!solicitud) {
        return [null, "Solicitud no encontrada"];
      }
      
      if (solicitud.estado !== "pendiente") {
        return [null, "Solo se pueden modificar solicitudes pendientes"];
      }
      
      // Actualizar datos
      solicitud.estado = estado;
      solicitud.administradorRut = administradorRut;
      solicitud.fechaRespuesta = new Date();
      
      if (estado === "rechazada" && motivoRechazo) {
        solicitud.motivoRechazo = motivoRechazo;
      }
      
      const solicitudActualizada = await this.solicitudRepository.save(solicitud);
      return [solicitudActualizada, null];
    } catch (error) {
      console.error("Error al actualizar solicitud:", error);
      return [null, "Error interno del servidor"];
    }
  }

  async verificarConflictoHorario(laboratorio, fecha, horaInicio, horaTermino, excludeId = null) {
    try {
      const queryBuilder = this.solicitudRepository.createQueryBuilder("solicitud");
      
      queryBuilder
        .where("solicitud.laboratorio = :laboratorio", { laboratorio })
        .andWhere("solicitud.estado = :estado", { estado: "aprobada" })
        .andWhere("solicitud.fecha = :fecha", { fecha })
        .andWhere(
          "(solicitud.horaInicio < :horaTermino AND solicitud.horaTermino > :horaInicio)",
          { horaInicio, horaTermino }
        );
      
      if (excludeId) {
        queryBuilder.andWhere("solicitud.id != :excludeId", { excludeId });
      }
      
      const conflictos = await queryBuilder.getMany();
      return [conflictos, null];
    } catch (error) {
      console.error("Error al verificar conflictos:", error);
      return [null, "Error interno del servidor"];
    }
  }

  async eliminarSolicitud(id, userRut, userRol) {
    try {
      const solicitud = await this.solicitudRepository.findOne({
        where: { id: parseInt(id) },
        relations: ['clasesCanceladas']
      });
      
      if (!solicitud) {
        return [null, "Solicitud no encontrada"];
      }
      
      // Validar permisos según el rol
      if (userRol === "profesor") {
        // Los profesores solo pueden eliminar sus propias solicitudes pendientes
        if (solicitud.profesorRut !== userRut) {
          return [null, "No tienes permiso para eliminar esta solicitud"];
        }
        
        if (solicitud.estado !== "pendiente") {
          return [null, "Solo se pueden eliminar solicitudes pendientes"];
        }
      } else if (userRol === "administrador") {
        // Los administradores pueden eliminar cualquier solicitud, incluso aprobadas/rechazadas
        // Sin restricciones adicionales
      } else {
        return [null, "No tienes permisos para realizar esta acción"];
      }
      
      // Primero eliminar las cancelaciones relacionadas manualmente
      if (solicitud.clasesCanceladas && solicitud.clasesCanceladas.length > 0) {
        const cancelacionRepository = this.solicitudRepository.manager.getRepository('Cancelacion');
        await cancelacionRepository.delete({ solicitudId: parseInt(id) });
        console.log(`🗑️ Eliminadas ${solicitud.clasesCanceladas.length} cancelaciones de la solicitud ${id}`);
      }
      
      // Luego eliminar la solicitud
      await this.solicitudRepository.remove(solicitud);
      console.log(`✅ Solicitud ${id} eliminada exitosamente`);
      
      return [{ message: "Solicitud eliminada exitosamente" }, null];
    } catch (error) {
      console.error("❌ Error al eliminar solicitud:", error);
      return [null, "Error interno del servidor"];
    }
  }
}

export default new SolicitudService();
