import { useState, useEffect } from 'react';
import { getAllReservations } from '@services/reservation.service.js';
import '@styles/estadisticas.css';

const Estadisticas = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    laboratorio: 'todos'
  });
  const [estadisticas, setEstadisticas] = useState({
    usoEquipos: {},
    horariosActivos: {},
    diasActivos: {},
    laboratoriosdemanda: {},
    totalReservas: 0,
    equiposUtilizados: 0,
    equiposTotales: 80, // Lab1: 40, Lab2: 20, Lab3: 20
    equiposPorLab: { 1: 40, 2: 20, 3: 20 },
    bloquesPorDia: 17, // 17 bloques horarios por día
    capacidadDiaria: 1360 // 40*17 + 20*17 + 20*17 = 1360 reservas máximas por día
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (reservations.length > 0) {
      calcularEstadisticas();
    }
  }, [reservations, filtros]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const data = await getAllReservations();
      setReservations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar reservas:', error);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  const filtrarReservas = (reservas) => {
    let filtradas = [...reservas];

    // Filtrar por fechas
    if (filtros.fechaInicio) {
      filtradas = filtradas.filter(r => r.fechaReserva >= filtros.fechaInicio);
    }
    if (filtros.fechaFin) {
      filtradas = filtradas.filter(r => r.fechaReserva <= filtros.fechaFin);
    }

    // Filtrar por laboratorio
    if (filtros.laboratorio !== 'todos') {
      const labId = parseInt(filtros.laboratorio);
      filtradas = filtradas.filter(r => r.labId === labId);
    }

    return filtradas;
  };

  const calcularEstadisticas = () => {
    const reservasFiltradas = filtrarReservas(reservations);
    
    // Inicializar contadores
    const usoEquipos = {};
    const horariosActivos = {};
    const diasActivos = {};
    const laboratoriosdemanda = { 1: 0, 2: 0, 3: 0 };
    
    // Procesar cada reserva
    reservasFiltradas.forEach(reserva => {
      // Excluir reservas de mantenimiento de las estadísticas
      if (reserva.carrera === 'MAINTENANCE') return;

      // Uso por equipo
      const equipoKey = `PC ${reserva.pcId}`;
      usoEquipos[equipoKey] = (usoEquipos[equipoKey] || 0) + 1;

      // Horarios más activos
      const horario = reserva.horaInicio.substring(0, 5);
      horariosActivos[horario] = (horariosActivos[horario] || 0) + 1;

      // Días más activos
      const fecha = new Date(reserva.fechaReserva);
      const nombreDia = fecha.toLocaleDateString('es-ES', { weekday: 'long' });
      diasActivos[nombreDia] = (diasActivos[nombreDia] || 0) + 1;

      // Demanda por laboratorio
      laboratoriosdemanda[reserva.labId] = (laboratoriosdemanda[reserva.labId] || 0) + 1;
    });

    // Equipos únicos utilizados
    const equiposUtilizados = Object.keys(usoEquipos).length;

    setEstadisticas({
      usoEquipos,
      horariosActivos,
      diasActivos,
      laboratoriosdemanda,
      totalReservas: reservasFiltradas.length,
      equiposUtilizados,
      equiposTotales: 80,
      equiposPorLab: { 1: 40, 2: 20, 3: 20 },
      bloquesPorDia: 17,
      capacidadDiaria: 1360
    });
  };

  const exportarExcel = () => {
    const reservasFiltradas = filtrarReservas(reservations);
    
    // Crear datos para Excel
    const header = ['Laboratorio', 'Equipo', 'RUT', 'Carrera', 'Fecha', 'Hora Inicio', 'Hora Fin'];
    const rows = reservasFiltradas.map(reserva => [
      `Laboratorio ${reserva.labId}`,
      `PC ${reserva.pcId}`,
      reserva.rut,
      reserva.carrera,
      reserva.fechaReserva,
      reserva.horaInicio,
      reserva.horaTermino
    ]);

    // Crear tabla HTML para Excel
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
    link.download = `estadisticas_laboratorios_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderResumenGeneral = () => (
    <div className="estadisticas-resumen">
      <h3>📊 Resumen General</h3>
      <div className="resumen-cards">
        <div className="stat-card">
          <div className="stat-number">{estadisticas.totalReservas}</div>
          <div className="stat-label">Total Reservas</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{estadisticas.equiposUtilizados}</div>
          <div className="stat-label">Equipos Utilizados</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{Math.round((estadisticas.equiposUtilizados / estadisticas.equiposTotales) * 100)}%</div>
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
      .slice(0, 10); // Top 10

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

  const renderComparacionLaboratorios = () => {
    const labs = [
      { id: 1, nombre: 'Laboratorio 1', equipos: 40, reservas: estadisticas.laboratoriosdemanda[1] || 0 },
      { id: 2, nombre: 'Laboratorio 2', equipos: 20, reservas: estadisticas.laboratoriosdemanda[2] || 0 },
      { id: 3, nombre: 'Laboratorio 3', equipos: 20, reservas: estadisticas.laboratoriosdemanda[3] || 0 }
    ];

    const maxReservas = Math.max(...labs.map(lab => lab.reservas)) || 1;

    return (
      <div className="estadisticas-tabla">
        <h4>🏆 Comparación de Laboratorios</h4>
        <div className="comparacion-labs">
          {labs.map(lab => {
            const capacidadDiaria = lab.equipos * estadisticas.bloquesPorDia;
            const usoCapacidad = capacidadDiaria > 0 ? ((lab.reservas / capacidadDiaria) * 100).toFixed(1) : 0;
            const usoRelativo = maxReservas > 0 ? (lab.reservas / maxReservas) * 100 : 0;
            
            return (
              <div key={lab.id} className="lab-comparison-card">
                <div className="lab-header">
                  <h5>{lab.nombre}</h5>
                  <span className="lab-equipos">{lab.equipos} equipos</span>
                </div>
                <div className="lab-stats">
                  <div className="lab-stat">
                    <span className="stat-label">Reservas</span>
                    <span className="stat-value">{lab.reservas}</span>
                  </div>
                  <div className="lab-stat">
                    <span className="stat-label">Uso de capacidad</span>
                    <span className="stat-value">{usoCapacidad}%</span>
                  </div>
                  <div className="lab-usage-bar">
                    <div 
                      className="lab-usage-fill"
                      style={{ 
                        width: `${usoRelativo}%`,
                        backgroundColor: lab.id === 1 ? '#10b981' : lab.id === 2 ? '#059669' : '#065f46'
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderLaboratoriosDemanda = () => {
    const labNames = { 
      1: 'Laboratorio 1 (40 PCs)', 
      2: 'Laboratorio 2 (20 PCs)', 
      3: 'Laboratorio 3 (20 PCs)' 
    };
    const labData = Object.entries(estadisticas.laboratoriosdemanda)
      .map(([labId, count]) => {
        const equiposLab = estadisticas.equiposPorLab[labId] || 20;
        const capacidadLab = equiposLab * estadisticas.bloquesPorDia;
        return {
          nombre: labNames[labId],
          cantidad: count,
          porcentaje: estadisticas.totalReservas > 0 
            ? ((count / estadisticas.totalReservas) * 100).toFixed(1)
            : 0,
          usoCapacidad: capacidadLab > 0 
            ? ((count / capacidadLab) * 100).toFixed(1)
            : 0,
          equipos: equiposLab
        };
      })
      .sort((a, b) => b.cantidad - a.cantidad);

    return (
      <div className="estadisticas-tabla">
        <h4>🏛️ Laboratorios con Mayor Demanda</h4>
        <div className="tabla-container">
          <table>
            <thead>
              <tr>
                <th>Laboratorio</th>
                <th>Reservas</th>
                <th>% Total</th>
                <th>% Capacidad</th>
              </tr>
            </thead>
            <tbody>
              {labData.map((lab, index) => (
                <tr key={lab.nombre}>
                  <td>
                    <span className="ranking">#{index + 1}</span>
                    {lab.nombre}
                  </td>
                  <td>{lab.cantidad}</td>
                  <td>
                    <div className="porcentaje-bar">
                      <div 
                        className="porcentaje-fill" 
                        style={{ width: `${lab.porcentaje}%` }}
                      ></div>
                      <span>{lab.porcentaje}%</span>
                    </div>
                  </td>
                  <td>
                    <div className="porcentaje-bar">
                      <div 
                        className="porcentaje-fill" 
                        style={{ 
                          width: `${lab.usoCapacidad}%`,
                          background: lab.usoCapacidad > 80 ? 
                            'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)' :
                            lab.usoCapacidad > 60 ?
                            'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)' :
                            'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                        }}
                      ></div>
                      <span>{lab.usoCapacidad}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando estadísticas...</p>
      </div>
    );
  }

  // Main render
  return (
    <div className="estadisticas-container">
      <div className="estadisticas-header">
        <h2>📈 Módulo de Estadísticas</h2>
        <p className="estadisticas-subtitle">
          Panel de análisis del uso histórico de equipos en laboratorios
        </p>
      </div>

      {/* Filtros */}
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
            <label>Laboratorio:</label>
            <select
              value={filtros.laboratorio}
              onChange={(e) => setFiltros(prev => ({ ...prev, laboratorio: e.target.value }))}
            >
              <option value="todos">Todos los laboratorios</option>
              <option value="1">Laboratorio 1</option>
              <option value="2">Laboratorio 2</option>
              <option value="3">Laboratorio 3</option>
            </select>
          </div>
          <button className="export-button" onClick={exportarExcel}>
            <i className="fas fa-file-excel"></i> Exportar a Excel
          </button>
        </div>
      </div>

      {/* Resumen General */}
      {renderResumenGeneral()}

      {/* Comparación entre laboratorios */}
      {renderComparacionLaboratorios()}

      {/* Estadísticas detalladas */}
      <div className="estadisticas-grid">
        {renderTablaFrecuencia('Equipos Más Utilizados', estadisticas.usoEquipos, '💻')}
        {renderTablaFrecuencia('Horarios Más Activos', estadisticas.horariosActivos, '⏰')}
        {renderTablaFrecuencia('Días Más Activos', estadisticas.diasActivos, '📅')}
        {renderLaboratoriosDemanda()}
      </div>

      {/* Información adicional */}
      <div className="info-adicional">
        <div className="info-card">
          <h4>ℹ️ Información del Sistema</h4>
          <ul>
            <li><strong>Laboratorio 1:</strong> 40 equipos (PC 1-40)</li>
            <li><strong>Laboratorio 2:</strong> 20 equipos (PC 41-60)</li>
            <li><strong>Laboratorio 3:</strong> 20 equipos (PC 61-80)</li>
            <li><strong>Total equipos:</strong> 80 PCs</li>
            <li><strong>Bloques horarios:</strong> 17 por día</li>
            <li><strong>Capacidad diaria total:</strong> 1,360 reservas</li>
            <li><strong>Datos excluidos:</strong> Reservas de mantenimiento</li>
          </ul>
        </div>
        <div className="info-card">
          <h4>🔄 Actualización de Datos</h4>
          <p>Los datos se generan automáticamente desde la bitácora digital en tiempo real.</p>
          <button className="refresh-button" onClick={cargarDatos}>
            <i className="fas fa-sync-alt"></i> Actualizar Datos
          </button>
        </div>
      </div>
    </div>
  );
};

export default Estadisticas;
