"use strict";

/**
 * Convierte un texto a formato de título (Primera Letra De Cada Palabra En Mayúscula)
 * @param {string} texto - El texto a formatear
 * @returns {string} - El texto formateado
 */
export const toTitleCase = (texto) => {
  if (!texto) return '';
  
  return texto
    .toLowerCase()
    .split(' ')
    .map(palabra => {
      if (palabra.length === 0) return palabra;
      return palabra.charAt(0).toUpperCase() + palabra.slice(1);
    })
    .join(' ');
};

/**
 * Formatea un nombre completo para mostrar de manera elegante
 * @param {string} nombreCompleto - El nombre completo
 * @returns {string} - El nombre formateado
 */
export const formatearNombre = (nombreCompleto) => {
  if (!nombreCompleto) return 'No registrado';
  
  // Palabras que normalmente van en minúsculas (preposiciones, artículos)
  const palabrasMinusculas = ['de', 'del', 'la', 'las', 'el', 'los', 'y', 'e'];
  
  return nombreCompleto
    .toLowerCase()
    .split(' ')
    .map((palabra, index) => {
      if (palabra.length === 0) return palabra;
      
      // La primera palabra siempre va en mayúscula
      if (index === 0) {
        return palabra.charAt(0).toUpperCase() + palabra.slice(1);
      }
      
      // Si es una palabra que debe ir en minúsculas
      if (palabrasMinusculas.includes(palabra)) {
        return palabra;
      }
      
      // Caso normal: primera letra en mayúscula
      return palabra.charAt(0).toUpperCase() + palabra.slice(1);
    })
    .join(' ');
};
