const STORAGE_KEY = 'turnos_consultores';

export function getTurnosByFecha(fecha) {
  const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  return all[fecha] || [];
}

export function saveOrUpdateTurno(fecha, turno) {
  const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  const turnos = all[fecha] || [];
  const idx = turnos.findIndex(t => t.rut === turno.rut);
  if (idx >= 0) {
    turnos[idx] = { ...turnos[idx], ...turno };
  } else {
    turnos.push(turno);
  }
  all[fecha] = turnos;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function clearTurnos() {
  localStorage.removeItem(STORAGE_KEY);
}
