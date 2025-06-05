import { NavLink } from "react-router-dom"; // Importa NavLink para la navegación
import '@styles/Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <h5>Bienvenido al Gestor de Laboratorios FACE</h5>
      <h2>Seleccione Su Laboratorio 👇</h2>
     <div className="lab-buttons">
     <NavLink to="/select-pc/lab1">
    <button className="lab-button lab1-button">LAB 1</button>
   </NavLink>
   <NavLink to="/select-pc/lab2">
    <button className="lab-button lab2-button">LAB 2</button>
   </NavLink>
   <NavLink to="/select-pc/lab3">
    <button className="lab-button lab3-button">LAB 3</button>
  </NavLink>
</div>
    </div>
  );
};

export default Home;
