import axios from './root.service.js';

const API_URL = '/turnos';

// Temporalmente usar solo localStorage hasta que el backend esté funcionando
const STORAGE_KEY = 'turnos_consultores';

export async function getTurnosByFecha(fecha) {
  try {
    // Intentar backend primero
    console.log('🔄 Intentando obtener turnos del backend para fecha:', fecha);
    const response = await axios.get(`${API_URL}/fecha/${fecha}`);
    console.log('✅ Turnos obtenidos del backend:', response.data.data);
    return response.data.data || [];
  } catch (error) {
    console.warn('⚠️ Backend no disponible, usando localStorage como fallback:', error.message);
    // Fallback a localStorage
    const turnos = getTurnosByFechaLocal(fecha);
    console.log(' Turnos obtenidos de localStorage:', turnos);
    
    return turnos; // Devolver tal como vienen de localStorage
  }
}

export async function saveOrUpdateTurno(fecha, turno) {
  console.log('💾 Guardando turno:', { fecha, turno });
  
  try {
    // Intentar guardar en backend primero
    const turnoData = { ...turno, fecha };
    const response = await axios.post(API_URL, turnoData);
    console.log('✅ Turno guardado en backend:', response.data);
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
