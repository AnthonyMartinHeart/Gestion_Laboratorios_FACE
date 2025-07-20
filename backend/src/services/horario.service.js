"use strict";
import Horario from "../entity/horario.entity.js";
import { AppDataSource } from "../config/configDb.js";

export async function getHorariosService() {
  try {
    const repo = AppDataSource.getRepository(Horario);
    // Obtener el horario más reciente (solo debería haber uno)
    const horarios = await repo.find({
      order: { lastModified: "DESC" },
      take: 1
    });
    
    const horario = horarios[0]; // Obtiene el primer elemento (el más reciente) o undefined si no hay registros
    
    if (!horario) {
      // Si no existe, crear estructura inicial vacía
      const initialData = {
        lab1: [],
        lab2: [],
        lab3: [],
        lastModified: new Date().toISOString(),
        modifiedBy: 'Sistema',
        timestamp: Date.now()
      };
      
      // Crear el registro en la base de datos para evitar generarlo en cada consulta
      try {
        const newHorario = repo.create({
          data: initialData,
          lastModified: new Date(),
          modifiedBy: 'Sistema'
        });
        
        await repo.save(newHorario);
        console.log('Horario inicial creado en la base de datos');
      } catch (dbError) {
        console.error('Error al crear horario inicial:', dbError);
        // Si hay error al guardar, continuamos retornando los datos iniciales
      }
      
      return [initialData, null];
    }
    
    return [horario.data, null];
  } catch (error) {
    console.error("Error al obtener horarios:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function saveHorariosService(data, modifiedBy) {
  try {
    const repo = AppDataSource.getRepository(Horario);
    
    // Verificar si ya existe un registro de horarios
    const existingHorarios = await repo.find({
      order: { lastModified: "DESC" },
      take: 1
    });
    const existingHorario = existingHorarios[0]; // Obtiene el primer elemento (el más reciente) o undefined si no hay registros
    
    const horarioData = {
      ...data,
      lastModified: new Date().toISOString(),
      modifiedBy: modifiedBy || 'Administrador',
      timestamp: Date.now()
    };
    
    if (existingHorario) {
      // Actualizar el registro existente
      existingHorario.data = horarioData;
      existingHorario.lastModified = new Date();
      existingHorario.modifiedBy = modifiedBy || 'Administrador';
      
      const saved = await repo.save(existingHorario);
      return [saved.data, null];
    } else {
      // Crear nuevo registro
      const newHorario = repo.create({
        data: horarioData,
        lastModified: new Date(),
        modifiedBy: modifiedBy || 'Administrador'
      });
      
      const saved = await repo.save(newHorario);
      return [saved.data, null];
    }
  } catch (error) {
    console.error("Error al guardar horarios:", error);
    return [null, "Error interno del servidor"];
  }
}
