
import TurnosTable from '@components/TurnosTable';
import '@styles/turnos.css';

const Turnos = () => {
  return (
    <div className="turnos-container">
      <h1>Turnos de Consultores</h1>
      <TurnosTable />
    </div>
  );
};

export default Turnos;
