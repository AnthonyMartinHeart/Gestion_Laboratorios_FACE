import { useState, useEffect, useCallback } from "react";
import useClasesAprobadas from "@hooks/solicitudes/useClasesAprobadas";
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

  // Cargar datos iniciales desde el hook de sincronización y pintar clases aprobadas
  const { clasesAprobadas } = useClasesAprobadas();
  useEffect(() => {
    // Función para clonar y pintar clases aprobadas en la tabla
    function getDiaSemanaFromFecha(fecha) {
      // Devuelve el nombre del día en español en mayúsculas (ej: 'LUNES')
      const diasES = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
      const d = new Date(fecha);
      return diasES[d.getDay()];
    }

    function pintarClasesEnTabla(tabla, clases, labNumber) {
      // Clonar la tabla para no mutar el estado original
      const nuevaTabla = tabla.map(row => [...row]);
      console.log('--- CLASES APROBADAS PARA LAB', labNumber, '---');
      clases.forEach(clase => {
        // Log de depuración de cada clase
        console.log({
          laboratorio: clase.laboratorio,
          fecha: clase.fecha,
          diasSemana: clase.diasSemana,
          horaInicio: clase.horaInicio,
          horaTermino: clase.horaTermino,
          titulo: clase.titulo,
          descripcion: clase.descripcion
        });
        if (Number(clase.laboratorio?.replace('lab', '')) !== labNumber) return;

        // --- DETERMINAR DÍAS DE LA CLASE ---
        let diasClase = [];
        if (clase.tipoSolicitud === 'unica' && clase.fecha) {
          // Única: calcular día de la semana desde la fecha
          diasClase = [getDiaSemanaFromFecha(clase.fecha)];
        } else if (clase.tipoSolicitud === 'recurrente' && Array.isArray(clase.diasSemana)) {
          // Recurrente: usar array de días
          diasClase = clase.diasSemana.map(d => d.toUpperCase().normalize('NFD').replace(/[
