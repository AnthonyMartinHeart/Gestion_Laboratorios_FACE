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

const EstadisticasLab3 = () => {
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
  }, [reservations, filtros.fechaInicio, filtros.fechaFin]);

  const renderGraficoBarras = () => {
    if (!estadisticas.usoEquipos || Object.keys(estadisticas.usoEquipos).length === 0) {
      return (
        <div className="no-data-message">
          <p>No hay datos disponibles para mostrar</p>
        </div>
      );
    }

    // Calcular datos para cada equipo (PC 61-80)
    const equiposData = [];
    for (let i = 61; i <= 80; i++) {
      const pcKey = `PC ${i}`;
      const reservas = estadisticas.usoEquipos[pcKey] || 0;
      const porcentaje = ((reservas / (estadisticas.totalReservas || 1)) * 100) * 0.25; // Reducido al 25%
      
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
                style={{height: `${Math.min(Math.max(item.porcentaje * 0.5, 2), 40)}px`}}
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
      // Filtrar solo las reservas del Laboratorio 3 (PCs 61-80)
      const reservasLab3 = Array.isArray(data) ? 
        data.filter(r => r.labId === 3 || (r.pcId >= 61 && r.pcId <= 80)) : [];
      setReservations(reservasLab3);
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
      if (reserva.carrera === 'MAINTENANCE') return;

      const equipoKey = `PC ${reserva.pcId}`;
      usoEquipos[equipoKey] = (usoEquipos[equipoKey] || 0) + 1;

      // Horarios
      const horario = reserva.horaInicio.substring(0, 5);
      horariosActivos[horario] = (horariosActivos[horario] || 0) + 1;

      // Fechas específicas
      fechasActivas[reserva.fechaReserva] = (fechasActivas[reserva.fechaReserva] || 0) + 1;

      const fecha = new Date(reserva.fechaReserva);
      const nombreDia = fecha.toLocaleDateString('es-ES', { weekday: 'long' });
      diasActivos[nombreDia] = (diasActivos[nombreDia] || 0) + 1;
    });

    const equiposUtilizados = Object.keys(usoEquipos).length;

    setEstadisticas({
      usoEquipos,
      horariosActivos,
      diasActivos,
      fechasActivas,
      totalReservas: reservasFiltradas.length,
      equiposUtilizados,
      equiposTotales: 20,
      bloquesPorDia: 17,
      capacidadDiaria: 340
    });
  };

  const exportarPDF = async () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      let yPos = 20;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);

      // Título en negrita
      doc.text('Resumen Laboratorio 3', doc.internal.pageSize.width / 2, yPos, { align: 'center' });
      yPos += 15;

      // Resumen Principal
      yPos += 10;

    const resumenPrincipal = [
      ['Total Reservas', estadisticas.totalReservas],
      ['Equipos Utilizados', `${estadisticas.equiposUtilizados}/${estadisticas.equiposTotales}`],
      ['% Equipos Utilizados', `${((estadisticas.equiposUtilizados / estadisticas.equiposTotales) * 100).toFixed(1)}%`],
      ['% Uso Diario', `${((estadisticas.totalReservas / estadisticas.capacidadDiaria) * 100).toFixed(1)}%`]
    ];

    // Generamos la tabla de resumen principal
    autoTable(doc, {
      startY: yPos,
      head: [['Métrica', 'Valor']],
      body: resumenPrincipal,
      theme: 'grid',
      headStyles: { fillColor: [3, 49, 99] },
      styles: { fontSize: 10 },
      margin: { left: 14 }
    });    // Resumen Principal
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
        font: 'times',
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
        data: Object.entries(estadisticas.usoEquipos).map(([pc, freq]) => [
          `PC ${pc}`,
          freq,
          '100.0%'
        ])
      },
      {
        titulo: 'Hora Horarios Más Activos',
        data: Object.entries(estadisticas.horariosActivos).map(([hora, freq]) => [
          hora,
          freq,
          '100.0%'
        ])
      },
      {
        titulo: 'Día Días Más Activos',
        data: Object.entries(estadisticas.diasActivos).map(([dia, freq]) => [
          dia,
          freq,
          '100.0%'
        ])
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
        titulo: 'Carreras que Utilizan el Laboratorio',
        columnas: [['Carrera', 'Reservas Totales', 'Nivel de Uso']],
        data: getEstadisticasAvanzadas().carreraStats
      },
      {
        titulo: 'Actividad por Mes',
        columnas: [['Mes', 'N° de Reservas', 'Nivel de Actividad']],
        data: getEstadisticasAvanzadas().mesStats
      },
      {
        titulo: 'Estudiantes Frecuentes',
        columnas: [['RUT', 'Veces Reservado', 'Frecuencia']],
        data: getEstadisticasAvanzadas().usuarioStats
      },
      {
        titulo: 'Uso de Laboratorios',
        columnas: [['Laboratorio', 'Sesiones', 'Ocupación']],
        data: getEstadisticasAvanzadas().labStats
      },
      {
        titulo: 'Horarios Preferidos',
        columnas: [['Hora', 'Reservas', 'Popularidad']],
        data: getEstadisticasAvanzadas().horarioStats
      },
      {
        titulo: 'Fechas Más Ocupadas',
        columnas: [['Fecha', 'N° de Reservas', 'Nivel de Ocupación']],
        data: getEstadisticasAvanzadas().fechasStats
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
          let nivelUso;
          
          if (valor === 100) {
            nivelUso = "Uso Total";
          } else if (valor >= 75) {
            nivelUso = "Uso Intensivo";
          } else if (valor >= 50) {
            nivelUso = "Uso Frecuente";
          } else if (valor >= 25) {
            nivelUso = "Uso Regular";
          } else {
            nivelUso = "Uso Ocasional";
          }

          return [
            item,
            `${cantidad} ${cantidad === 1 ? 'reserva' : 'reservas'}`,
            `${nivelUso} (${porcentaje})`
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
        margin: { left: 14 }
      });
      yPos = doc.lastAutoTable.finalY + 15;
    });

    // Guardar el PDF
    doc.save(`estadisticas_laboratorio_3_${new Date().toISOString().split('T')[0]}.pdf`);

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
    link.download = `estadisticas_laboratorio_3_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderResumenGeneral = () => (
    <div className="estadisticas-resumen">
      <h3>📊 Resumen Laboratorio 3</h3>
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

  const getEstadisticasAvanzadas = () => {
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
      const lab = `Laboratorio ${Math.floor((reserva.pcId - 61) / 20) + 3}`;
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

  const renderTablaFrecuencia = () => { };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando estadísticas del Laboratorio 3...</p>
      </div>
    );
  }

  return (
    <div className="estadisticas-container">
      <div className="estadisticas-header">
        <h2>Reportes Laboratorio 3</h2>
        <p className="estadisticas-subtitle">
          Análisis específico del uso de equipos en el Laboratorio 3 (PCs 61-80)
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
        <h3>📈 Reportes Detallados</h3>
        <EstadisticasDetalladas 
          reservations={filtrarReservas(reservations)} 
          fechaInicio={filtros.fechaInicio}
          fechaFin={filtros.fechaFin}
        />
      </div>
    </div>
  );
};

export default EstadisticasLab3;
