import { AppDataSource } from "../config/configDb.js";
import { In } from "typeorm";

class ClasesService {
  constructor() {
    this.solicitudRepository = AppDataSource.getRepository("Solicitud");
    this.cancelacionRepository = AppDataSource.getRepository("Cancelacion");
  }

  async obtenerClasesAprobadas(profesorRut) {
    try {
 console.log('🔍 Buscando clases para profesor:', profesorRut);
      const clases = await this.solicitudRepository
        .createQueryBuilder("solicitud")
        .where("solicitud.profesorRut = :profesorRut", { profesorRut })
        .andWhere("solicitud.estado = :estado", { estado: "aprobada" })
        .orderBy("solicitud.fecha", "ASC")
        .getMany();
      
      console.log('📚 Clases encontradas:', clases.length);

      // Obtener todas las cancelaciones para estas solicitudes
      const solicitudIds = clases.map(clase => clase.id);
      let cancelaciones = [];
      
      if (solicitudIds.length > 0) {
        cancelaciones = await this.cancelacionRepository.find({
          where: {
            solicitudId: In(solicitudIds)
          }
        });
        console.log('📋 Cancelaciones encontradas:', cancelaciones.length);
        cancelaciones.forEach(cancelacion => {
          console.log('  ❌ Cancelación:', {
            solicitudId: cancelacion.solicitudId,
            fecha: cancelacion.fechaEspecifica,
            motivo: cancelacion.motivoCancelacion
          });
        });
      }

      // Agregar cancelaciones a cada clase
      const clasesConCancelaciones = clases.map(clase => {
        const clasesCanceladas = cancelaciones
          .filter(cancelacion => cancelacion.solicitudId === clase.id)
          .map(cancelacion => ({
            fecha: cancelacion.fechaEspecifica,
            motivo: cancelacion.motivoCancelacion
          }));

        return {
          ...clase,
          clasesCanceladas: clasesCanceladas
        };
      });

      return [clasesConCancelaciones, null];
    } catch (error) {
      console.error("Error al obtener clases aprobadas:", error);
      return [null, "Error interno del servidor"];
    }
  }

  async cancelarClase(cancelacionData) {
    try {
      const { solicitudId, fechaEspecifica, profesorRut, profesorNombre, motivoCancelacion } = cancelacionData;

      // Verificar que la solicitud existe y pertenece al profesor
      const solicitud = await this.solicitudRepository.findOne({
        where: { 
          id: parseInt(solicitudId),
          profesorRut: profesorRut,
          estado: "aprobada"
        }
      });

      if (!solicitud) {
        return [null, "Solicitud no encontrada o no autorizada"];
      }

      // Verificar que la fecha específica está dentro del rango de la solicitud
      const fechaCancelacion = new Date(fechaEspecifica);
      const fechaInicioSolicitud = new Date(solicitud.fecha);
      const fechaTerminoSolicitud = solicitud.fechaTermino ? new Date(solicitud.fechaTermino) : fechaInicioSolicitud;

      if (fechaCancelacion < fechaInicioSolicitud || fechaCancelacion > fechaTerminoSolicitud) {
        return [null, "La fecha especificada no está dentro del rango de la solicitud"];
      }

      // Verificar que la clase no ya ha sido cancelada
      const cancelacionExistente = await this.cancelacionRepository.findOne({
        where: {
          solicitudId: parseInt(solicitudId),
          fechaEspecifica: fechaEspecifica
        }
      });

      if (cancelacionExistente) {
        return [null, "Esta clase ya ha sido cancelada"];
      }

      // Crear la cancelación
      const cancelacion = this.cancelacionRepository.create({
        solicitudId: parseInt(solicitudId),
        fechaEspecifica: fechaEspecifica,
        profesorRut: profesorRut,
        profesorNombre: profesorNombre,
        motivoCancelacion: motivoCancelacion
      });

      const cancelacionGuardada = await this.cancelacionRepository.save(cancelacion);

      // Retornar la cancelación junto con la información de la solicitud
      return [{
        ...cancelacionGuardada,
        solicitud: {
          laboratorio: solicitud.laboratorio,
          horaInicio: solicitud.horaInicio,
          horaTermino: solicitud.horaTermino,
          titulo: solicitud.titulo
        }
      }, null];
    } catch (error) {
      console.error("Error al cancelar clase:", error);
      return [null, "Error interno del servidor"];
    }
  }

  async obtenerClasesCanceladas(solicitudId, fechaEspecifica = null) {
    try {
      const where = { solicitudId: parseInt(solicitudId) };
      if (fechaEspecifica) {
        where.fechaEspecifica = fechaEspecifica;
      }

      const cancelaciones = await this.cancelacionRepository.find({
        where: where,
        order: {
          fechaCancelacion: "DESC"
        }
      });

      return [cancelaciones, null];
    } catch (error) {
      console.error("Error al obtener clases canceladas:", error);
      return [null, "Error interno del servidor"];
    }
  }

  async obtenerNotificacionesCancelaciones() {
    try {
      const notificaciones = await this.cancelacionRepository.find({
        where: { estado: "pendiente" },
        relations: ["solicitud"],
        order: {
          fechaCancelacion: "DESC"
        }
      });

      return [notificaciones, null];
    } catch (error) {
      console.error("Error al obtener notificaciones:", error);
      return [null, "Error interno del servidor"];
    }
  }

  async marcarNotificacionVista(cancelacionId) {
    try {
      const cancelacion = await this.cancelacionRepository.findOne({
        where: { id: parseInt(cancelacionId) }
      });

      if (!cancelacion) {
        return [null, "Notificación no encontrada"];
      }

      cancelacion.estado = "vista";
      cancelacion.vistaPorAdmin = new Date();

      const cancelacionActualizada = await this.cancelacionRepository.save(cancelacion);
      return [cancelacionActualizada, null];
    } catch (error) {
      console.error("Error al marcar notificación como vista:", error);
      return [null, "Error interno del servidor"];
    }
  }

  async contarNotificacionesPendientes() {
    try {
      const count = await this.cancelacionRepository.count({
        where: { estado: "pendiente" }
      });

      return [count, null];
    } catch (error) {
      console.error("Error al contar notificaciones:", error);
      return [null, "Error interno del servidor"];
    }
  }
}

export default new ClasesService();
