import { useState, useEffect } from 'react';

const EstadisticasDetalladas = ({ reservations }) => {
  const [estadisticasAvanzadas, setEstadisticasAvanzadas] = useState({
    equiposStats: {},
    horarioStats: {},
    diasStats: {},
    carreraStats: {},
    mesStats: {},
    usuarioStats: {},
    labStats: {},
    fechasStats: {}
  });

  useEffect(() => {
    if (reservations.length > 0) {
      calcularEstadisticasAvanzadas();
    } else {
      // Reiniciar las estadísticas cuando no hay datos
      setEstadisticasAvanzadas({
        equiposStats: {},
        horarioStats: {},
        diasStats: {},
        carreraStats: {},
        mesStats: {},
        usuarioStats: {},
        labStats: {},
        fechasStats: {}
      });
    }
  }, [reservations]);

  const calcularEstadisticasAvanzadas = () => {
    const stats = {
      equiposStats: {},
      horarioStats: {},
      diasStats: {},
      carreraStats: {},
      mesStats: {},
      usuarioStats: {},
      labStats: {},
      fechasStats: {}
    };

    reservations.forEach(reserva => {
      if (reserva.carrera === 'MAINTENANCE') return;

      // Estadísticas por carrera
      if (!stats.carreraStats[reserva.carrera]) {
        stats.carreraStats[reserva.carrera] = { cantidad: 0 };
      }
      stats.carreraStats[reserva.carrera].cantidad++;

      // Estadísticas por mes
      const fecha = new Date(reserva.fechaReserva);
      const mes = fecha.toLocaleString('es-ES', { month: 'long' });
      if (!stats.mesStats[mes]) {
        stats.mesStats[mes] = { cantidad: 0 };
      }
      stats.mesStats[mes].cantidad++;

      // Estadísticas por usuario
      if (!stats.usuarioStats[reserva.rut]) {
        stats.usuarioStats[reserva.rut] = { cantidad: 0 };
      }
      stats.usuarioStats[reserva.rut].cantidad++;

      // Estadísticas por laboratorio
      const labKey = `Laboratorio ${reserva.labId}`;
      if (!stats.labStats[labKey]) {
        stats.labStats[labKey] = { cantidad: 0 };
      }
      stats.labStats[labKey].cantidad++;

      // Estadísticas por equipo
      const equipoKey = `PC ${reserva.pcId}`;
      if (!stats.equiposStats[equipoKey]) {
        stats.equiposStats[equipoKey] = { cantidad: 0 };
      }
      stats.equiposStats[equipoKey].cantidad++;

      // Estadísticas por horario
      const horario = reserva.horaInicio.substring(0, 5);
      if (!stats.horarioStats[horario]) {
        stats.horarioStats[horario] = { cantidad: 0 };
      }
      stats.horarioStats[horario].cantidad++;

      // Estadísticas por día
      const dia = new Date(reserva.fechaReserva).toLocaleDateString('es-ES', { weekday: 'long' });
      if (!stats.diasStats[dia]) {
        stats.diasStats[dia] = { cantidad: 0 };
      }
      stats.diasStats[dia].cantidad++;

      // Estadísticas por fecha
      const fechaFormat = new Date(reserva.fechaReserva).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!stats.fechasStats[fechaFormat]) {
        stats.fechasStats[fechaFormat] = { cantidad: 0 };
      }
      stats.fechasStats[fechaFormat].cantidad++;
    });

    // Calcular porcentajes para cada categoría
    for (const category of Object.values(stats)) {
      const total = Object.values(category).reduce((sum, { cantidad }) => sum + cantidad, 0);
      Object.values(category).forEach(item => {
        item.porcentaje = total > 0 ? item.cantidad / total : 0;
      });
    }

    setEstadisticasAvanzadas(stats);
  };

  const renderEstadisticasTabla = (titulo, datos, icono) => {
    const sortedData = Object.entries(datos)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    const total = Object.values(datos).reduce((sum, val) => sum + val, 0);

    return (
      <div className="estadisticas-tabla">
        <h4>{icono} {titulo}</h4>
        <div className="tabla-container">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Cantidad</th>
                <th>Porcentaje</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map(([item, count], index) => {
                const porcentaje = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                return (
                  <tr key={item}>
                    <td>
                      <span className="ranking">#{index + 1}</span>
                      {item}
                    </td>
                    <td>{count}</td>
                    <td>
                      <div className="porcentaje-bar">
                        <div 
                          className="porcentaje-fill" 
                          style={{ width: `${porcentaje}%` }}
                        ></div>
                        <span>{porcentaje}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderTabla = (titulo, datos, columnas) => {
    return (
      <div className="estadistica-card">
        <div className="tabla-titulo">{titulo}</div>
        <table className="tabla-nueva">
          <thead>
            <tr>
              {columnas.map((col, index) => (
                <th key={index}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(datos).length > 0 ? (
              Object.entries(datos)
                .sort(([,a], [,b]) => b.cantidad - a.cantidad)
                .slice(0, 5)
                .map(([item, { cantidad }]) => (
                  <tr key={item}>
                    <td>{item}</td>
                    <td>
                      {cantidad} {columnas[1].includes('Reservas') ? 
                        (cantidad === 1 ? 'reserva' : 'reservas') : 
                        columnas[1] === 'Frecuencia' ? 
                          (cantidad === 1 ? 'vez' : 'veces') : 
                          'sesiones'
                      }
                    </td>
                    <td style={{ padding: 0 }}>
                      <div className="nivel-uso">
                        <div 
                          className="nivel-barra" 
                          style={{ width: `${(cantidad / (Object.values(datos).reduce((sum, { cantidad: c }) => sum + c, 0))) * 100}%`, backgroundColor: '#4CAF50' }}
                        ></div>
                        <span>{((cantidad / (Object.values(datos).reduce((sum, { cantidad: c }) => sum + c, 0))) * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))
            ) : (
              <tr>
                <td colSpan={3} className="no-data-message">
                  No figura información
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  if (reservations.length === 0) {
    return (
      <div className="no-data-message" style={{ 
        textAlign: 'center', 
        padding: '2rem', 
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: '8px',
        margin: '1rem'
      }}>
        <h4>No hay datos disponibles para el período seleccionado</h4>
        <p>Por favor, ajuste los filtros de fecha para ver las estadísticas</p>
      </div>
    );
  }

  return (
    <div className="estadisticas-detalladas">
      <div className="estadisticas-grid">
        {Object.keys(estadisticasAvanzadas.equiposStats).length > 0 ? (
          <>
            {renderTabla('💻 Equipos Más Utilizados', estadisticasAvanzadas.equiposStats,
              ['Equipo', 'Frecuencia', 'Porcentaje de Uso'])}
            {renderTabla('⏰ Horarios Más Activos', estadisticasAvanzadas.horarioStats,
              ['Horario', 'Frecuencia', 'Porcentaje de Uso'])}
            {renderTabla('📅 Días Más Activos', estadisticasAvanzadas.diasStats,
              ['Día', 'Frecuencia', 'Porcentaje de Uso'])}
            {renderTabla('🎓 Carreras Más Activas', estadisticasAvanzadas.carreraStats,
              ['Carrera', 'Total de Reservas', 'Nivel de Uso'])}
            {renderTabla('📊 Meses con Mayor Actividad', estadisticasAvanzadas.mesStats,
              ['Mes', 'Reservas Realizadas', 'Nivel de Actividad'])}
            {renderTabla('👤 Usuarios Más Frecuentes', estadisticasAvanzadas.usuarioStats,
              ['RUT Usuario', 'N° de Reservas', 'Frecuencia de Uso'])}
          </>
        ) : (
          <div className="no-data-message" style={{ 
            textAlign: 'center', 
            padding: '2rem', 
            backgroundColor: 'rgba(255,255,255,0.9)',
            borderRadius: '8px',
            margin: '1rem'
          }}>
            <h4>No hay datos disponibles para el período seleccionado</h4>
            <p>Por favor, ajuste los filtros de fecha para ver las estadísticas</p>
          </div>
        )}
        {renderTabla('🖥️ Uso por Laboratorio', estadisticasAvanzadas.labStats,
          ['Laboratorio', 'Total de Sesiones', 'Tasa de Ocupación'])}
        {renderTabla('⌚ Horarios de Alta Demanda', estadisticasAvanzadas.horarioStats,
          ['Bloque Horario', 'N° de Reservas', 'Demanda del Horario'])}
        {renderTabla('📆 Fechas Más Ocupadas', estadisticasAvanzadas.fechasStats,
          ['Fecha', 'N° de Reservas', 'Nivel de Ocupación'])}
      </div>
    </div>
  );
};

export default EstadisticasDetalladas;
