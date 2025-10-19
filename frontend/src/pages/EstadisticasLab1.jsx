import { useState, useEffect } from 'react';
import { getAllReservations } from '@services/reservation.service.js';
import EstadisticasDetalladas from '../components/EstadisticasDetalladas';
import '@styles/estadisticas.css';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';

// Estilos en línea para los botones
const buttonStyles = {
  exportButtons: {
    display: 'flex',
    gap: '0.5rem',
    marginLeft: 'auto'
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    fontWeight: '500',
    cursor: 'pointer',
    minWidth: '100px',
    color: 'white',
  },
  excelButton: {
    backgroundColor: '#217346'
  },
  pdfButton: {
    backgroundColor: '#dc3545'
  }
};

const EstadisticasLab1 = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: new Date().toISOString().split('T')[0]
  });
  const [estadisticas, setEstadisticas] = useState({
    usoEquipos: {},
    horariosActivos: {},
    diasActivos: {},
    fechasActivas: {},
    totalReservas: 0,
    equiposUtilizados: 0,
    equiposTotales: 40,
    bloquesPorDia: 17,
    capacidadDiaria: 680 // 40 equipos * 17 bloques
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
      // Filtrar solo las reservas del Laboratorio 1 (PCs 1-40)
      const reservasLab1 = Array.isArray(data) ? 
        data.filter(r => r.labId === 1 || (r.pcId >= 1 && r.pcId <= 40)) : [];
      setReservations(reservasLab1);
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
      const fechaInicio = new Date(filtros.fechaInicio);
      fechaInicio.setHours(0, 0, 0, 0);
      filtradas = filtradas.filter(r => {
        const fechaReserva = new Date(r.fechaReserva);
        return fechaReserva >= fechaInicio;
      });
    }
    if (filtros.fechaFin) {
      const fechaFin = new Date(filtros.fechaFin);
      fechaFin.setHours(23, 59, 59, 999);
      filtradas = filtradas.filter(r => {
        const fechaReserva = new Date(r.fechaReserva);
        return fechaReserva <= fechaFin;
      });
    }

    return filtradas;
  };

  const calcularEstadisticas = () => {
    const reservasFiltradas = filtrarReservas(reservations);
    
    const usoEquipos = {};
    const horariosActivos = {};
    const diasActivos = {};
    const fechasActivas = {};
    
    reservasFiltradas.forEach(reserva => {
      // Contar equipos
      const pcKey = `PC ${reserva.pcId}`;
      usoEquipos[pcKey] = (usoEquipos[pcKey] || 0) + 1;

      // Contar horarios
      horariosActivos[reserva.horaInicio] = (horariosActivos[reserva.horaInicio] || 0) + 1;

      // Contar fechas específicas
      fechasActivas[reserva.fechaReserva] = (fechasActivas[reserva.fechaReserva] || 0) + 1;

      // Contar días de la semana
      const fecha = new Date(reserva.fechaReserva);
      const dia = fecha.toLocaleDateString('es-ES', { weekday: 'long' });
      diasActivos[dia] = (diasActivos[dia] || 0) + 1;
    });    const equiposUtilizados = Object.keys(usoEquipos).length;

    setEstadisticas({
      usoEquipos,
      horariosActivos,
      diasActivos,
      fechasActivas,
      totalReservas: reservasFiltradas.length,
      equiposUtilizados,
      equiposTotales: 40,
      bloquesPorDia: 17,
      capacidadDiaria: 680
    });
  };

  const exportarPDF = async () => {
    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true,
        floatPrecision: 16,
        compress: false,
        font: 'courier'
      });

      let yPos = 15;

      // Configuración del título principal
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.setLanguage("es");
      // Escribir título en negrita
      doc.text('Resumen Laboratorio 1', doc.internal.pageSize.width / 2, yPos, {
        align: 'center',
        baseline: 'middle',
        renderingMode: 'fill',
        charSpace: 0
      });
      yPos += 15;

      // Resumen Principal
      doc.setFontSize(14);
      yPos += 10;

      const resumenPrincipal = [
        ['Total Reservas', estadisticas.totalReservas],
        ['Equipos Utilizados', `${estadisticas.equiposUtilizados}/${estadisticas.equiposTotales}`],
        ['% Equipos Utilizados', `${((estadisticas.equiposUtilizados / estadisticas.equiposTotales) * 100).toFixed(1)}%`],
        ['% Uso Diario', `${((estadisticas.totalReservas / estadisticas.capacidadDiaria) * 100).toFixed(1)}%`]
      ];

    // No necesitamos esta primera tabla, ya que usaremos resumenPrincipal directamente

    // Resumen Principal
    autoTable(doc, {
      startY: yPos,
      head: [['Metrica', 'Valor']],
      body: resumenPrincipal,
      theme: 'grid',
      headStyles: { 
        fillColor: [3, 49, 99],
        textColor: [255, 255, 255],
        halign: 'center'
      },
      styles: { 
        fontSize: 10,
        font: 'courier',
        halign: 'left'
      },
      margin: { left: 14 },
      willDrawCell: function(data) {
        const td = data.cell.raw;
        if (td && typeof td === 'string') {
          data.cell.text = td.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        }
      }
    });
    yPos = doc.lastAutoTable.finalY + 15;

    // Tablas de Frecuencia
    const tablasPrincipales = [
      {
        titulo: 'PC Equipos Más Utilizados',
        data: Object.entries(estadisticas.usoEquipos).map(([pc, freq]) => {
          const total = Object.values(estadisticas.usoEquipos).reduce((sum, val) => sum + val, 0);
          const porcentaje = total > 0 ? ((freq / total) * 100).toFixed(1) : '0.0';
          return [
            `PC ${pc}`,
            freq,
            `${porcentaje}%`
          ];
        })
      },
      {
        titulo: 'Hora Horarios Más Activos',
        data: Object.entries(estadisticas.horariosActivos).map(([hora, freq]) => {
          const total = Object.values(estadisticas.horariosActivos).reduce((sum, val) => sum + val, 0);
          const porcentaje = total > 0 ? ((freq / total) * 100).toFixed(1) : '0.0';
          return [
            hora,
            freq,
            `${porcentaje}%`
          ];
        })
      },
      {
        titulo: 'Día Días Más Activos',
        data: Object.entries(estadisticas.diasActivos).map(([dia, freq]) => {
          const total = Object.values(estadisticas.diasActivos).reduce((sum, val) => sum + val, 0);
          const porcentaje = total > 0 ? ((freq / total) * 100).toFixed(1) : '0.0';
          return [
            dia,
            freq,
            `${porcentaje}%`
          ];
        })
      }
    ];

    // Imprimir tablas principales
    doc.setFontSize(12);
    tablasPrincipales.forEach(tabla => {
      doc.text(tabla.titulo, 14, yPos);
      autoTable(doc, {
        startY: yPos + 5,
        head: [['Item', 'Frecuencia', 'Porcentaje']],
        body: tabla.data,
        theme: 'grid',
        headStyles: { fillColor: [3, 49, 99] },
        styles: { fontSize: 10 },
        margin: { left: 14 }
      });
      yPos = doc.lastAutoTable.finalY + 15;
    });

    // Estadísticas Detalladas
    doc.addPage();
    yPos = 15;
    
    // Configuración del título de estadísticas detalladas
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    const tituloDetalladas = 'Estadisticas Detalladas';
    doc.text(tituloDetalladas, doc.internal.pageSize.width / 2, yPos, {
      align: 'center',
      baseline: 'middle'
    });
    yPos += 20;

      const tablasDetalladas = [
      {
        titulo: 'Carreras mas Frecuentes',
        columnas: [['Carrera', 'Total de Reservas', 'Proporción de Uso']],
        data: getEstadisticasAvanzadas().carreraStats
      },
      {
        titulo: 'Meses mas Activos',
        columnas: [['Mes', 'Reservas Realizadas', 'Nivel de Actividad']],
        data: getEstadisticasAvanzadas().mesStats
      },
      {
        titulo: 'Usuarios mas Frecuentes',
        columnas: [['RUT Usuario', 'N° de Reservas', 'Frecuencia de Uso']],
        data: getEstadisticasAvanzadas().usuarioStats
      },
      {
        titulo: 'Laboratorios mas Utilizados',
        columnas: [['Laboratorio', 'Total de Sesiones', 'Tasa de Ocupación']],
        data: getEstadisticasAvanzadas().labStats
      },
      {
        titulo: 'Horarios mas Solicitados',
        columnas: [['Bloque Horario', 'N° de Reservas', 'Demanda del Horario']],
        data: getEstadisticasAvanzadas().horarioStats
      }
    ];    // Imprimir tablas detalladas
    doc.setFontSize(12);
    tablasDetalladas.forEach(tabla => {
      doc.text(tabla.titulo, 14, yPos);
        const tableData = Object.entries(tabla.data).map(([item, { cantidad, porcentaje }]) => [
        item,
        cantidad,
        `${porcentaje.toFixed(1)}%`
      ]);
      autoTable(doc, {
        startY: yPos + 5,
        head: tabla.columnas,
        body: tableData.map(([item, cantidad, porcentaje]) => {
          const valor = parseFloat(porcentaje);
          let descripcion;
          
          if (valor === 100) {
            descripcion = "Uso Exclusivo";
          } else if (valor >= 75) {
            descripcion = "Uso Muy Alto";
          } else if (valor >= 50) {
            descripcion = "Uso Alto";
          } else if (valor >= 25) {
            descripcion = "Uso Moderado";
          } else {
            descripcion = "Uso Bajo";
          }

          return [
            item,
            `${cantidad} ${cantidad === 1 ? 'vez' : 'veces'}`,
            `${descripcion} (${porcentaje})`
          ];
        }),
        theme: 'grid',
        headStyles: { 
          fillColor: [3, 49, 99],
          textColor: [255, 255, 255],
          halign: 'center',
          fontSize: 11,
          font: 'helvetica',
          fontStyle: 'bold'
        },
        styles: { 
          fontSize: 10,
          font: 'helvetica',
          halign: 'left'
        },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 40 },
          2: { cellWidth: 60 }
        },
        margin: { left: 14 },
        willDrawCell: function(data) {
          const td = data.cell.raw;
          if (td && typeof td === 'string') {
            data.cell.text = td.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          }
        }
      });
      yPos = doc.lastAutoTable.finalY + 15;
    });

    // Guardar el PDF
    doc.save(`estadisticas_laboratorio_1_${new Date().toISOString().split('T')[0]}.pdf`);

    Swal.fire({
      icon: 'success',
      title: 'PDF Generado',
      text: 'El archivo PDF se ha descargado correctamente',
      timer: 2000,
      showConfirmButton: false
    });
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al generar el PDF',
        timer: 2000,
        showConfirmButton: false
      });
    }
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
    link.download = `estadisticas_laboratorio_1_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

    const renderResumenGeneral = () => (
      <div className="estadisticas-resumen">
        <h3>Resumen General</h3>
        <div className="resumen-cards">
          <div className="stat-card">
            <div className="stat-number">{estadisticas.totalReservas}</div>
            <div className="stat-label">Total Reservas</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{estadisticas.equiposUtilizados}/40</div>
            <div className="stat-label">Equipos Utilizados</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{Math.round((estadisticas.equiposUtilizados / 40) * 100)}%</div>
            <div className="stat-label">% Equipos Utilizados</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{Math.round((estadisticas.totalReservas / estadisticas.capacidadDiaria) * 100)}%</div>
            <div className="stat-label">% Uso Diario</div>
          </div>
        </div>
      </div>
    );  const getEstadisticasAvanzadas = () => {
    const reservasFiltradas = filtrarReservas(reservations);
    
    const stats = {
      carreraStats: {},
      mesStats: {},
      usuarioStats: {},
      labStats: {},
      horarioStats: {},
      fechasStats: {}
    };

    reservasFiltradas.forEach(reserva => {
      // Carreras
      stats.carreraStats[reserva.carrera] = stats.carreraStats[reserva.carrera] || { cantidad: 0 };
      stats.carreraStats[reserva.carrera].cantidad++;

      // Meses
      const mes = new Date(reserva.fechaReserva).toLocaleString('es-ES', { month: 'long' });
      stats.mesStats[mes] = stats.mesStats[mes] || { cantidad: 0 };
      stats.mesStats[mes].cantidad++;

      // Usuarios
      stats.usuarioStats[reserva.rut] = stats.usuarioStats[reserva.rut] || { cantidad: 0 };
      stats.usuarioStats[reserva.rut].cantidad++;

      // Laboratorios
      const lab = `Laboratorio ${Math.floor((reserva.pcId - 1) / 20) + 1}`;
      stats.labStats[lab] = stats.labStats[lab] || { cantidad: 0 };
      stats.labStats[lab].cantidad++;

      // Horarios
      stats.horarioStats[reserva.horaInicio] = stats.horarioStats[reserva.horaInicio] || { cantidad: 0 };
      stats.horarioStats[reserva.horaInicio].cantidad++;

      // Fechas específicas
      const fecha = new Date(reserva.fechaReserva).toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      stats.fechasStats[fecha] = stats.fechasStats[fecha] || { cantidad: 0 };
      stats.fechasStats[fecha].cantidad++;
    });

    // Calcular porcentajes
    const calcularPorcentajes = (obj) => {
      const total = Object.values(obj).reduce((sum, { cantidad }) => sum + cantidad, 0);
      if (total === 0) return;
      
      Object.keys(obj).forEach(key => {
        obj[key].porcentaje = (obj[key].cantidad / total) * 100;
      });
    };

    calcularPorcentajes(stats.carreraStats);
    calcularPorcentajes(stats.mesStats);
    calcularPorcentajes(stats.usuarioStats);
    calcularPorcentajes(stats.labStats);
    calcularPorcentajes(stats.horarioStats);
    calcularPorcentajes(stats.fechasStats);

    return stats;
  };

  const renderTablaFrecuencia = (titulo, datos, tipo) => {
    const datosOrdenados = Object.entries(datos)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    // Definir iconos para cada tipo de datos
    const iconos = {
      'PC': '💻',
      'Hora': '⏰',
      'Día': '📅'
    };

    return (
      <div className="estadisticas-tabla">
        <h4>{iconos[tipo]} {titulo}</h4>
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
              {datosOrdenados.map(([item, count], index) => {
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

  const renderGraficoBarras = () => {
    if (!estadisticas.usoEquipos || Object.keys(estadisticas.usoEquipos).length === 0) {
      return (
        <div className="no-data-message">
          <p>No hay datos disponibles para mostrar</p>
        </div>
      );
    }

    // Calcular datos para cada equipo (PC 1-40)
    const equiposData = [];
    for (let i = 1; i <= 40; i++) {
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
      <div className="lab1-chart-container-vertical">
        <div className="lab1-chart-wrapper-vertical">
          {equiposData.map((item, index) => (
            <div key={item.pc} className="lab1-chart-bar-vertical" style={{animationDelay: `${index * 25}ms`}}>
              <div 
                className={`lab1-chart-bar-fill-vertical ${item.rendimiento}`}
                style={{height: `${Math.min(Math.max(item.porcentaje * 3, 2), 200)}px`}}
                title={`${item.pc}: ${item.reservas} reservas (${item.porcentaje.toFixed(1)}%)`}
              ></div>
              <span className="lab1-chart-label-vertical">{item.pc.replace('PC ', '')}</span>
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando estadísticas del Laboratorio 1...</p>
      </div>
    );
  }

  return (
    <div className="estadisticas-container">
      <div className="estadisticas-header">
        <h2>Reportes Laboratorio 1</h2>
        <p className="estadisticas-subtitle">
          Análisis específico del uso de equipos en el Laboratorio 1 (PCs 1-40)
        </p>
      </div>

      <div className="filtros-container">
        <h3>Filtros de Análisis</h3>
        <div className="filtros-form shadow-sm">
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
          <div style={buttonStyles.exportButtons}>
            <button 
              onClick={exportarExcel}
              style={{...buttonStyles.button, ...buttonStyles.excelButton}}
            >
              <i className="fas fa-file-excel"></i> Excel
            </button>
            <button 
              onClick={exportarPDF}
              style={{...buttonStyles.button, ...buttonStyles.pdfButton}}
            >
              <i className="fas fa-file-pdf"></i> PDF
            </button>
          </div>
        </div>
      </div>

      {renderResumenGeneral()}

      <div className="estadisticas-seccion">
        <h3 className="seccion-titulo">📈 Reporte Detallado</h3>
        <div className="estadisticas-grid">
          <div className="estadistica-card">
            <h4 className="tabla-titulo">💻 Equipos Más Utilizados</h4>
            <div className="tabla-container">
              <table className="tabla-nueva">
                <thead>
                  <tr>
                    <th>Equipo</th>
                    <th>Frecuencia</th>
                    <th>Porcentaje de Uso</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(estadisticas.usoEquipos).length > 0 ? (
                    Object.entries(estadisticas.usoEquipos)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([pc, cantidad]) => {
                        const porcentaje = (cantidad / estadisticas.totalReservas) * 100;
                        return (
                          <tr key={pc}>
                            <td>{pc}</td>
                            <td>{cantidad} {cantidad === 1 ? 'vez' : 'veces'}</td>
                            <td>
                              <div className="nivel-uso">
                                <div 
                                  className="nivel-barra"
                                  style={{ width: `${porcentaje}%` }}
                                ></div>
                                <span>{porcentaje.toFixed(1)}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  ) : (
                    <tr>
                      <td colSpan="3" className="no-data-message">
                        No figura información
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="estadistica-card">
            <h4 className="tabla-titulo">⏰ Horarios Más Activos</h4>
            <div className="tabla-container">
              <table className="tabla-nueva">
                <thead>
                  <tr>
                    <th>Horario</th>
                    <th>Frecuencia</th>
                    <th>Porcentaje de Uso</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(estadisticas.horariosActivos).length > 0 ? (
                    Object.entries(estadisticas.horariosActivos)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([hora, cantidad]) => {
                        const porcentaje = (cantidad / estadisticas.totalReservas) * 100;
                        return (
                          <tr key={hora}>
                            <td>{hora}</td>
                            <td>{cantidad} {cantidad === 1 ? 'reserva' : 'reservas'}</td>
                            <td>
                              <div className="nivel-uso">
                                <div 
                                  className="nivel-barra"
                                  style={{ width: `${porcentaje}%` }}
                                ></div>
                                <span>{porcentaje.toFixed(1)}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  ) : (
                    <tr>
                      <td colSpan="3" className="no-data-message">
                        No figura información
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="estadistica-card">
            <h4 className="tabla-titulo">📅 Días Más Activos</h4>
            <div className="tabla-container">
              <table className="tabla-nueva">
                <thead>
                  <tr>
                    <th>Día</th>
                    <th>Frecuencia</th>
                    <th>Porcentaje de Uso</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(estadisticas.diasActivos).length > 0 ? (
                    Object.entries(estadisticas.diasActivos)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([dia, cantidad]) => {
                        const porcentaje = (cantidad / estadisticas.totalReservas) * 100;
                        return (
                          <tr key={dia}>
                            <td>{dia}</td>
                            <td>{cantidad} {cantidad === 1 ? 'reserva' : 'reservas'}</td>
                            <td>
                              <div className="nivel-uso">
                                <div 
                                  className="nivel-barra"
                                  style={{ width: `${porcentaje}%` }}
                                ></div>
                                <span>{porcentaje.toFixed(1)}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  ) : (
                    <tr>
                      <td colSpan="3" className="no-data-message">
                        No figura información
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="estadisticas-grid">
          {Object.entries(getEstadisticasAvanzadas()).map(([key, data]) => {
            const titulo = {
              carreraStats: '🎓 Carreras Más Activas',
              mesStats: '📅 Meses con Mayor Actividad',
              usuarioStats: '👥 Usuarios Más Frecuentes',
              labStats: '🖥️ Uso por Laboratorio',
              horarioStats: '⏰ Horarios de Alta Demanda',
              fechasStats: '📆 Fechas Más Ocupadas'
            }[key];

            const columnas = {
              carreraStats: ['Carrera', 'Total de Reservas', 'Nivel de Uso'],
              mesStats: ['Mes', 'Reservas Realizadas', 'Nivel de Actividad'],
              usuarioStats: ['RUT Usuario', 'N° de Reservas', 'Frecuencia de Uso'],
              labStats: ['Laboratorio', 'Total de Sesiones', 'Tasa de Ocupación'],
              horarioStats: ['Bloque Horario', 'N° de Reservas', 'Demanda del Horario'],
              fechasStats: ['Fecha', 'N° de Reservas', 'Nivel de Ocupación']
            }[key];

            return (
              <div key={key} className="estadistica-card">
                <h4 className="tabla-titulo">{titulo}</h4>
                <div className="tabla-container">
                  <table className="tabla-nueva">
                    <thead>
                      <tr>
                        {columnas.map((col, index) => (
                          <th key={index}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
      {Object.entries(data).length > 0 ? (
                        Object.entries(data).map(([item, { cantidad, porcentaje }]) => {
                          let nivelClase = '';
                          let nivelTexto = '';

                          if (porcentaje >= 0.8) {
                            nivelClase = 'alto';
                            nivelTexto = 'Uso Muy Alto';
                          } else if (porcentaje >= 0.6) {
                            nivelClase = 'medio';
                            nivelTexto = 'Uso Alto';
                          } else if (porcentaje >= 0.4) {
                            nivelClase = 'medio';
                            nivelTexto = 'Uso Medio';
                          } else {
                            nivelClase = 'bajo';
                            nivelTexto = 'Uso Bajo';
                          }

                          return (
                            <tr key={item}>
                              <td>{item}</td>
                              <td>{cantidad} {cantidad === 1 ? 'reserva' : 'reservas'}</td>
                              <td>
                                <div className="nivel-uso">
                                  <div 
                                    className={`nivel-barra ${nivelClase}`}
                                    style={{ width: `${porcentaje}%` }}
                                    title={nivelTexto}
                                  ></div>
                                  <span>{porcentaje.toFixed(1)}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="3" className="no-data-message">
                            No figura información
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EstadisticasLab1;
