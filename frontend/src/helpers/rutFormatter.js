export const formatRut = (rut) => {
    // Limpiamos el RUT de puntos y guiones
    const rutLimpio = rut.replace(/\./g, '').replace(/-/g, '');
    
    // Separamos el dígito verificador
    const dv = rutLimpio.slice(-1);
    const rutNumeros = rutLimpio.slice(0, -1);
    
    // Agregamos los puntos
    const rutConPuntos = rutNumeros
        .split('')
        .reverse()
        .reduce((acc, cur, i) => {
            if (i > 0 && i % 3 === 0) return `${cur}.${acc}`;
            return cur + acc;
        }, '');
    
    // Retornamos el RUT formateado con puntos y guión
    return `${rutConPuntos}-${dv}`;
};
