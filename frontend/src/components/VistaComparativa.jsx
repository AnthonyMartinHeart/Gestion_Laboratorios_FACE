import { useState, useEffect } from 'react';
import { getAllReservations } from '@services/reservation.service.js';

const VistaComparativa = () => {
  const [estadisticas, setEstadisticas] = useState({
    laboratorio1: { totalEquipos: 20, equiposUtilizables: 20, bloquesUtilizables: 320, bloques: 0, usoTotal: 0 },
    laboratorio2: { totalEquipos: 20, equiposUtilizables: 20, bloquesUtilizables: 320, bloques: 0, usoTotal: 0 },
    laboratorio3: { totalEquipos: 20, equiposUtilizables: 20, bloquesUtilizables: 320, bloques: 0, usoTotal: 0 }
  });
  const [filtroFecha, setFiltroFecha] = useState('');

  useEffect(() => {
    cargarEstadisticas();
  }, [filtroFecha]);

  const cargarEstadisticas = async () => {
    try {
      const reservas = await getAllReservations();
      const reservasFiltradas = filtroFecha 
        ? reservas.filter(r => r.fechaReserva === filtroFecha)
        : reservas;

      // Calcular estadísticas por laboratorio
      const lab1Reservas = reservasFiltradas.filter(r => r.labId === 1 && r.carrera !== 'MAINTENANCE');
      const lab2Reservas = reservasFiltradas.filter(r => r.labId === 2 && r.carrera !== 'MAINTENANCE');
      const lab3Reservas = reservasFiltradas.filter(r => r.labId === 3 && r.carrera !== 'MAINTENANCE');

      setEstadisticas({
        laboratorio1: calcularEstadisticasLab(lab1Reservas),
        laboratorio2: calcularEstadisticasLab(lab2Reservas),
        laboratorio3: calcularEstadisticasLab(lab3Reservas)
      });
    } catch (error) {
      console.error('Error al cargar estadísticas comparativas:', error);
    }
  };

  const calcularEstadisticasLab = (reservas) => {
    const totalEquipos = 20;
    const equiposUtilizables = 20;
    const bloquesUtilizables = 320; // 20 equipos × 16 bloques por día
    const bloques = reservas.length;
    const usoTotal = Math.round((bloques / bloquesUtilizables) * 100);

    // Calcular uso por categoría (basado en patrones comunes)
    const usoICINF = reservas.filter(r => r.carrera?.includes('ICINF') || r.carrera?.includes('INF')).length;
    const usoIECI = reservas.filter(r => r.carrera?.includes('IECI') || r.carrera?.includes('IEC')).length;
    const usoICO = reservas.filter(r => r.carrera?.includes('ICO') || r.carrera?.includes('COM')).length;
    const usoCPA = reservas.filter(r => r.carrera?.includes('CPA') || r.carrera?.includes('ADM')).length;

    return {
      totalEquipos,
      equiposUtilizables,
      bloquesUtilizables,
      bloques,
      usoTotal,
      usoICINF: Math.round((usoICINF / bloquesUtilizables) * 100),
      usoIECI: Math.round((usoIECI / bloquesUtilizables) * 100),
      usoICO: Math.round((usoICO / bloquesUtilizables) * 100),
      usoCPA: Math.round((usoCPA / bloquesUtilizables) * 100)
    };
  };

  const renderTablaComparativa = () => {
    const labs = [
      { key: 'laboratorio2', nombre: 'LABORATORIO 2' },
      { key: 'laboratorio3', nombre: 'LABORATORIO 3' }
    ];

    return (
      <div className="vista-comparativa">
        <h3>📊 Vista Comparativa de Laboratorios</h3>
        
        <div className="filtro-fecha">
          <label>Filtrar por fecha:</label>
          <input
            type="date"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
          />
          <button onClick={() => setFiltroFecha('')} className="clear-filter">
            Limpiar filtro
          </button>
        </div>

        <div className="tablas-comparativas">
          {labs.map(({ key, nombre }) => {
            const data = estadisticas[key];
            return (
              <div key={key} className="tabla-laboratorio">
                <table className="tabla-estadisticas">
                  <thead>
                    <tr>
                      <th className="lab-header" colSpan="3">{nombre}</th>
                    </tr>
                    <tr>
                      <th>DESCRIPCIÓN</th>
                      <th>CANTIDAD</th>
                      <th>PORCENTAJE</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Total Equipos</td>
                      <td>{data.totalEquipos}</td>
                      <td>-</td>
                    </tr>
                    <tr className="row-highlight">
                      <td>Equipos utilizables</td>
                      <td>{data.equiposUtilizables}</td>
                      <td>100%</td>
                    </tr>
                    <tr>
                      <td>Bloques por día</td>
                      <td>16</td>
                      <td>-</td>
                    </tr>
                    <tr>
                      <td>Total Bloques:</td>
                      <td>{data.bloquesUtilizables}</td>
                      <td>100%</td>
                    </tr>
                    <tr className="row-highlight">
                      <td>Bloques utilizables</td>
                      <td>{data.bloquesUtilizables}</td>
                      <td>100%</td>
                    </tr>
                    <tr>
                      <td>Bloques</td>
                      <td>{data.bloques}</td>
                      <td>{Math.round((data.bloques / data.bloquesUtilizables) * 100)}%</td>
                    </tr>
                    <tr>
                      <td>USO ICINF</td>
                      <td>{Math.round((data.usoICINF / 100) * data.bloquesUtilizables)}</td>
                      <td>{data.usoICINF}%</td>
                    </tr>
                    <tr>
                      <td>USO IECI</td>
                      <td>{Math.round((data.usoIECI / 100) * data.bloquesUtilizables)}</td>
                      <td>{data.usoIECI}%</td>
                    </tr>
                    <tr>
                      <td>USO ICO</td>
                      <td>{Math.round((data.usoICO / 100) * data.bloquesUtilizables)}</td>
                      <td>{data.usoICO}%</td>
                    </tr>
                    <tr>
                      <td>USO CPA</td>
                      <td>{Math.round((data.usoCPA / 100) * data.bloquesUtilizables)}</td>
                      <td>{data.usoCPA}%</td>
                    </tr>
                    <tr className="row-total">
                      <td><strong>USO TOTAL</strong></td>
                      <td><strong>{data.bloques}</strong></td>
                      <td><strong>{data.usoTotal}%</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>

        <div className="resumen-comparativo">
          <h4>📈 Resumen Comparativo</h4>
          <div className="resumen-grid">
            <div className="resumen-item">
              <span className="resumen-label">Laboratorio 2:</span>
              <span className="resumen-valor">{estadisticas.laboratorio2.usoTotal}% de uso</span>
              <div className="resumen-bar">
                <div 
                  className="resumen-fill lab2" 
                  style={{ width: `${estadisticas.laboratorio2.usoTotal}%` }}
                ></div>
              </div>
            </div>
            <div className="resumen-item">
              <span className="resumen-label">Laboratorio 3:</span>
              <span className="resumen-valor">{estadisticas.laboratorio3.usoTotal}% de uso</span>
              <div className="resumen-bar">
                <div 
                  className="resumen-fill lab3" 
                  style={{ width: `${estadisticas.laboratorio3.usoTotal}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return renderTablaComparativa();
};

export default VistaComparativa;
