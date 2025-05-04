import BitacoraTable from '@components/BitacoraTable';
import '@styles/bitacoras.css';

const Bitacoras = () => {
  return (
    <div className="bitacoras-container">
      <h2>Laboratorio 1</h2>
      <BitacoraTable numEquipos={40} startIndex={1} />
      
      <h2>Laboratorio 2</h2>
      <BitacoraTable numEquipos={20} startIndex={41} />
      
      <h2>Laboratorio 3</h2>
      <BitacoraTable numEquipos={20} startIndex={61} />
    </div>
  );
};

export default Bitacoras;
