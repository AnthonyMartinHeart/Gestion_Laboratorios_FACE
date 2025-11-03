import HorarioLaboratorios from "@components/Horarios-Lab";
import { useAuth } from "@context/AuthContext";
import { useState, useMemo, useRef, useCallback } from 'react';
import '@styles/Horarios.css';
import '@styles/bitacoras.css';

export default function HorarioPage({ laboratorio }) {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'administrador';
  const horarioRef = useRef(null);
  
  // Estados para los botones
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Establecer la fecha actual como valor por defecto
  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [viewMode, setViewMode] = useState('daily'); // 'daily' o 'weekly'
  const maxDate = '2026-12-31';

  const handleDateChange = (e) => setSelectedDate(e.target.value);
  
  // Para el selector de semana, convertir week a fecha
  const handleWeekChange = (e) => {
    // El formato es "2025-W43" (año-semana)
    const weekValue = e.target.value;
    if (!weekValue) return;
    
    const [year, week] = weekValue.split('-W').map(Number);
    // Calcular el lunes de esa semana
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dayOfWeek = simple.getDay();
    const monday = new Date(simple);
    monday.setDate(simple.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
    
    const formattedDate = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
    setSelectedDate(formattedDate);
  };
  
  // Convertir fecha a formato week para el selector
  const dateToWeek = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    // Calcular el número de semana ISO
    const startOfYear = new Date(year, 0, 1);
    const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    
    return `${year}-W${String(weekNumber).padStart(2, '0')}`;
  };

  // Calcular el rango de semana para mostrar en el texto
  const weekRange = useMemo(() => {
    if (viewMode !== 'weekly' || !selectedDate) return null;
    
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const monday = new Date(year, month - 1, day);
    monday.setDate(monday.getDate() - daysToMonday);
    
    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);
    
    const formatDate = (d) => {
      const dy = d.getDate();
      const m = d.getMonth() + 1;
      return `${dy}-${m}`;
    };
    
    return `${formatDate(monday)} al ${formatDate(saturday)}`;
  }, [selectedDate, viewMode]);

  // Callbacks para manejar los botones
  const handleSaveClick = useCallback(() => {
    if (horarioRef.current?.handleSave) {
      horarioRef.current.handleSave();
    }
  }, []);

  const handleClearClick = useCallback(() => {
    if (horarioRef.current?.handleClear) {
      horarioRef.current.handleClear();
    }
  }, []);

  return (
    <div className="horario-container">
      <div className="header-section">
        <h1 className="hh">
          {laboratorio 
            ? `Horario de Clases del Laboratorio ${laboratorio}` 
            : "Horario de Clases de los Laboratorios de Computación"
          }
        </h1>
        <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '15px',
          }}>
          {/* Toggle para cambiar modo de vista */}
          <div style={{
            display: 'inline-flex',
            gap: '0px',
            background: 'transparent',
            padding: '0px',
            borderRadius: '0px',
            width: 'auto',
          }}>
            <button
              onClick={() => setViewMode('daily')}
              style={{
                padding: '8px 16px',
                borderRadius: '20px 0 0 20px',
                border: 'none',
                background: viewMode === 'daily' ? 'white' : 'rgba(255, 255, 255, 0.2)',
                color: viewMode === 'daily' ? '#2c3e50' : 'white',
                fontWeight: viewMode === 'daily' ? 'bold' : 'normal',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: '0.85rem',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backdropFilter: 'blur(10px)',
              }}
            >
              📅 Vista Diaria
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              style={{
                padding: '8px 16px',
                borderRadius: '0 20px 20px 0',
                border: 'none',
                background: viewMode === 'weekly' ? 'white' : 'rgba(255, 255, 255, 0.2)',
                color: viewMode === 'weekly' ? '#2c3e50' : 'white',
                fontWeight: viewMode === 'weekly' ? 'bold' : 'normal',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: '0.85rem',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backdropFilter: 'blur(10px)',
              }}
            >
              📆 Vista Semanal
            </button>
          </div>

          {/* Selector de fecha */}
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            padding: '15px 25px',
            borderRadius: '25px',
            gap: '10px',
            minWidth: '300px'
          }}>
            {viewMode === 'daily' ? (
              <>
                <span style={{ color: 'white', fontSize: '0.9rem' }}>
                  Selecciona un día
                </span>
                <input
                  type="date"
                  id="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  min={getCurrentDate()}
                  max={maxDate}
                  style={{
                    background: 'white',
                    borderRadius: '20px',
                    padding: '8px 15px',
                    border: 'none',
                    fontSize: '1rem',
                    width: '100%'
                  }}
                />
              </>
            ) : (
              <>
                <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  Semana del {weekRange}
                </span>
                <input
                  type="week"
                  id="week"
                  value={dateToWeek(selectedDate)}
                  onChange={handleWeekChange}
                  min={dateToWeek(getCurrentDate())}
                  max="2026-W52"
                  style={{
                    background: 'white',
                    borderRadius: '20px',
                    padding: '8px 15px',
                    border: 'none',
                    fontSize: '1rem',
                    width: '100%'
                  }}
                />
                <span style={{ color: 'white', fontSize: '0.75rem', opacity: 0.9 }}>
                  Selector de semana completa
                </span>
              </>
            )}
          </div>

          {/* Botones de Guardar y Limpiar (solo para admin) */}
          {isAdmin && (
            <div style={{
              display: 'flex',
              gap: '10px',
              marginTop: '10px',
              justifyContent: 'center'
            }}>
              <button
                onClick={handleSaveClick}
                disabled={!hasChanges || isLoading}
                style={{
                  padding: '10px 20px',
                  borderRadius: '20px',
                  border: 'none',
                  background: hasChanges 
                    ? 'linear-gradient(135deg, #4caf50, #2e7d32)' 
                    : 'rgba(76, 175, 80, 0.5)',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: hasChanges && !isLoading ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s ease',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: hasChanges && !isLoading ? 1 : 0.6
                }}
              >
                {isLoading ? '⏳ Guardando...' : hasChanges ? '💾 Guardar Cambios' : '✅ Guardado'}
              </button>
              <button
                onClick={handleClearClick}
                disabled={isLoading}
                style={{
                  padding: '10px 20px',
                  borderRadius: '20px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #f44336, #c62828)',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: isLoading ? 0.6 : 1
                }}
              >
                🗑️ Limpiar y Guardar
              </button>
            </div>
          )}
          {isAdmin && hasChanges && (
            <div style={{
              background: 'white',
              borderRadius: '15px',
              padding: '12px 20px',
              marginTop: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              border: '2px solid #ff9800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              maxWidth: '350px',
              margin: '12px auto 0'
            }}>
              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
              <p style={{
                color: '#e65100',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                margin: 0,
                textAlign: 'center'
              }}>
                Hay cambios sin guardar
              </p>
            </div>
          )}
        </div>
      </div>

      <HorarioLaboratorios 
        ref={horarioRef}
        key={`${viewMode}-${selectedDate}`}
        laboratorio={laboratorio} 
        selectedDate={selectedDate} 
        viewMode={viewMode}
        renderButtons={true}
        onStateChange={(changes) => {
          if (changes.hasChanges !== undefined) setHasChanges(changes.hasChanges);
          if (changes.isLoading !== undefined) setIsLoading(changes.isLoading);
        }}
      />
    </div>
  );
}

