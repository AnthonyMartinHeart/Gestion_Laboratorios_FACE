import { useState, useEffect } from 'react';
import { getEstadisticasAsistencia } from '@services/estadisticas.service.js';
import '@styles/estadisticas.css';

const EstadisticasAsistencia = () => {
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    consultor: 'todos'
  });
  const [estadisticas, setEstadisticas] = useState({
    resumenGeneral: {
      totalTurnos: 0,
      totalConsultores: 0,
      turnosPresentes: 0,
      turnosAusentes: 0,
      porcentajeAsistencia: 0,
      promedioRetraso: 0,
      promedioHoras: 0
    },
    asistenciaPorConsultor: {},
    puntualidadPorConsultor: {},
    horasPorConsultor: {},
    observacionesPorConsultor: {},
    tendenciasAsistencia: {}
  });

  useEffect(() => {
    cargarDatos();
  }, [filtros]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      const data = await getEstadisticasAsistencia(filtros);
      setEstadisticas(data);
    } catch (error) {
      console.error('Error al cargar estadísticas de asistencia:', error);
      // Mantener estado inicial en caso de error
      setEstadisticas({
        resumenGeneral: {
          totalTurnos: 0,
          totalConsultores: 0,
          turnosPresentes: 0,
          turnosAusentes: 0,
          porcentajeAsistencia: 0,
          promedioRetraso: 0,
          promedioHoras: 0
        },
        asistenciaPorConsultor: {},
        puntualidadPorConsultor: {},
        horasPorConsultor: {},
        observacionesPorConsultor: {},
        tendenciasAsistencia: {}
      });
    } finally {
      setLoading(false);
    }
  };

  const exportarExcel = () => {
    // Convertir datos de estadísticas a formato plano para Excel
    const consultores = Object.entries(estadisticas.asistenciaPorConsultor || {});
    
    const header = ['Consultor', 'Turnos Asignados', 'Turnos Presentes', 'Turnos Ausentes', '% Asistencia', 'Promedio Retraso (min)', 'Horas Totales'];
    const rows = consultores.map(([nombre, datos]) => {
      const porcentajeAsistencia = datos.asignados > 0 ? ((datos.presentes / datos.asignados) * 100).toFixed(1) : 0;
      const puntualidadData = estadisticas.puntualidadPorConsultor[nombre] || [];
      const promedioRetraso = puntualidadData.length > 0 ? 
        (puntualidadData.reduce((sum, p) => sum + p.retraso, 0) / puntualidadData.length).toFixed(1) : 0;
      const horasTotales = estadisticas.horasPorConsultor[nombre] || 0;
      
      return [
        nombre,
        datos.asignados,
        datos.presentes,
        datos.ausentes,
        porcentajeAsistencia + '%',
        promedioRetraso,
        horasTotales.toFixed(1)
      ];
    });

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
    link.download = `estadisticas_asistencia_consultores_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderResumenGeneral = () => (
    <div className="estadisticas-resumen">
      <h3>👥 Resumen de Asistencia</h3>
      <div className="resumen-cards">
        <div className="stat-card">
          <div className="stat-number">{estadisticas.resumenGeneral?.totalConsultores || 0}</div>
          <div className="stat-label">Consultores Activos</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{estadisticas.resumenGeneral?.totalTurnos || 0}</div>
          <div className="stat-label">Total Turnos</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{Math.round(estadisticas.resumenGeneral?.promedioRetraso || 0)}</div>
          <div className="stat-label">Promedio Retraso (min)</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{parseFloat(estadisticas.resumenGeneral?.promedioHoras || 0).toFixed(1)}</div>
          <div className="stat-label">Promedio Horas/Turno</div>
        </div>
      </div>
    </div>
  );

  const renderTablaAsistencia = () => {
    const consultores = Object.entries(estadisticas.asistenciaPorConsultor || {})
      .map(([nombre, datos]) => {
        const porcentajeAsistencia = datos.asignados > 0 ? ((datos.presentes / datos.asignados) * 100).toFixed(1) : 0;
        const puntualidadData = estadisticas.puntualidadPorConsultor[nombre] || [];
        const puntualidadPromedio = puntualidadData.length > 0 
          ? (puntualidadData.reduce((sum, p) => sum + p.retraso, 0) / puntualidadData.length).toFixed(1)
          : 0;
        
        return {
          nombre,
          ...datos,
          porcentajeAsistencia,
          puntualidadPromedio,
          horasTotales: estadisticas.horasPorConsultor[nombre] || 0
        };
      })
      .sort((a, b) => b.porcentajeAsistencia - a.porcentajeAsistencia);

    return (
      <div className="estadisticas-tabla">
        <h4>📊 Estadísticas por Consultor</h4>
        <div className="tabla-container">
          <table>
            <thead>
              <tr>
                <th>Consultor</th>
                <th>Asignados</th>
                <th>Presentes</th>
                <th>Ausentes</th>
                <th>% Asistencia</th>
                <th>Retraso Prom. (min)</th>
                <th>Horas Totales</th>
              </tr>
            </thead>
            <tbody>
              {consultores.map((consultor, index) => (
                <tr key={consultor.nombre}>
                  <td>
                    <span className="ranking">#{index + 1}</span>
                    {consultor.nombre}
                  </td>
                  <td>{consultor.asignados}</td>
                  <td className="presente">{consultor.presentes}</td>
                  <td className="ausente">{consultor.ausentes}</td>
                  <td>
                    <div className="porcentaje-bar">
                      <div 
                        className="porcentaje-fill" 
                        style={{ 
                          width: `${consultor.porcentajeAsistencia}%`,
                          background: consultor.porcentajeAsistencia >= 90 ? 
                            'linear-gradient(90deg, #10b981 0%, #059669 100%)' :
                            consultor.porcentajeAsistencia >= 75 ?
                            'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)' :
                            'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                        }}
                      ></div>
                      <span>{consultor.porcentajeAsistencia}%</span>
                    </div>
                  </td>
                  <td className={consultor.puntualidadPromedio <= 0 ? 'puntual' : consultor.puntualidadPromedio <= 5 ? 'aceptable' : 'tarde'}>
                    {consultor.puntualidadPromedio}
                  </td>
                  <td>{parseFloat(consultor.horasTotales).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderObservaciones = () => {
    const observacionesRecientes = Object.entries(estadisticas.observacionesPorConsultor || {})
      .flatMap(([nombre, observaciones]) => 
        observaciones.map(obs => ({ nombre, ...obs }))
      )
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .slice(0, 10);

    if (observacionesRecientes.length === 0) return null;

    return (
      <div className="estadisticas-tabla">
        <h4>📝 Observaciones Recientes</h4>
        <div className="tabla-container">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Consultor</th>
                <th>Observación</th>
              </tr>
            </thead>
            <tbody>
              {observacionesRecientes.map((obs, index) => (
                <tr key={index}>
                  <td>{obs.fecha}</td>
                  <td>{obs.nombre}</td>
                  <td className="observacion-text">{obs.observacion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderGraficoAsistencia = () => {
    const consultores = Object.entries(estadisticas.asistenciaPorConsultor || {});
    
    if (consultores.length === 0) {
      return (
        <div className="no-data-message">
          <p>No hay datos disponibles para mostrar</p>
        </div>
      );
    }

    // Preparar datos para gráfico de asistencia vs ausencias
    const datosAsistencia = consultores.map(([nombre, datos]) => {
      const porcentajeAsistencia = datos.asignados > 0 ? ((datos.presentes / datos.asignados) * 100) : 0;
      const puntualidadData = estadisticas.puntualidadPorConsultor[nombre] || [];
      const promedioRetraso = puntualidadData.length > 0 ? 
        (puntualidadData.reduce((sum, p) => sum + p.retraso, 0) / puntualidadData.length) : 0;
      const horasTotales = estadisticas.horasPorConsultor[nombre] || 0;
      
      let rendimiento = 'bajo';
      if (porcentajeAsistencia >= 90) rendimiento = 'alto';
      else if (porcentajeAsistencia >= 75) rendimiento = 'medio';
      
      return {
        nombre,
        presentes: datos.presentes || 0,
        ausentes: datos.ausentes || 0,
        asignados: datos.asignados || 0,
        porcentaje: porcentajeAsistencia,
        rendimiento,
        promedioRetraso,
        horasTotales
      };
    }).sort((a, b) => b.porcentaje - a.porcentaje);

    // Calcular escala máxima para normalizar las barras
    const maxPorcentaje = Math.max(...datosAsistencia.map(d => d.porcentaje));
    const maxTurnos = Math.max(...datosAsistencia.map(d => Math.max(d.presentes, d.ausentes)));

    return (
      <div className="asistencia-charts-container">
        {/* Estadísticas Generales */}
        <div className="chart-summary">
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-value">{datosAsistencia.length}</span>
              <span className="stat-label">Consultores</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{datosAsistencia.reduce((sum, d) => sum + d.asignados, 0)}</span>
              <span className="stat-label">Turnos Totales</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{((datosAsistencia.reduce((sum, d) => sum + d.porcentaje, 0) / datosAsistencia.length) || 0).toFixed(1)}%</span>
              <span className="stat-label">Promedio Asistencia</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{Math.round(datosAsistencia.reduce((sum, d) => sum + d.promedioRetraso, 0) / datosAsistencia.length || 0)}</span>
              <span className="stat-label">Retraso Promedio (min)</span>
            </div>
          </div>
        </div>

        {/* Gráfico de Asistencia por Consultor */}
        <div className="chart-section">
          <h5>📈 Asistencia por Consultor</h5>
          <div className="chart-scale">
            <span className="scale-label">0%</span>
            <span className="scale-label">25%</span>
            <span className="scale-label">50%</span>
            <span className="scale-label">75%</span>
            <span className="scale-label">100%</span>
          </div>
          <div className="asistencia-chart-wrapper">
            {datosAsistencia.map((consultor, index) => (
              <div key={consultor.nombre} className="asistencia-chart-bar" style={{animationDelay: `${index * 100}ms`}}>
                <div className="asistencia-bar-container">
                  <div 
                    className={`asistencia-bar-fill ${consultor.rendimiento}`}
                    style={{height: `${Math.max(consultor.porcentaje * 1.5, 8)}px`}}
                    title={`${consultor.nombre}
Asistencia: ${consultor.porcentaje.toFixed(1)}%
Turnos: ${consultor.presentes}/${consultor.asignados}
Retraso promedio: ${consultor.promedioRetraso.toFixed(1)} min
Horas totales: ${consultor.horasTotales.toFixed(1)}h`}
                  >
                    <span className="bar-value">{consultor.porcentaje.toFixed(0)}%</span>
                  </div>
                </div>
                <span className="asistencia-chart-label">{consultor.nombre.split(' ')[0]}</span>
              </div>
            ))}
          </div>
          <div className="asistencia-legend">
            <div className="legend-item">
              <span className="legend-color alto"></span>
              <span>Excelente (≥90%)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color medio"></span>
              <span>Bueno (75-90%)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color bajo"></span>
              <span>Necesita mejorar (&lt;75%)</span>
            </div>
          </div>
        </div>

        {/* Gráfico comparativo Presentes vs Ausentes */}
        <div className="chart-section">
          <h5>⚖️ Presentes vs Ausentes</h5>
          <div className="chart-scale">
            <span className="scale-label">0</span>
            <span className="scale-label">{Math.round(maxTurnos * 0.25)}</span>
            <span className="scale-label">{Math.round(maxTurnos * 0.5)}</span>
            <span className="scale-label">{Math.round(maxTurnos * 0.75)}</span>
            <span className="scale-label">{maxTurnos}</span>
          </div>
          <div className="comparativo-chart-wrapper">
            {datosAsistencia.slice(0, 8).map((consultor, index) => (
              <div key={consultor.nombre} className="comparativo-chart-group" style={{animationDelay: `${index * 120}ms`}}>
                <div className="comparativo-bars">
                  <div className="bar-group">
                    <div 
                      className="comparativo-bar presentes"
                      style={{height: `${Math.max((consultor.presentes / maxTurnos) * 150, 8)}px`}}
                      title={`Presentes: ${consultor.presentes}`}
                    >
                      <span className="bar-value">{consultor.presentes}</span>
                    </div>
                    <span className="bar-label">P</span>
                  </div>
                  <div className="bar-group">
                    <div 
                      className="comparativo-bar ausentes"
                      style={{height: `${Math.max((consultor.ausentes / maxTurnos) * 150, 8)}px`}}
                      title={`Ausentes: ${consultor.ausentes}`}
                    >
                      <span className="bar-value">{consultor.ausentes}</span>
                    </div>
                    <span className="bar-label">A</span>
                  </div>
                </div>
                <span className="comparativo-chart-label">{consultor.nombre.split(' ')[0]}</span>
              </div>
            ))}
          </div>
          <div className="comparativo-legend">
            <div className="legend-item">
              <span className="legend-color presentes"></span>
              <span>Turnos Presentes (P)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color ausentes"></span>
              <span>Turnos Ausentes (A)</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando estadísticas de asistencia...</p>
      </div>
    );
  }

  return (
    <div className="estadisticas-container">
      <div className="estadisticas-header">
        <h2>👥 Estadísticas de Asistencia de Consultores</h2>
        <p className="estadisticas-subtitle">
          Panel de análisis de asistencia y puntualidad de consultores basado en marcado de turnos
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
          <div className="filtro-item">
            <label>Consultor:</label>
            <select
              value={filtros.consultor}
              onChange={(e) => setFiltros(prev => ({ ...prev, consultor: e.target.value }))}
            >
              <option value="todos">Todos los consultores</option>
              {Object.keys(estadisticas.asistenciaPorConsultor || {}).map(nombre => (
                <option key={nombre} value={nombre}>{nombre}</option>
              ))}
            </select>
          </div>
          <button className="export-button" onClick={exportarExcel}>
            <i className="fas fa-file-excel"></i> Exportar a Excel
          </button>
        </div>
      </div>

      {renderResumenGeneral()}
      {renderTablaAsistencia()}
      {renderObservaciones()}

      <div className="graficos-asistencia-section">
        <div className="graficos-asistencia-header">
          <h3>📊 Análisis Visual de Asistencia</h3>
        </div>
        <div className="graficos-asistencia-content">
          {renderGraficoAsistencia()}
        </div>
      </div>
    </div>
  );
};

export default EstadisticasAsistencia;
