import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@context/AuthContext";
import useHorarioSync from "@hooks/useHorarioSync.jsx";
import Swal from "sweetalert2";
import "@styles/Horarios.css";

const horas = [
  "08:10 -08:50", "08:50 -09:30", "09:40 -10:20", "10:20 -11:00",
  "11:10 -11:50", "11:50 -12:30", "12:40 -13:20", "13:20 -14:00",
  "14:10 -14:50", "14:50 -15:30", "15:40 -16:20", "16:20 -17:00",
  "17:10 -17:50", "17:50 -18:30", "18:40 -19:10", "19:20 -20:50",
  "20:50 -21:30"
];

const dias = ["LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"];

function generarTablaInicial() {
  const tabla = horas.map(hora => [hora, ...Array(dias.length).fill("")]);
  console.log('Tabla inicial generada:', tabla);
  return tabla;
}

// Función para determinar si un texto es largo y necesita clase especial
function isLongText(text) {
  return text && (text.length > 15 || text.includes(" ") && text.length > 12);
}

export default function HorarioLaboratorios({ laboratorio }) {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'administrador';
  
  // Hook para sincronización automática (EXACTAMENTE como useReservationSync)
  const { 
    horarios, 
    lastModified, 
    modifiedBy, 
    isLoading, 
    saveHorarios, 
    refreshHorarios 
  } = useHorarioSync();
  
  const [lab1, setLab1] = useState(generarTablaInicial());
  const [lab2, setLab2] = useState(generarTablaInicial());
  const [lab3, setLab3] = useState(generarTablaInicial());
  const [hasChanges, setHasChanges] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Función para ajustar la clase de las textareas con texto largo
  const adjustAllTextareas = useCallback(() => {
    setTimeout(() => {
      const textareas = document.querySelectorAll('.editable-cell');
      textareas.forEach(textarea => {
        // Aplicar clase para texto largo en lugar de ajustar altura
        if (textarea.value && textarea.value.trim().length > 0) {
          if (isLongText(textarea.value)) {
            textarea.classList.add('long-text');
          } else {
            textarea.classList.remove('long-text');
          }
        }
      });
    }, 200); // Pequeño retraso para asegurar que los elementos están renderizados
  }, []);

  // Detectar cambios de tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      adjustAllTextareas();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [adjustAllTextareas]);

  // Cargar datos iniciales desde el hook de sincronización
  useEffect(() => {
    if (horarios) {
      console.log('Cargando datos desde hook:', horarios);
      
      // Verificar que los datos sean arrays válidos antes de asignarlos
      if (Array.isArray(horarios.lab1) && horarios.lab1.length > 0) {
        setLab1(horarios.lab1);
      } else {
        console.log('Lab1 inválido, usando tabla inicial');
        setLab1(generarTablaInicial());
      }
      
      if (Array.isArray(horarios.lab2) && horarios.lab2.length > 0) {
        setLab2(horarios.lab2);
      } else {
        console.log('Lab2 inválido, usando tabla inicial');
        setLab2(generarTablaInicial());
      }
      
      if (Array.isArray(horarios.lab3) && horarios.lab3.length > 0) {
        setLab3(horarios.lab3);
      } else {
        console.log('Lab3 inválido, usando tabla inicial');
        setLab3(generarTablaInicial());
      }
      
      setHasChanges(false);
      adjustAllTextareas();
    } else {
      // Fallback a tablas vacías si no hay datos
      console.log('No se detectaron datos válidos, usando tablas vacías');
      setLab1(generarTablaInicial());
      setLab2(generarTablaInicial());
      setLab3(generarTablaInicial());
    }
  }, [horarios, adjustAllTextareas]);

  const handleSave = async () => {
    if (!isAdmin) {
      Swal.fire({
        title: "Acceso denegado",
        text: "Solo los administradores pueden guardar horarios.",
        icon: "error",
        confirmButtonText: "Aceptar",
      });
      return;
    }

    try {
      // Usar el hook para guardar (ahora es async como refreshReservations)
      await saveHorarios(lab1, lab2, lab3, user);
      setHasChanges(false);
      
      Swal.fire({
        title: "✅ Guardado exitoso",
        text: "Los horarios han sido actualizados y sincronizados en todos los dispositivos.",
        icon: "success",
        confirmButtonText: "Aceptar",
        timer: 2000,
        timerProgressBar: true
      });
    } catch (error) {
      // El error ya se maneja en el hook
      setHasChanges(true); // Mantener los cambios si hubo error
    }
  };

  const handleClear = async () => {
    if (!isAdmin) return;
    
    Swal.fire({
      title: "¿Limpiar todos los horarios?",
      text: "Esta acción eliminará toda la información de horarios. ¿Está seguro?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, limpiar",
      cancelButtonText: "Cancelar"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Generar tablas completamente vacías
          const tablasVacias = generarTablaInicial();
          
          // Verificar que las tablas estén realmente vacías
          console.log('Tablas vacías generadas:', tablasVacias);
          
          // Limpiar localStorage primero
          localStorage.removeItem("horarios");
          console.log('LocalStorage limpiado');
          
          // Actualizar estado local
          setLab1(tablasVacias);
          setLab2(tablasVacias);
          setLab3(tablasVacias);
          
          // Guardar inmediatamente para evitar problemas de sincronización
          await saveHorarios(tablasVacias, tablasVacias, tablasVacias, user);
          
          // Forzar refresco de todas las textareas
          setTimeout(() => {
            adjustAllTextareas();
            // Limpiar manualmente todas las textareas visibles
            document.querySelectorAll('.editable-cell').forEach(textarea => {
              if (textarea.value.trim() !== '') {
                textarea.value = '';
                textarea.classList.remove('long-text');
              }
            });
          }, 100);
          
          setHasChanges(false); // Ya se guardó
          
          Swal.fire(
            "✅ Limpiado y Guardado",
            "Los horarios han sido completamente limpiados y guardados.",
            "success"
          );
          
        } catch (error) {
          console.error('Error al limpiar horarios:', error);
          
          Swal.fire(
            "❌ Error",
            "Hubo un problema al limpiar los horarios. Intente nuevamente.",
            "error"
          );
          
          // En caso de error, marcar cambios pendientes
          setHasChanges(true);
        }
      }
    });
  };

  // Función de reset completo para casos extremos
  const handleForceReset = () => {
    if (!isAdmin) return;
    
    Swal.fire({
      title: "🔄 Reset Completo del Sistema",
      text: "Esto limpiará TODO: localStorage, estado y forzará recarga. Solo para debugging.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Reset Completo",
      cancelButtonText: "Cancelar"
    }).then((result) => {
      if (result.isConfirmed) {
        // Limpiar todo
        localStorage.removeItem("horarios");
        sessionStorage.clear();
        
        // Recargar página completa
        window.location.reload();
      }
    });
  };

  // Función para actualizar horarios con clases aprobadas
  // FUNCIÓN ELIMINADA POR SOLICITUD DEL USUARIO

  const laboratorios = [
    { nombre: "CLASES LABORATORIO 1", data: lab1, setData: setLab1 },
    { nombre: "CLASES LABORATORIO 2", data: lab2, setData: setLab2 },
    { nombre: "CLASES LABORATORIO 3", data: lab3, setData: setLab3 }
  ];

  // Filtrar laboratorios según la prop
  const laboratoriosAMostrar = laboratorio 
    ? [laboratorios[laboratorio - 1]] // Mostrar solo el laboratorio específico (laboratorio es 1-indexed)
    : laboratorios; // Mostrar todos los laboratorios

  const handleCellChange = useCallback((labIndex, rowIndex, colIndex, value) => {
    // Verificar rol primero
    if (!isAdmin) {
      Swal.fire({
        title: "Acceso denegado",
        text: "Solo los administradores pueden modificar horarios.",
        icon: "error",
        confirmButtonText: "Aceptar",
      });
      return;
    }
    
    // Seguridad para asegurar que datos existen
    try {
      const lab = laboratorios[labIndex];
      
      // Si el array no existe o está mal formado, inicializar
      if (!lab.data || !Array.isArray(lab.data) || lab.data.length === 0) {
        console.warn(`Datos del laboratorio ${labIndex} estaban vacíos o inválidos, reinicializando`);
        lab.setData(generarTablaInicial());
        return; // Salir y esperar a que el useEffect actualice los datos
      }
      
      // Actualizar la celda
      const newData = [...lab.data];
      newData[rowIndex][colIndex] = value;
      lab.setData(newData);
      setHasChanges(true);
    } catch (error) {
      console.error('Error al modificar celda:', error);
      // Mostrar mensaje de error pero no bloquear la aplicación
      Swal.fire({
        title: "Error al editar",
        text: "Hubo un problema al modificar la celda. Intente recargar la página.",
        icon: "warning",
        confirmButtonText: "Aceptar",
      });
    }
  }, [isAdmin, laboratorios]);

  return (
    <div className="horario-container">
      {/* Información de última modificación */}
      {lastModified && (
        <div className="last-modified-info">
          <p>
            <span>Última actualización:</span> {new Date(lastModified).toLocaleString('es-CL')}
            {modifiedBy && <span> por <span>{modifiedBy}</span></span>}
            {isLoading && <span>🔄 Sincronizando...</span>}
          </p>
        </div>
      )}
      
      <div className="space-y-8">
        {laboratoriosAMostrar.map((lab, index) => {
          // Obtener el índice real del laboratorio en el array original
          const labIndex = laboratorio ? laboratorio - 1 : index;
          
          return (
            <div key={labIndex} className="lab-section">
              <h2 className="lab-title">{lab.nombre}</h2>
            
            {/* Vista de tabla para pantallas grandes */}
            <div className="table-responsive desktop-view">
              <table className="horario-table">
                <thead>
                  <tr>
                    <th className="hora-column">HORARIO</th>
                    {dias.map((dia, idx) => (
                      <th key={idx} className="pc-column">{dia}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lab.data.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, colIndex) => (
                        <td key={colIndex} className={colIndex === 0 ? "hora-cell" : "data-cell"}>
                          {colIndex === 0 ? (
                            <span className="hora-text">{cell}</span>
                          ) : (
                            <textarea
                              value={cell}
                              onChange={(e) => {
                                handleCellChange(labIndex, rowIndex, colIndex, e.target.value);
                                // Ya no ajustamos altura para mantener consistencia
                              }}
                              className={`editable-cell ${!isAdmin ? 'readonly' : ''} ${isLongText(cell) ? 'long-text' : ''}`}
                              readOnly={!isAdmin}
                              placeholder={isAdmin ? "Asignatura..." : ""}
                              title={cell || (!isAdmin ? "Solo lectura - Contacte al administrador para modificar" : "")}
                            />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista de cards para móviles */}
            <div className="mobile-view">
              {lab.data.map((row, rowIndex) => (
                <div key={rowIndex} className="horario-card">
                  <div className="card-header">
                    <h4 className="hora-mobile">{row[0]}</h4>
                  </div>
                  <div className="card-content">
                    {dias.map((dia, diaIndex) => (
                      <div key={diaIndex} className="dia-row">
                        <label className="dia-label">{dia}</label>
                        <textarea
                          value={row[diaIndex + 1]}
                          onChange={(e) => {
                            handleCellChange(labIndex, rowIndex, diaIndex + 1, e.target.value);
                            // Ya no ajustamos altura para mantener consistencia
                          }}
                          className={`editable-cell mobile-input ${!isAdmin ? 'readonly' : ''} ${isLongText(row[diaIndex + 1]) ? 'long-text' : ''}`}
                          readOnly={!isAdmin}
                          placeholder={isAdmin ? "Asignatura..." : ""}
                          title={row[diaIndex + 1] || ""}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          );
        })}
      </div>
      
      {isAdmin && (
        <div className="save-section mt-6">
          <div className="button-group flex gap-3 justify-center">
            <button 
              onClick={handleSave} 
              className={`save-button ${hasChanges ? 'has-changes' : ''}`}
              disabled={!hasChanges || isLoading}
            >
              {isLoading ? '⏳ Guardando...' : hasChanges ? '💾 Guardar Cambios' : '✅ Guardado'}
            </button>
            <button 
              onClick={handleClear} 
              className="clear-button"
              disabled={isLoading}
            >
              🗑️ Limpiar y Guardar
            </button>
          </div>
          {hasChanges && (
            <p className="text-center text-orange-600 mt-2 text-sm">
              ⚠️ Hay cambios sin guardar
            </p>
          )}
        </div>
      )}
      
      {/* Se eliminó la sección de información para consultores */}
    </div>
  );
}
