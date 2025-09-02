import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { logout } from "@services/auth.service.js";
import Swal from "sweetalert2";
import "@styles/navbar.css";
import { useState, useEffect } from "react";
import { HiArrowSmLeft, HiArrowSmRight } from "react-icons/hi";
import { FaHome, FaBook, FaClock, FaUsers, FaUser, FaCalendarAlt, FaChartBar, FaClipboardList, FaFileAlt, FaChalkboardTeacher, FaTasks, FaChevronDown, FaChevronRight, FaUserShield, FaGraduationCap, FaUserTie, FaFlask } from "react-icons/fa";
import { ImExit } from "react-icons/im";
import logoWhite from "../assets/GL-WHITE.png";
import NotificationBell from "./NotificationBell";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [usuariosSubmenuOpen, setUsuariosSubmenuOpen] = useState(false);
  const [bitacorasSubmenuOpen, setBitacorasSubmenuOpen] = useState(false);
  const [horariosSubmenuOpen, setHorariosSubmenuOpen] = useState(false);
  const [estadisticasSubmenuOpen, setEstadisticasSubmenuOpen] = useState(false);

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

  const toggleUsuariosSubmenu = () => {
    setUsuariosSubmenuOpen(prev => !prev);
  };

  const toggleBitacorasSubmenu = () => {
    setBitacorasSubmenuOpen(prev => !prev);
  };

  const toggleHorariosSubmenu = () => {
    setHorariosSubmenuOpen(prev => !prev);
  };

  const toggleEstadisticasSubmenu = () => {
    setEstadisticasSubmenuOpen(prev => !prev);
  };

  // Verificar si estamos en alguna página de usuarios
  const isUsuariosActive = location.pathname.includes('/users') || 
                           location.pathname.includes('/administradores') || 
                           location.pathname.includes('/alumnos') || 
                           location.pathname.includes('/profesores');

  // Verificar si estamos en alguna página de bitácoras
  const isBitacorasActive = location.pathname.includes('/bitacoras') ||
                           location.pathname.includes('/laboratorio-1') ||
                           location.pathname.includes('/laboratorio-2') ||
                           location.pathname.includes('/laboratorio-3');

  // Verificar si estamos en alguna página de horarios
  const isHorariosActive = location.pathname.includes('/horarios') ||
                          location.pathname.includes('/horarios-laboratorio-1') ||
                          location.pathname.includes('/horarios-laboratorio-2') ||
                          location.pathname.includes('/horarios-laboratorio-3');

  // Verificar si estamos en alguna página de estadísticas
  const isEstadisticasActive = location.pathname.includes('/estadisticas') ||
                              location.pathname.includes('/estadisticas-lab-1') ||
                              location.pathname.includes('/estadisticas-lab-2') ||
                              location.pathname.includes('/estadisticas-lab-3') ||
                              location.pathname.includes('/estadisticas-asistencia');

  return (
    <nav className={`navbar2 ${menuOpen ? "activado" : "oculta"}`}>
      <div className="navbar-top-section">
        <button className="flechamenu" onClick={toggleMenu}>
          {menuOpen ? <HiArrowSmLeft className="toggle-icon" /> : <HiArrowSmRight className="toggle-icon" />}
        </button>
        
        {/* Campanita de notificaciones - siempre visible */}
        <div className="notification-container">
          <NotificationBell />
        </div>
      </div>

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
    <li className="submenu-item">
      <div 
        className={`submenu-toggle ${isBitacorasActive ? 'active' : ''}`}
        onClick={toggleBitacorasSubmenu}
      >
        <FaBook className="nav-icon" />
        <span>Bitácoras</span>
        {bitacorasSubmenuOpen ? 
          <FaChevronDown className="submenu-arrow" /> : 
          <FaChevronRight className="submenu-arrow" />
        }
      </div>
      <ul className={`submenu ${bitacorasSubmenuOpen ? 'submenu-open' : ''}`}>
        <li>
          <NavLink to="/laboratorio-1" className={({ isActive }) => (isActive ? "active" : "")}>
            <FaFlask className="nav-icon submenu-icon" />
            <span>Laboratorio 1</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/laboratorio-2" className={({ isActive }) => (isActive ? "active" : "")}>
            <FaFlask className="nav-icon submenu-icon" />
            <span>Laboratorio 2</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/laboratorio-3" className={({ isActive }) => (isActive ? "active" : "")}>
            <FaFlask className="nav-icon submenu-icon" />
            <span>Laboratorio 3</span>
          </NavLink>
        </li>
      </ul>
    </li>
    <li>
      <NavLink to="/turnos" className={({ isActive }) => (isActive ? "active" : "")}>
        <FaClock className="nav-icon" />
        <span>Turnos</span>
      </NavLink>
    </li>
    <li className="submenu-item">
      <div 
        className={`submenu-toggle ${isHorariosActive ? 'active' : ''}`}
        onClick={toggleHorariosSubmenu}
      >
        <FaCalendarAlt className="nav-icon" />
        <span>Horarios</span>
        {horariosSubmenuOpen ? 
          <FaChevronDown className="submenu-arrow" /> : 
          <FaChevronRight className="submenu-arrow" />
        }
      </div>
      <ul className={`submenu ${horariosSubmenuOpen ? 'submenu-open' : ''}`}>
        <li>
          <NavLink to="/horarios-laboratorio-1" className={({ isActive }) => (isActive ? "active" : "")}>
            <FaFlask className="nav-icon submenu-icon" />
            <span>Laboratorio 1</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/horarios-laboratorio-2" className={({ isActive }) => (isActive ? "active" : "")}>
            <FaFlask className="nav-icon submenu-icon" />
            <span>Laboratorio 2</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/horarios-laboratorio-3" className={({ isActive }) => (isActive ? "active" : "")}>
            <FaFlask className="nav-icon submenu-icon" />
            <span>Laboratorio 3</span>
          </NavLink>
        </li>
      </ul>
    </li>
    <li>
      <NavLink to="/gestion-tareas" className={({ isActive }) => (isActive ? "active" : "")}>
        <FaTasks className="nav-icon" />
        <span>{userRole === "administrador" ? "Gestión de Tareas" : "Mis Tareas"}</span>
      </NavLink>
    </li>
  </>
)}

            {userRole === "administrador" && (
              <>
                <li className="submenu-item">
                  <div 
                    className={`submenu-toggle ${isUsuariosActive ? 'active' : ''}`}
                    onClick={toggleUsuariosSubmenu}
                  >
                    <FaUsers className="nav-icon" />
                    <span>Usuarios</span>
                    {usuariosSubmenuOpen ? 
                      <FaChevronDown className="submenu-arrow" /> : 
                      <FaChevronRight className="submenu-arrow" />
                    }
                  </div>
                  <ul className={`submenu ${usuariosSubmenuOpen ? 'submenu-open' : ''}`}>
                    <li>
                      <NavLink to="/administradores" className={({ isActive }) => (isActive ? "active" : "")}>
                        <FaUserShield className="nav-icon submenu-icon" />
                        <span>Administradores</span>
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/profesores" className={({ isActive }) => (isActive ? "active" : "")}>
                        <FaUserTie className="nav-icon submenu-icon" />
                        <span>Profesores</span>
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/alumnos" className={({ isActive }) => (isActive ? "active" : "")}>
                        <FaGraduationCap className="nav-icon submenu-icon" />
                        <span>Alumnos</span>
                      </NavLink>
                    </li>
                  </ul>
                </li>
                <li className="submenu-item">
                  <div 
                    className={`submenu-toggle ${isEstadisticasActive ? 'active' : ''}`}
                    onClick={toggleEstadisticasSubmenu}
                  >
                    <FaChartBar className="nav-icon" />
                    <span>Estadísticas</span>
                    {estadisticasSubmenuOpen ? 
                      <FaChevronDown className="submenu-arrow" /> : 
                      <FaChevronRight className="submenu-arrow" />
                    }
                  </div>
                  <ul className={`submenu ${estadisticasSubmenuOpen ? 'submenu-open' : ''}`}>
                    <li>
                      <NavLink to="/estadisticas-lab-1" className={({ isActive }) => (isActive ? "active" : "")}>
                        <FaFlask className="nav-icon submenu-icon" />
                        <span>Laboratorio 1</span>
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/estadisticas-lab-2" className={({ isActive }) => (isActive ? "active" : "")}>
                        <FaFlask className="nav-icon submenu-icon" />
                        <span>Laboratorio 2</span>
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/estadisticas-lab-3" className={({ isActive }) => (isActive ? "active" : "")}>
                        <FaFlask className="nav-icon submenu-icon" />
                        <span>Laboratorio 3</span>
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/estadisticas-asistencia" className={({ isActive }) => (isActive ? "active" : "")}>
                        <FaClock className="nav-icon submenu-icon" />
                        <span>Asistencia Consultores</span>
                      </NavLink>
                    </li>
                  </ul>
                </li>
              </>
            )}

            {(userRole === "estudiante" || userRole === "consultor") && (
              <li>
                <NavLink to="/mis-reservas" className={({ isActive }) => (isActive ? "active" : "")}>
                  <FaClipboardList className="nav-icon" />
                  <span>Mis Reservas</span>
                </NavLink>
              </li>
            )}

            {(userRole === "administrador" || userRole === "profesor") && (
              <li>
                <NavLink to="/mis-solicitudes" className={({ isActive }) => (isActive ? "active" : "")}>
                  <FaFileAlt className="nav-icon" />
                  <span>Mis Solicitudes</span>
                </NavLink>
              </li>
            )}

            {userRole === "profesor" && (
              <li>
                <NavLink to="/mis-clases" className={({ isActive }) => (isActive ? "active" : "")}>
                  <FaChalkboardTeacher className="nav-icon" />
                  <span>Mis Clases</span>
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
