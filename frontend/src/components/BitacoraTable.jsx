import { useState } from 'react';
import '@styles/bitacoras.css';

const horas = [
  "08:10 - 08:50", "08:50 - 09:30", "09:40 - 10:20", "10:20 - 11:00",
  "11:10 - 11:50", "11:50 - 12:30", "12:40 - 13:20", "13:20 - 14:00",
  "14:10 - 14:50", "14:50 - 15:30", "15:40 - 16:20", "16:20 - 17:00",
  "17:10 - 17:50", "17:50 - 18:30", "18:40 - 19:20", "19:20 - 20:00",
  "20:00 - 20:50"
];

export const exportToExcel = (numEquipos, startIndex, date, reservations = []) => {
  // Crear un mapa de reservas por PC y hora
  const reservationMap = {};
  reservations.forEach(reserva => {
    const pcId = reserva.pcId;
    const horaInicio = reserva.horaInicio?.substring(0, 5);
    const horaTermino = reserva.horaTermino?.substring(0, 5);

    horas.forEach(horaBloqueStr => {
      const [inicioBloque] = horaBloqueStr.split(' - ');
      if (inicioBloque >= horaInicio && inicioBloque < horaTermino) {
        const key = `${pcId}-${inicioBloque}`;
        reservationMap[key] = reserva;
      }
    });
  });

  const header = ["Horario", ...Array.from({ length: numEquipos }, (_, i) => `PC ${startIndex + i}`)];
  
  // Generar las filas con los datos de reservas
  const rows = horas.map(hora => {
    const [horaBloque] = hora.split(' - ');
    const rowData = [hora];
    
    for (let i = 0; i < numEquipos; i++) {
      const pcId = startIndex + i;
      const key = `${pcId}-${horaBloque}`;
      const reserva = reservationMap[key];
      
      if (reserva) {
        rowData.push(`${reserva.rut}\n${reserva.carrera}`);
      } else {
        rowData.push('');
      }
    }
    
    return rowData;
  });

  // Crear la tabla HTML con estilos
  let tableStyle = 'border-collapse: collapse; width: 100%;';
  let cellStyle = 'border: 1px solid black; padding: 8px; text-align: center;';
  let headerStyle = cellStyle + 'background-color: #033163; color: white; font-weight: bold;';

  let table = `<table style="${tableStyle}">`;
  
  // Agregar encabezado
  table += '<tr>' + header.map(h => `<th style="${headerStyle}">${h}</th>`).join('') + '</tr>';
  
  // Agregar filas de datos
  rows.forEach(row => {
    table += '<tr>';
    row.forEach((cell, index) => {
      if (index === 0) {
        // Estilo para la columna de horarios
        table += `<td style="${cellStyle}">${cell}</td>`;
      } else {
        // Estilo para las celdas con datos
        const hasData = cell !== '';
        const cellContentStyle = hasData ? 'background-color: #e6f3ff;' : '';
        table += `<td style="${cellStyle} ${cellContentStyle}">${cell.replace('\n', '<br>')}</td>`;
      }
    });
    table += '</tr>';
  });
  
  table += '</table>';

  const excelFile = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <style>
        table, th, td { border: 1px solid black; }
        th { background-color: #033163; color: white; }
        .reserved { background-color: #e6f3ff; }
      </style>
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Bitácora</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
    </head>
    <body>
      ${table}
    </body>
    </html>`;

  // Crear el Blob con la codificación UTF-8
  const blob = new Blob(['\ufeff' + excelFile], { 
    type: 'application/vnd.ms-excel;charset=utf-8' 
  });

  // Crear y simular clic en el enlace de descarga
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `bitacora_${date || 'sin_fecha'}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const BitacoraTable = ({ numEquipos, startIndex = 1, reservations = [], date }) => {
  const [scale, setScale] = useState(1);

  // Función para formatear el porcentaje de zoom
  const formatZoom = (scale) => `${Math.round(scale * 100)}%`;

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 1.5));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleResetZoom = () => {
    setScale(1);
  };

  const handleExport = () => {
    console.log('Exportando con reservas:', reservations); // Debug
    exportToExcel(numEquipos, startIndex, date, reservations);
  };

  // Mapa para relacionar reservas con bloques horarios
  const reservationMap = {};

  reservations.forEach(reserva => {
    if (!reserva || !reserva.horaInicio || !reserva.horaTermino) {
      console.warn('Reserva inválida:', reserva);
      return;
    }

    const pcId = reserva.pcId;
    const horaInicio = reserva.horaInicio.substring(0, 5);
    const horaTermino = reserva.horaTermino.substring(0, 5);

    console.log(`Procesando reserva - PC: ${pcId}, Inicio: ${horaInicio}, Fin: ${horaTermino}`); // Debug

    horas.forEach(horaBloqueStr => {
      const [inicioBloque] = horaBloqueStr.split(' - ');
      if (inicioBloque >= horaInicio && inicioBloque < horaTermino) {
        const key = `${pcId}-${inicioBloque}`;
        reservationMap[key] = reserva;
        console.log(`Agregada reserva para bloque ${key}`); // Debug
      }
    });
  });

  const getReservationInfo = (pcId, horaBloqueStr) => {
    const [horaBloque] = horaBloqueStr.split(' - ');
    const key = `${pcId}-${horaBloque}`;
    const reserva = reservationMap[key];

    if (!reserva) return null;

    return (
      <div className="reservation-info">
        <div className="rut">{reserva.rut}</div>
        {reserva.carrera && <div className="carrera">{reserva.carrera}</div>}
      </div>
    );
  };

  return (
    <div className="bitacora-table">
      <div className="table-controls">
        <div className="zoom-controls">
          <button className="zoom-button" onClick={handleZoomOut} title="Reducir">
            <i className="fas fa-search-minus"></i>
          </button>
          <span className="zoom-info">{formatZoom(scale)}</span>
          <button className="zoom-button" onClick={handleZoomIn} title="Aumentar">
            <i className="fas fa-search-plus"></i>
          </button>
          <button className="zoom-button" onClick={handleResetZoom} title="Restablecer tamaño">
            <i className="fas fa-undo"></i>
          </button>
        </div>
        <button className="export-button" onClick={handleExport}>
          <i className="fas fa-file-export"></i> Exportar a Excel
        </button>
      </div>

      <div className="table-container">
        <table style={{ transform: `scale(${scale})` }}>
          <thead>
            <tr>
              <th>Horario</th>
              {Array.from({ length: numEquipos }, (_, i) => (
                <th key={i}>PC {startIndex + i}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {horas.map((hora, rowIndex) => (
              <tr key={rowIndex}>
                <td>{hora}</td>
                {Array.from({ length: numEquipos }, (_, colIndex) => {
                  const pcId = startIndex + colIndex;
                  const info = getReservationInfo(pcId, hora);
                  return (
                    <td key={colIndex} className={info ? 'reservado' : ''}>
                      {info}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BitacoraTable;
