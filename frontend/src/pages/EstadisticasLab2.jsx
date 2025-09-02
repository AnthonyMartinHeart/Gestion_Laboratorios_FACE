import { useState, useEffect } from 'react';
import { getAllReservations } from '@services/reservation.service.js';
import '@styles/estadisticas.css';

const EstadisticasLab2 = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: ''
  });
  const [estadisticas, setEstadisticas] = useState({
    usoEquipos: {},
    horariosActivos: {},
    diasActivos: {},
    totalReservas: 0,
    equiposUtilizados: 0,
    equiposTotales: 20,
    bloquesPorDia: 17,
    capacidadDiaria: 340 // 20 equipos * 17 bloques
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (reservations.length > 0) {
      calcularEstadisticas();
    }
  }, [reservations, filtros]);

  const renderGraficoBarras = () => {
    if (!estadisticas.usoEquipos || Object.keys(estadisticas.usoEquipos).length === 0) {
      return (
        <div className="no-data-message">
          <p>No hay datos disponibles para mostrar</p>
        </div>
      );
    }

    // Calcular datos para cada equipo (PC 41-60)
    const equiposData = [];
    for (let i = 41; i <= 60; i++) {
      const pcKey = `PC ${i}`;
      const reservas = estadisticas.usoEquipos[pcKey] || 0;
      const porcentaje = (reservas / (estadisticas.totalReservas || 1)) * 100;
      
      let rendimiento = 'bajo';
      if (porcentaje >= 8) rendimiento = 'alto';
      else if (porcentaje >= 4) rendimiento = 'medio';
      
      equiposData.push({ 
        pc: pcKey, 
        reservas,
        porcentaje, 
        rendimiento 
      });
    }

    return (
      <div className="chart-container-vertical">
        <div className="chart-wrapper-vertical">
          {equiposData.map((item, index) => (
            <div key={item.pc} className="chart-bar-vertical" style={{animationDelay: `${index * 50}ms`}}>
              <div 
                className={`chart-bar-fill-vertical ${item.rendimiento}`}
                style={{height: `${Math.min(Math.max(item.porcentaje * 3, 2), 200)}px`}}
                title={`${item.pc}: ${item.reservas} reservas (${item.porcentaje.toFixed(1)}%)`}
              ></div>
              <span className="chart-label-vertical">{item.pc.replace('PC ', '')}</span>
            </div>
          ))}
        </div>
        <div className="chart-legend-vertical">
          <div className="legend-item-vertical">
            <span className="legend-color-vertical alto"></span>
            <span>Alto uso (≥8%)</span>
          </div>
          <div className="legend-item-vertical">
            <span className="legend-color-vertical medio"></span>
            <span>Uso medio (4-8%)</span>
          </div>
          <div className="legend-item-vertical">
            <span className="legend-color-vertical bajo"></span>
            <span>Bajo uso (&lt;4%)</span>
          </div>
        </div>
      </div>
    );
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const data = await getAllReservations();
      // Filtrar solo las reservas del Laboratorio 2 (PCs 41-60)
      const reservasLab2 = Array.isArray(data) ? 
        data.filter(r => r.labId === 2 || (r.pcId >= 41 && r.pcId <= 60)) : [];
      setReservations(reservasLab2);
    } catch (error) {
      console.error('Error al cargar reservas:', error);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  const filtrarReservas = (reservas) => {
    let filtradas = [...reservas];

    if (filtros.fechaInicio) {
      filtradas = filtradas.filter(r => r.fechaReserva >= filtros.fechaInicio);
    }
    if (filtros.fechaFin) {
      filtradas = filtradas.filter(r => r.fechaReserva <= filtros.fechaFin);
    }

    return filtradas;
  };

  const calcularEstadisticas = () => {
    const reservasFiltradas = filtrarReservas(reservations);
    
    const usoEquipos = {};
    const horariosActivos = {};
    const diasActivos = {};
    
    reservasFiltradas.forEach(reserva => {
      if (reserva.carrera === 'MAINTENANCE') return;

      const equipoKey = `PC ${reserva.pcId}`;
      usoEquipos[equipoKey] = (usoEquipos[equipoKey] || 0) + 1;

      const horario = reserva.horaInicio.substring(0, 5);
      horariosActivos[horario] = (horariosActivos[horario] || 0) + 1;

      const fecha = new Date(reserva.fechaReserva);
      const nombreDia = fecha.toLocaleDateString('es-ES', { weekday: 'long' });
      diasActivos[nombreDia] = (diasActivos[nombreDia] || 0) + 1;
    });

    const equiposUtilizados = Object.keys(usoEquipos).length;

    setEstadisticas({
      usoEquipos,
      horariosActivos,
      diasActivos,
      totalReservas: reservasFiltradas.length,
      equiposUtilizados,
      equiposTotales: 20,
      bloquesPorDia: 17,
      capacidadDiaria: 340
    });
  };

  const exportarExcel = () => {
    const reservasFiltradas = filtrarReservas(reservations);
    
    const header = ['Equipo', 'RUT', 'Carrera', 'Fecha', 'Hora Inicio', 'Hora Fin'];
    const rows = reservasFiltradas.map(reserva => [
      `PC ${reserva.pcId}`,
      reserva.rut,
      reserva.carrera,
      reserva.fechaReserva,
      reserva.horaInicio,
      reserva.horaTermino
    ]);

    let tableStyle = 'border-collapse: collapse; width: 100%;';
    let cellStyle = 'border: 1px solid black; padding: 8px; text-align: center;';
    let headerStyle = cellStyle + 'background-color: #033163; color: white; font-weight: bold;';

    let table = `<table style="${tableStyle}">`;
    table += '<tr>' + header.map(h => `<th style="${headerStyle}">${h}</th>`).join('') + '</tr>';
    
    rows.forEach(row => {
      table += '<tr>' + row.map(cell => `<td style="${cellStyle}">${cell}</td>`).join('') + '</tr>';
    });
    
    table += '</table>';

    const excelFile = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <style>
          table, th, td { border: 1px solid black; }
          th { background-color: #033163; color: white; }
        </style>
      </head>
      <body>
        ${table}
      </body>
      </html>`;

    const blob = new Blob(['\ufeff' + excelFile], { 
      type: 'application/vnd.ms-excel;charset=utf-8' 
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `estadisticas_laboratorio_2_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderResumenGeneral = () => (
    <div className="estadisticas-resumen">
      <h3>📊 Resumen Laboratorio 2</h3>
      <div className="resumen-cards">
        <div className="stat-card">
          <div className="stat-number">{estadisticas.totalReservas}</div>
          <div className="stat-label">Total Reservas</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{estadisticas.equiposUtilizados}/20</div>
          <div className="stat-label">Equipos Utilizados</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{Math.round((estadisticas.equiposUtilizados / 20) * 100)}%</div>
          <div className="stat-label">% Equipos Utilizados</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{Math.round((estadisticas.totalReservas / estadisticas.capacidadDiaria) * 100)}%</div>
          <div className="stat-label">% Uso Diario</div>
        </div>
      </div>
    </div>
  );

  const renderTablaFrecuencia = (titulo, datos, icono) => {
    const sortedData = Object.entries(datos)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    return (
      <div className="estadisticas-tabla">
        <h4>{icono} {titulo}</h4>
        <div className="tabla-container">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Frecuencia</th>
                <th>Porcentaje</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map(([item, count], index) => {
                const porcentaje = estadisticas.totalReservas > 0 
                  ? ((count / estadisticas.totalReservas) * 100).toFixed(1)
                  : 0;
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando estadísticas del Laboratorio 2...</p>
      </div>
    );
  }

  return (
    <div className="estadisticas-container">
      <div className="estadisticas-header">
        <h2>🧪 Estadísticas Laboratorio 2</h2>
        <p className="estadisticas-subtitle">
          Análisis específico del uso de equipos en el Laboratorio 2 (PCs 41-60)
        </p>
      </div>

      <div className="filtros-container">
        <h3>🔍 Filtros de Análisis</h3>
        <div className="filtros-form">
          <div className="filtro-item">
            <label>Fecha Inicio:</label>
            <input
              type="date"
              value={filtros.fechaInicio}
              onChange={(e) => setFiltros(prev => ({ ...prev, fechaInicio: e.target.value }))}
            />
          </div>
          <div className="filtro-item">
            <label>Fecha Fin:</label>
            <input
              type="date"
              value={filtros.fechaFin}
              onChange={(e) => setFiltros(prev => ({ ...prev, fechaFin: e.target.value }))}
            />
          </div>
          <button className="export-button" onClick={exportarExcel}>
            <i className="fas fa-file-excel"></i> Exportar a Excel
          </button>
        </div>
      </div>

      {renderResumenGeneral()}

      <div className="estadisticas-grid">
        {renderTablaFrecuencia('Equipos Más Utilizados', estadisticas.usoEquipos, '💻')}
        {renderTablaFrecuencia('Horarios Más Activos', estadisticas.horariosActivos, '⏰')}
        {renderTablaFrecuencia('Días Más Activos', estadisticas.diasActivos, '📅')}
      </div>

      <div className="info-adicional">
        <div className="info-card">
          <h4>ℹ️ Información del Laboratorio 2</h4>
          <ul>
            <li><strong>Equipos disponibles:</strong> 20 PCs (PC 41-60)</li>
            <li><strong>Bloques horarios:</strong> 17 por día</li>
            <li><strong>Capacidad diaria:</strong> 340 reservas máximas</li>
            <li><strong>Datos excluidos:</strong> Reservas de mantenimiento</li>
          </ul>
        </div>
        <div className="info-card">
          <h4>� Distribución de Uso por Equipos</h4>
          {renderGraficoBarras()}
        </div>
      </div>
    </div>
  );
};

export default EstadisticasLab2;
