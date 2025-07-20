"use strict";
import { 
  getHorariosService, 
  saveHorariosService 
} from "../services/horario.service.js";
import { 
  handleErrorClient, 
  handleErrorServer, 
  handleSuccess 
} from "../handlers/responseHandlers.js";

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

    handleSuccess(res, 200, "Horarios guardados exitosamente", saved);
  } catch (e) {
    console.error('Error en saveHorarios:', e);
    handleErrorServer(res, 500, e.message);
  }
}
