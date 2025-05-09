import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { logout } from "@services/auth.service.js";
import Swal from "sweetalert2";
import "@styles/navbar.css";
import { useState, useEffect } from "react";
import { HiArrowSmLeft, HiArrowSmRight } from "react-icons/hi";
import { FaHome, FaBook, FaClock, FaUsers, FaUser } from "react-icons/fa";
import { ImExit } from "react-icons/im";
import logoWhite from "../assets/GL-WHITE.png";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  let user = null;
  try {
    user = JSON.parse(sessionStorage.getItem("usuario")) || null;
  } catch {
    user = null;
  }

  const userRole = user?.rol;

  useEffect(() => {
    document.body.setAttribute("data-navbar-collapsed", !menuOpen);
  }, [menuOpen]);

  const logoutSubmit = () => {
    try {
      logout();
      navigate("/auth");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const handleLogoutClick = () => {
    Swal.fire({
      title: "¿Seguro que quieres salir?",
      text: "Tu sesión será cerrada.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, salir",
      cancelButtonText: "Cancelar"
    }).then((result) => {
      if (result.isConfirmed) {
        logoutSubmit();
      }
    });
  };

  const toggleMenu = () => {
    setMenuOpen(prev => !prev);
  };

  return (
    <nav className={`navbar2 ${menuOpen ? "activado" : "oculta"}`}>
      <button className="flechamenu" onClick={toggleMenu}>
        {menuOpen ? <HiArrowSmLeft className="toggle-icon" /> : <HiArrowSmRight className="toggle-icon" />}
      </button>

      {menuOpen && (
        <div className={`nav-menu ${menuOpen ? "activado" : ""}`}>
          <ul>
            <li>
              <NavLink to="/home" className={({ isActive }) => (isActive ? "active" : "")}>
                <FaHome className="nav-icon" />
                <span>Inicio</span>
              </NavLink>
            </li>

            {(userRole === "administrador" || userRole === "consultor") && (
              <>
                <li>
                  <NavLink to="/bitacoras" className={({ isActive }) => (isActive ? "active" : "")}>
                    <FaBook className="nav-icon" />
                    <span>Bitácoras</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/turnos" className={({ isActive }) => (isActive ? "active" : "")}>
                    <FaClock className="nav-icon" />
                    <span>Turnos</span>
                  </NavLink>
                </li>
              </>
            )}

            {userRole === "administrador" && (
              <li>
                <NavLink to="/users" className={({ isActive }) => (isActive ? "active" : "")}>
                  <FaUsers className="nav-icon" />
                  <span>Usuarios</span>
                </NavLink>
              </li>
            )}

            <li>
              <NavLink to="/mi-perfil" className={({ isActive }) => (isActive ? "active" : "")}>
                <FaUser className="nav-icon" />
                <span>Mi Perfil</span>
              </NavLink>
            </li>

            <li className="logout-item">
              <NavLink
                to="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleLogoutClick();
                  setMenuOpen(false);
                }}
                className="logout-link"
              >
                <ImExit className="nav-icon" />
                <span>Cerrar sesión</span>
              </NavLink>
            </li>
          </ul>

          <div className="navbar-bottom-logo">
            <img
              src={logoWhite}
              alt="Logo institucional"
              className="bottom-logo-img"
            />
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
