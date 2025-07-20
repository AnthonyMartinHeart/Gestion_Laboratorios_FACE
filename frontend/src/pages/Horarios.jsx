import HorarioLaboratorios from "@components/Horarios-Lab";
import { useAuth } from "@context/AuthContext";

export default function HorarioPage() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'administrador';

  return (
    <div className="horario-container">
      <div className="header-section">
        <h1 className="hh">
          Horario de Clases de los Laboratorios de Computación
        </h1>
      </div>

      <HorarioLaboratorios />
    </div>
  );
}
