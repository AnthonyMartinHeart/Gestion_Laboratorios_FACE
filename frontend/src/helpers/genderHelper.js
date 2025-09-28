// Lista de nombres comunes femeninos en español
const nombresFemeninos = new Set([
  'maria', 'ana', 'laura', 'andrea', 'patricia', 'rosa', 'paula', 'lucia', 'carmen', 'sara',
  'sofia', 'daniela', 'julia', 'isabel', 'marta', 'elena', 'cecilia', 'valentina', 'carolina',
  'gabriela', 'fernanda', 'victoria', 'claudia', 'monica', 'natalia', 'silvia', 'beatriz',
  'diana', 'adriana', 'valeria', 'catalina', 'camila', 'amanda', 'veronica', 'teresa',
  'alejandra', 'emma', 'isabella', 'mariana', 'constanza', 'josefina', 'antonia', 'francisca',
  'javiera', 'carla', 'susana', 'vanessa', 'nicole', 'barbara', 'lorena'
]);

/**
 * Determina si un nombre es femenino basado en una lista predefinida
 * @param {string} nombre - El nombre a verificar
 * @returns {boolean} - true si el nombre es femenino, false si no
 */
export const esNombreFemenino = (nombre) => {
  if (!nombre) return false;
  // Convertir a minúsculas y quitar acentos para la comparación
  const nombreNormalizado = nombre.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return nombresFemeninos.has(nombreNormalizado);
};

/**
 * Devuelve el prefijo de bienvenida correcto según el género
 * @param {string} nombre - El nombre para determinar el género
 * @returns {string} - "Bienvenida" para nombres femeninos, "Bienvenido" para el resto
 */
export const obtenerPrefijoBienvenida = (nombre) => {
  return esNombreFemenino(nombre) ? "Bienvenida" : "Bienvenido";
};
