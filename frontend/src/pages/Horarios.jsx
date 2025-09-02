import HorarioLaboratorios from "@components/Horarios-Lab";
import { useAuth } from "@context/AuthContext";

export default function HorarioPage({ laboratorio }) {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'administrador';

  return (
    <div className="horario-container">
      <div className="header-section">
        <h1 className="hh">
          {laboratorio 
            ? `Horario de Clases del Laboratorio ${laboratorio}` 
            : "Horario de Clases de los Laboratorios de Computación"
          }
        </h1>
      </div>

      <HorarioLaboratorios laboratorio={laboratorio} />
    </div>
  );
}
