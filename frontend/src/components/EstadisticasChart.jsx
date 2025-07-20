import { useMemo } from 'react';

const EstadisticasChart = ({ data, tipo, titulo }) => {
  const chartData = useMemo(() => {
    if (!data || typeof data !== 'object') return [];
    
    return Object.entries(data)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10); // Top 10
  }, [data]);

  const maxValue = useMemo(() => {
    return Math.max(...chartData.map(([, value]) => value)) || 1;
  }, [chartData]);

  const getBarColor = (index) => {
    const colors = [
      '#033163', '#1e40af', '#2563eb', '#3b82f6', '#60a5fa',
      '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff', '#f8fafc'
    ];
    return colors[index % colors.length];
  };

  const formatLabel = (label) => {
    // Formatear etiquetas para mejor presentación
    if (tipo === 'equipos') {
      return label;
    }
    if (tipo === 'horarios') {
      return `${label}:00`;
    }
    if (tipo === 'dias') {
      return label.charAt(0).toUpperCase() + label.slice(1);
    }
    return label;
  };

  if (!chartData.length) {
    return (
      <div className="chart-container">
        <h4>{titulo}</h4>
        <div className="no-data-message">
          <p>📊 No hay datos suficientes para mostrar el gráfico</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <h4>{titulo}</h4>
      <div className="chart-content">
        <div className="chart-bars">
          {chartData.map(([label, value], index) => {
            const percentage = (value / maxValue) * 100;
            return (
              <div key={label} className="chart-bar-item">
                <div className="chart-bar-label">
                  <span className="bar-ranking">#{index + 1}</span>
                  <span className="bar-text">{formatLabel(label)}</span>
                </div>
                <div className="chart-bar-container">
                  <div 
                    className="chart-bar-fill"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: getBarColor(index)
                    }}
                  >
                    <span className="bar-value">{value}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EstadisticasChart;
