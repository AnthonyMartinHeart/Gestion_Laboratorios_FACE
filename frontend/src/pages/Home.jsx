import { useState } from "react";
import { NavLink } from "react-router-dom"; 
import { useAuth } from '@context/AuthContext';
import '@styles/Home.css';

const Home = () => {
  const { user } = useAuth();
  const esProfesor = user?.rol === 'profesor';
  
  // Estado para la clase del fondo
  const [bgClass, setBgClass] = useState("");

  // Funciones para manejar hover
  const handleMouseEnter = (lab) => {
    setBgClass(lab);  // "lab1", "lab2" o "lab3"
  };

  const handleMouseLeave = () => {
    setBgClass("");  // vuelve al fondo por defecto
  };

  return (
    <div className={`home-container ${bgClass}`}>
      <h5 className={esProfesor ? 'titulo-profesor' : ''}>"Bienvenido al Gestor de Laboratorios FACE"</h5>
      
      {!esProfesor && (
        <>
          <h2>
            Seleccione Su Laboratorio <span className="emoji-animate">👇</span>
          </h2>

          <div className="lab-buttons">
            <NavLink to="/select-pc/lab1">
              <button 
                className="lab-button lab1-button"
                onMouseEnter={() => handleMouseEnter("lab1")}
                onMouseLeave={handleMouseLeave}
              >
                LAB 1
              </button>
            </NavLink>

            <NavLink to="/select-pc/lab2">
              <button 
                className="lab-button lab2-button"
                onMouseEnter={() => handleMouseEnter("lab2")}
                onMouseLeave={handleMouseLeave}
              >
                LAB 2
              </button>
            </NavLink>

            <NavLink to="/select-pc/lab3">
              <button 
                className="lab-button lab3-button"
                onMouseEnter={() => handleMouseEnter("lab3")}
                onMouseLeave={handleMouseLeave}
              >
                LAB 3
              </button>
            </NavLink>
          </div>
        </>
      )}
    </div>
  );
};

export default Home;
