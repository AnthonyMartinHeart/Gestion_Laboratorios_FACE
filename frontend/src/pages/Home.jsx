import { NavLink } from "react-router-dom"; // Importa NavLink para la navegación
import '@styles/Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <h5>Bienvenido al Sistema de Gestor de Laboratorios</h5>
      <h2>Selecciona el laboratorio que se encuentre actualmente</h2>
      <div className="lab-buttons">
        <NavLink to="/select-pc/lab1">
          <button className="lab-button">LAB 1</button>
        </NavLink>
        <NavLink to="/select-pc/lab2">
          <button className="lab-button">LAB 2</button>
        </NavLink>
        <NavLink to="/select-pc/lab3">
          <button className="lab-button">LAB 3</button>
        </NavLink>
      </div>
    </div>
  );
};

export default Home;
