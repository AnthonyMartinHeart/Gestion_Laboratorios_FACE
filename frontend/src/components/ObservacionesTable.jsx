import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { getUsers, getUserByRut, getUsersForObservaciones } from "@services/user.service.js";
import { getObservacionesByFecha, saveOrUpdateObservacion } from "@services/observaciones.service.js";
import { useAuth } from "@context/AuthContext.jsx";
import * as XLSX from 'xlsx';
import { FaFileExcel, FaFilePdf, FaEye, FaEyeSlash, FaSave } from 'react-icons/fa';

const ObservacionesTable = ({ selectedDate }) => {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [observaciones, setObservaciones] = useState([]);
  const [observacionesEditadas, setObservacionesEditadas] = useState({});
  const [guardandoObservacion, setGuardandoObservacion] = useState(false);

  // Cargar usuarios (consultores y administradores)
  useEffect(() => {
    if (!user) return;
    
    // Tanto administradores como consultores cargan usuarios usando la ruta específica para observaciones
    console.log(`🔄 Cargando usuarios para observaciones (rol: ${user.rol})`);
    getUsersForObservaciones().then(users => {
      if (users && Array.isArray(users) && users.length > 0) {
        console.log('📋 Usuarios REALES de la base de datos cargados:', users);
        
        // Ordenar para que el usuario logueado aparezca PRIMERO en la lista
        const usuariosOrdenados = users.sort((a, b) => {
          if (a.rut === user.rut) return -1; // Usuario logueado va primero
          if (b.rut === user.rut) return 1;  // Usuario logueado va primero
          return 0; // Mantener el orden de los demás
        });
        
        console.log('✨ Usuario logueado colocado primero:', usuariosOrdenados[0]);
        setUsuarios(usuariosOrdenados);
      } else {
        console.error('❌ No se pudieron cargar los usuarios de la base de datos');
        setUsuarios([]);
      }
    }).catch(error => {
      console.error('❌ Error crítico al cargar usuarios de la base de datos:', error);
      setUsuarios([]);
    });
  }, [user]);

  // Cargar observaciones
  const loadObservaciones = async () => {
    if (selectedDate && usuarios.length > 0 && !guardandoObservacion) {
      console.log('🔄 Cargando observaciones para:', selectedDate);
      
      try {
        const observacionesData = await getObservacionesByFecha(selectedDate);
        console.log('📥 Observaciones obtenidas:', observacionesData);
        
        // Crear observaciones para todos los usuarios
        const observacionesCompletas = usuarios.map(usuario => {
          const observacionExistente = observacionesData.find(o => o.rut === usuario.rut);
          return observacionExistente || {
            rut: usuario.rut,
            nombre: usuario.nombreCompleto,
            fecha: selectedDate,
            observacion: ""
          };
        });
        
        console.log('📝 Observaciones finales:', observacionesCompletas);
        setObservaciones(observacionesCompletas);
        
        // Limpiar observaciones editadas al cargar nuevas
        setObservacionesEditadas({});
        
      } catch (error) {
        console.error('❌ Error cargando observaciones:', error);
      }
    }
  };

  useEffect(() => {
    if (selectedDate && usuarios.length > 0 && !guardandoObservacion) {
      loadObservaciones();
    }
  }, [selectedDate, usuarios]);

  const handleObservacionChange = (index, value) => {
    const nuevasObservaciones = { ...observacionesEditadas };
    nuevasObservaciones[index] = value;
    setObservacionesEditadas(nuevasObservaciones);
  };

  // Guardar observación en el backend
  const handleGuardar = async (i, usuario) => {
    try {
      console.log('💾 Guardando observación para:', usuario.nombreCompleto);
      
      if (!selectedDate) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Selecciona una fecha primero'
        });
        return;
      }

      if (guardandoObservacion) {
        console.log('⚠️ Ya se está guardando una observación, cancelando...');
        return;
      }

      setGuardandoObservacion(true);
      
      const observacionActual = observaciones.find(o => o.rut === usuario.rut) || {};
      const textoObservacion = observacionesEditadas[i] !== undefined 
        ? observacionesEditadas[i] 
        : observacionActual.observacion || "";
      
      // Tanto administradores como consultores solo pueden editar sus propias observaciones
      // Siempre usar los datos reales del usuario logueado
      const datosParaGuardar = {
        rut: user.rut,
        nombre: user.nombreCompleto
      };
      console.log(`� ${user.rol} guardando con datos reales:`, datosParaGuardar);
      
      const observacionData = {
        rut: datosParaGuardar.rut,
        nombre: datosParaGuardar.nombre,
        fecha: selectedDate,
        observacion: textoObservacion
      };
      
      console.log('💾 Datos finales a guardar:', observacionData);
      console.log('📝 Texto de observación:', `"${observacionData.observacion}"`);
      console.log('📅 Fecha:', observacionData.fecha);
      
      await saveOrUpdateObservacion(selectedDate, observacionData);
      
      // Actualizar el estado local
      const nuevasObservaciones = [...observaciones];
      const indiceExistente = nuevasObservaciones.findIndex(o => o.rut === usuario.rut);
      
      if (indiceExistente >= 0) {
        nuevasObservaciones[indiceExistente] = observacionData;
      } else {
        nuevasObservaciones.push(observacionData);
      }
      
      setObservaciones(nuevasObservaciones);
      
      // Limpiar la observación editada de este índice
      const nuevasEditadas = { ...observacionesEditadas };
      delete nuevasEditadas[i];
      setObservacionesEditadas(nuevasEditadas);
      
      // Mostrar éxito con SweetAlert
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Observación guardada correctamente',
        timer: 2000,
        showConfirmButton: false
      });
      
      console.log('✅ Observación guardada exitosamente');
      
    } catch (error) {
      console.error('❌ Error al guardar:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar la observación'
      });
    } finally {
      setGuardandoObservacion(false);
    }
  };

  // Verificaciones de permisos
  const puedeEditar = (usuario) => {
    if (!user) return false;
    // Tanto administradores como consultores solo pueden editar sus propias observaciones
    if ((user.rol.toLowerCase() === "administrador" || user.rol.toLowerCase() === "consultor") && user.rut === usuario.rut) return true;
    return false;
  };

  // Exportar a Excel
  const exportToExcel = () => {
    const data = observaciones.map(obs => ({
      'Nombre': obs.nombre,
      'Observación': obs.observacion || 'Ninguna'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Observaciones');
    
    // Ajustar ancho de columnas
    const maxWidth = data.reduce((w, r) => Math.max(w, r.Nombre.length), 10);
    ws['!cols'] = [
      { wch: maxWidth },
      { wch: 50 }
    ];
    
    XLSX.writeFile(wb, `Observaciones_${selectedDate}.xlsx`);
    
    // Mensaje de éxito
    Swal.fire({
      icon: 'success',
      title: 'Excel Generado',
      text: 'El archivo Excel se ha descargado correctamente',
      timer: 2000,
      showConfirmButton: false
    });
  };

  // Exportar a PDF con descarga automática y diseño bonito
  const exportToPDF = async () => {
    try {
      // Importación dinámica de jsPDF con mejor manejo de errores
      const jsPDF = (await import('jspdf')).default;
      
      // Crear documento PDF
      const doc = new jsPDF();
      
      // === HEADER CON DISEÑO ATRACTIVO ===
      // Fondo azul para el header
      doc.setFillColor(52, 152, 219); // Azul bonito
      doc.rect(0, 0, 210, 35, 'F'); // Rectángulo de fondo
      
      // Título principal en blanco (SIN EMOJIS)
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('OBSERVACIONES', 105, 20, { align: 'center' });
      
      // Fecha en el header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha: ${selectedDate}`, 105, 28, { align: 'center' });
      
      // === INFORMACIÓN ADICIONAL ===
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, 14, 45);
      doc.text(`Total de registros: ${observaciones.length}`, 14, 52);
      
      // === TABLA CON DISEÑO PROFESIONAL ===
      let yPosition = 65;
      const pageHeight = 280;
      const rowHeight = 12;
      const maxRowsPerPage = Math.floor((pageHeight - yPosition - 20) / rowHeight);
      
      // Headers de la tabla con estilo
      doc.setFillColor(41, 128, 185); // Azul más oscuro
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      
      // Dibujar headers
      doc.rect(14, yPosition, 80, 10, 'F'); // Nombre
      doc.rect(94, yPosition, 100, 10, 'F'); // Observación
      doc.text('NOMBRE', 54, yPosition + 7, { align: 'center' });
      doc.text('OBSERVACIÓN', 144, yPosition + 7, { align: 'center' });
      
      yPosition += 10;
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      // Datos de la tabla con colores alternados
      observaciones.forEach((obs, index) => {
        // Verificar si necesitamos nueva página
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
          
          // Repetir headers en nueva página
          doc.setFillColor(41, 128, 185);
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          
          doc.rect(14, yPosition, 80, 10, 'F');
          doc.rect(94, yPosition, 100, 10, 'F');
          doc.text('NOMBRE', 54, yPosition + 7, { align: 'center' });
          doc.text('OBSERVACIÓN', 144, yPosition + 7, { align: 'center' });
          
          yPosition += 10;
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
        }
        
        // Alternar colores de fila
        if (index % 2 === 0) {
          doc.setFillColor(248, 249, 250); // Gris muy claro
          doc.rect(14, yPosition, 180, rowHeight, 'F');
        }
        
        // Bordes de las celdas
        doc.setDrawColor(189, 195, 199);
        doc.rect(14, yPosition, 80, rowHeight); // Celda nombre
        doc.rect(94, yPosition, 100, rowHeight); // Celda observación
        
        // Texto de la fila
        doc.setTextColor(44, 62, 80);
        doc.setFont('helvetica', 'bold');
        doc.text(obs.nombre, 16, yPosition + 8);
        
        doc.setFont('helvetica', 'normal');
        const observacionText = obs.observacion || 'Sin observaciones';
        
        // Manejar texto largo con salto de línea
        const splitText = doc.splitTextToSize(observacionText, 95);
        doc.text(splitText, 96, yPosition + 8);
        
        yPosition += Math.max(rowHeight, splitText.length * 4 + 4);
      });
      
      // === FOOTER ELEGANTE ===
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(127, 140, 141);
        doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
        doc.text('Sistema de Gestión de Laboratorios - FACE', 105, 295, { align: 'center' });
      }
      
      // === DESCARGA AUTOMÁTICA ===
      const fileName = `Observaciones_${selectedDate.replace(/-/g, '_')}.pdf`;
      doc.save(fileName);
      
      // Mensaje de éxito bonito
      Swal.fire({
        icon: 'success',
        title: 'PDF Generado!',
        html: `
          <div style="text-align: center;">
            <p style="font-size: 16px; margin: 10px 0;">El archivo se ha descargado automaticamente</p>
            <p style="font-size: 14px; color: #7f8c8d; margin: 5px 0;">
              <strong>${fileName}</strong>
            </p>
            <p style="font-size: 12px; color: #95a5a6; margin-top: 15px;">
              ${observaciones.length} observaciones exportadas correctamente
            </p>
          </div>
        `,
        timer: 4000,
        showConfirmButton: false,
        background: '#f8f9fa',
        color: '#2c3e50'
      });
      
    } catch (error) {
      console.error('Error al exportar a PDF:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al generar PDF',
        text: 'No se pudo exportar a PDF. Verifica que las dependencias estén instaladas correctamente.',
        confirmButtonText: 'Entendido'
      });
    }
  };

  return (
    <div className="observaciones-wrapper">
      {/* Solo mostrar botones de exportar a administradores */}
      {user?.rol?.toLowerCase() === 'administrador' && (
        <div className="export-buttons">
          <button onClick={exportToExcel} className="export-btn excel-btn">
            <FaFileExcel /> Exportar a Excel
          </button>
          <button onClick={exportToPDF} className="export-btn pdf-btn">
            <FaFilePdf /> Exportar a PDF
          </button>
        </div>
      )}

      <div className="observaciones-table">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Observación</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 ? (
              <tr><td colSpan={2}>No hay usuarios para mostrar.</td></tr>
            ) : (
              usuarios.map((usuario, i) => {
                const observacion = observaciones.find(o => o.rut === usuario.rut) || {};
                const textoObservacion = observacionesEditadas[i] !== undefined 
                  ? observacionesEditadas[i] 
                  : observacion.observacion || "";
                const puedeEditarCelda = puedeEditar(usuario);
                
                return (
                  <tr key={`${usuario.rut}-${i}`}>
                    <td className="nombre-cell">{usuario.nombreCompleto}</td>
                    <td className={`observacion-cell ${puedeEditarCelda ? 'editable' : 'readonly'}`}>
                      <div className="observacion-container">
                        <div className="observacion-input-wrapper">
                          <textarea
                            value={textoObservacion}
                            onChange={(e) => handleObservacionChange(i, e.target.value)}
                            placeholder={puedeEditarCelda ? "Escribe una observación..." : "Sin observación"}
                            readOnly={!puedeEditarCelda}
                            className={`observacion-textarea ${!puedeEditarCelda ? 'readonly' : ''}`}
                            rows="5"
                          />
                          {puedeEditarCelda && (
                            <button 
                              onClick={() => handleGuardar(i, usuario)}
                              className="save-observacion-btn"
                              disabled={guardandoObservacion}
                            >
                              <FaSave /> Guardar
                            </button>
                          )}
                        </div>
                        

                      </div>
                      
                      {!puedeEditarCelda && (
                        <div className="readonly-indicator">
                          <FaEyeSlash className="readonly-icon" />
                          <span className="readonly-text">Solo lectura</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ObservacionesTable;
