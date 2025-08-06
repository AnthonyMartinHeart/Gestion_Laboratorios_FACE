import axios from './root.service.js';

const API_URL = '/turnos';
const STORAGE_KEY = 'turnos_consultores';

export async function getTurnosByFecha(fecha) {
  try {
    // Siempre verificar localStorage primero
    const localTurnos = getTurnosByFechaLocal(fecha);
    
    // Intentar backend
    console.log('🔄 Intentando obtener turnos del backend para fecha:', fecha);
    const response = await axios.get(`${API_URL}/fecha/${fecha}`);
    console.log('✅ Turnos obtenidos del backend:', response.data.data);
    
    const backendTurnos = response.data.data || [];
    
    // Si tenemos datos en localStorage, combinar con backend priorizando localStorage
    if (localTurnos.length > 0) {
      console.log('📦 Combinando datos de localStorage (prioritario) con backend...');
      
      // Crear mapa de turnos del backend por RUT
      const backendMap = new Map();
      backendTurnos.forEach(turno => {
        backendMap.set(turno.rut, turno);
      });
      
      // Combinar, priorizando localStorage
      const turnosCombinados = localTurnos.map(localTurno => {
        const backendTurno = backendMap.get(localTurno.rut);
        if (backendTurno) {
          // Combinar datos, priorizando localStorage para campos marcados
          return {
            ...backendTurno,
            horaEntradaMarcada: localTurno.horaEntradaMarcada || backendTurno.horaEntradaMarcada || "",
            horaSalidaMarcada: localTurno.horaSalidaMarcada || backendTurno.horaSalidaMarcada || "",
            observacion: localTurno.observacion || backendTurno.observacion || ""
          };
        } else {
          return localTurno;
        }
      });
      
      // Agregar turnos que solo están en backend
      backendTurnos.forEach(backendTurno => {
        const existe = turnosCombinados.some(t => t.rut === backendTurno.rut);
        if (!existe) {
          turnosCombinados.push(backendTurno);
        }
      });
      
      console.log('🔄 Turnos combinados (localStorage + backend):', turnosCombinados);
      return turnosCombinados;
    }
    
    return backendTurnos;
  } catch (error) {
    console.warn('⚠️ Backend no disponible, usando localStorage como fallback:', error.message);
    // Fallback a localStorage
    const turnos = getTurnosByFechaLocal(fecha);
    console.log('📦 Turnos obtenidos de localStorage:', turnos);
    
    return turnos;
  }
}

export async function saveOrUpdateTurno(fecha, turno) {
  console.log('💾 Guardando turno:', { fecha, turno });
  
  try {
    // Intentar guardar en backend primero
    const turnoData = { ...turno, fecha };
    const response = await axios.post(API_URL, turnoData);
    console.log('✅ Turno guardado en backend:', response.data);
    
    // SIEMPRE guardar en localStorage como backup, incluso cuando el backend funciona
    saveOrUpdateTurnoLocal(fecha, turno);
    console.log('📦 Turno también guardado en localStorage como backup');
    
    return response.data.data;
  } catch (error) {
    console.warn('⚠️ Error al guardar turno en backend, usando localStorage como fallback:', error.message);
    // Fallback a localStorage
    try {
      saveOrUpdateTurnoLocal(fecha, turno);
      
      // Verificar que se guardó correctamente
      const turnosGuardados = getTurnosByFechaLocal(fecha);
      const turnoVerificado = turnosGuardados.find(t => t.rut === turno.rut);
      console.log('📋 Turno verificado después de guardar en localStorage:', turnoVerificado);
      
      return turno;
    } catch (localError) {
      console.error('❌ Error al guardar en localStorage:', localError);
      throw localError;
    }
  }
}

export async function getTurnoByRutAndFecha(rut, fecha) {
  try {
    const response = await axios.get(`${API_URL}/${rut}/${fecha}`);
    return response.data.data;
  } catch (error) {
    console.error('Error al obtener turno específico:', error);
    return null;
  }
}

export async function deleteTurno(rut, fecha) {
  try {
    const response = await axios.delete(`${API_URL}/${rut}/${fecha}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar turno:', error);
    throw error;
  }
}

// Funciones de fallback con localStorage (para compatibilidad)
function getTurnosByFechaLocal(fecha) {
  try {
    console.log('🔍 getTurnosByFechaLocal - INICIO:');
    console.log('   📅 Fecha solicitada:', fecha);
    
    const rawData = localStorage.getItem(STORAGE_KEY);
    console.log('   📦 Raw data de localStorage:', rawData);
    
    const all = JSON.parse(rawData || '{}');
    console.log('   �️ Datos parseados:', all);
    
    const turnos = all[fecha] || [];
    console.log('   📋 Turnos encontrados para la fecha:', turnos);
    console.log('   � Cantidad de turnos:', turnos.length);
    
    console.log('🗄️ RESUMEN:');
    console.log('   - Fechas disponibles:', Object.keys(all));
    console.log('   - Fecha buscada existe:', fecha in all);
    console.log('   - Turnos a devolver:', turnos);
    
    return turnos;
  } catch (error) {
    console.error('❌ Error al cargar turnos de localStorage:', error);
    return [];
  }
}

function saveOrUpdateTurnoLocal(fecha, turno) {
  try {
    console.log('💾 saveOrUpdateTurnoLocal - INICIANDO GUARDADO:');
    console.log('   📅 Fecha para guardar:', fecha, '(tipo:', typeof fecha, ')');
    console.log('   👤 Turno a guardar:', turno);
    
    const rawData = localStorage.getItem(STORAGE_KEY);
    console.log('   📦 Raw data actual:', rawData);
    
    const all = JSON.parse(rawData || '{}');
    console.log('   �️ Datos parseados actuales:', all);
    console.log('   🔑 Keys existentes:', Object.keys(all));
    
    const turnos = all[fecha] || [];
    console.log('   📋 Turnos existentes para esta fecha:', turnos);
    
    const idx = turnos.findIndex(t => t.rut === turno.rut);
    console.log('   🔍 Índice del turno existente:', idx);
    
    if (idx >= 0) {
      // Actualizar turno existente manteniendo todos los datos
      const turnoAnterior = { ...turnos[idx] };
      turnos[idx] = { ...turnos[idx], ...turno };
      console.log('   ✏️ ACTUALIZANDO turno existente:');
      console.log('     - Turno anterior:', turnoAnterior);
      console.log('     - Turno actualizado:', turnos[idx]);
    } else {
      // Agregar nuevo turno
      turnos.push(turno);
      console.log('   ➕ AGREGANDO nuevo turno:', turno);
    }
    
    all[fecha] = turnos;
    console.log('   🗂️ Estructura ANTES de guardar:', all);
    console.log('   🔑 Keys ANTES de guardar:', Object.keys(all));
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    console.log('   ✅ GUARDADO en localStorage completado');
    
    // Verificar que se guardó
    const verificacion = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    console.log('   🔄 VERIFICACIÓN después de guardar:');
    console.log('     - Keys en localStorage:', Object.keys(verificacion));
    console.log('     - Fecha específica existe:', fecha in verificacion);
    console.log('     - Turnos para la fecha:', verificacion[fecha]);
    console.log('     - Estructura completa:', verificacion);
    
  } catch (error) {
    console.error('❌ Error al guardar en localStorage:', error);
    throw error;
  }
}

export function clearTurnos() {
  localStorage.removeItem(STORAGE_KEY);
}
