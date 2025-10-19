export const formatRut = (value) => {
    // Eliminar puntos y guión
    let rutLimpio = value.replace(/[.-]/g, '');
    
    // Eliminar cualquier carácter que no sea número o k/K
    rutLimpio = rutLimpio.replace(/[^0-9kK]/g, '');
    
    // Si el RUT está vacío, retornar vacío
    if (rutLimpio.length === 0) return '';
    
    // Obtener el dígito verificador
    const dv = rutLimpio.slice(-1);
    // Obtener el cuerpo del RUT
    const rut = rutLimpio.slice(0, -1);
    
    // Formatear el cuerpo del RUT con puntos
    let rutFormateado = '';
    let i = rut.length;
    while (i > 0) {
        if (rutFormateado) rutFormateado = '.' + rutFormateado;
        rutFormateado = rut.slice(Math.max(0, i - 3), i) + rutFormateado;
        i -= 3;
    }
    
    // Retornar RUT formateado con guión y dígito verificador
    return rutFormateado + (dv ? '-' + dv : '');
};
