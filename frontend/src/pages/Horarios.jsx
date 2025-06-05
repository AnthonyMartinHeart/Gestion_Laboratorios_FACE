import HorarioLaboratorios from "@components/Horarios-Lab";

export default function HorarioPage() {

  return (

    <div className="horario-container p-6">

      <hh className="hh text-3xl font-bold mb-6 text-center">

        Horario de Clases de los Laboratorios de Computación
      </hh>

      <HorarioLaboratorios />

    </div>

  );
  
}
