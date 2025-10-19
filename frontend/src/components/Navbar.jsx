import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { logout } from "@services/auth.service.js";
import Swal from "sweetalert2";
import "@styles/navbar.css";
import { useState, useEffect } from "react";
import { HiArrowSmLeft, HiArrowSmRight } from "react-icons/hi";
import { FaHome, FaBook, FaClock, FaUsers, FaUser, FaCalendarAlt, FaChartBar, FaClipboardList, FaFileAlt, FaChalkboardTeacher, FaTasks, FaChevronDown, FaChevronRight, FaUserShield, FaGraduationCap, FaUserTie, FaFlask, FaSignOutAlt, FaEye } from "react-icons/fa";
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
  const [hoveredSubmenu, setHoveredSubmenu] = useState(null);
  const [submenuPosition, setSubmenuPosition] = useState({ top: 0 });
  const [hoverTimeout, setHoverTimeout] = useState(null);

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

  const handleSubmenuHover = (e, submenuType) => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const centerY = rect.top + (rect.height / 2);
    setSubmenuPosition({ top: centerY });
    setHoveredSubmenu(submenuType);
  };

  const handleSubmenuLeave = () => {
    const timeout = setTimeout(() => {
      setHoveredSubmenu(null);
    }, 150); // Delay de 150ms antes de ocultar
    setHoverTimeout(timeout);
  };

  const handleSubmenuMouseEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
  };

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

      {/* Iconos siempre visibles cuando está colapsada */}
      {!menuOpen && (
        <div className="collapsed-menu">
          <div className="collapsed-main-items">
            <div className="collapsed-item" data-tooltip="Inicio">
              <NavLink to="/home">
                <FaHome className="collapsed-icon" />
              </NavLink>
            </div>

          {(userRole === "administrador" || userRole === "consultor" || userRole === "profesor") && (
            <>
              {(userRole === "administrador" || userRole === "consultor") && (
                <>
                  <div 
                    className="collapsed-item submenu-collapsed" 
                    data-tooltip="Bitácoras"
                    onMouseEnter={(e) => handleSubmenuHover(e, 'bitacoras')}
                    onMouseLeave={handleSubmenuLeave}
                  >
                    <div className="collapsed-icon-wrapper">
                      <FaBook className="collapsed-icon" />
                    </div>
                    {hoveredSubmenu === 'bitacoras' && (
                      <div 
                        className="hover-submenu"
                        style={{ top: submenuPosition.top, transform: 'translateY(-50%)' }}
                        onMouseEnter={handleSubmenuMouseEnter}
                        onMouseLeave={handleSubmenuLeave}
                      >
                        <NavLink to="/laboratorio-1" className="hover-submenu-item">
                          <FaFlask className="hover-submenu-icon" />
                          <span>Laboratorio 1</span>
                        </NavLink>
                        <NavLink to="/laboratorio-2" className="hover-submenu-item">
                          <FaFlask className="hover-submenu-icon" />
                          <span>Laboratorio 2</span>
                        </NavLink>
                        <NavLink to="/laboratorio-3" className="hover-submenu-item">
                          <FaFlask className="hover-submenu-icon" />
                          <span>Laboratorio 3</span>
                        </NavLink>
                      </div>
                    )}
                  </div>

                  <div className="collapsed-item" data-tooltip="Turnos">
                    <NavLink to="/turnos">
                      <FaClock className="collapsed-icon" />
                    </NavLink>
                  </div>

                  <div className="collapsed-item" data-tooltip="Observaciones">
                    <NavLink to="/observaciones">
                      <FaEye className="collapsed-icon" />
                    </NavLink>
                  </div>
                </>
              )}

              {/* Sección de Horarios - visible para admin, consultor y profesor */}
              <div 
                className="collapsed-item submenu-collapsed" 
                data-tooltip="Horarios"
                onMouseEnter={(e) => handleSubmenuHover(e, 'horarios')}
                onMouseLeave={handleSubmenuLeave}
              >
                <div className="collapsed-icon-wrapper">
                  <FaCalendarAlt className="collapsed-icon" />
                </div>
                {hoveredSubmenu === 'horarios' && (
                  <div 
                    className="hover-submenu"
                    style={{ top: submenuPosition.top, transform: 'translateY(-50%)' }}
                    onMouseEnter={handleSubmenuMouseEnter}
                    onMouseLeave={handleSubmenuLeave}
                  >
                    <NavLink to="/horarios-laboratorio-1" className="hover-submenu-item">
                      <FaFlask className="hover-submenu-icon" />
                      <span>Laboratorio 1</span>
                    </NavLink>
                    <NavLink to="/horarios-laboratorio-2" className="hover-submenu-item">
                      <FaFlask className="hover-submenu-icon" />
                      <span>Laboratorio 2</span>
                    </NavLink>
                    <NavLink to="/horarios-laboratorio-3" className="hover-submenu-item">
                      <FaFlask className="hover-submenu-icon" />
                      <span>Laboratorio 3</span>
                    </NavLink>
                  </div>
                )}
              </div>

              {(userRole === "administrador" || userRole === "consultor") && (
                <div className="collapsed-item" data-tooltip={userRole === "administrador" ? "Gestión de Tareas" : "Mis Tareas"}>
                  <NavLink to="/gestion-tareas">
                    <FaTasks className="collapsed-icon" />
                  </NavLink>
                </div>
              )}
            </>
          )}

          {userRole === "administrador" && (
            <>
              <div 
                className="collapsed-item submenu-collapsed" 
                data-tooltip="Usuarios"
                onMouseEnter={(e) => handleSubmenuHover(e, 'usuarios')}
                onMouseLeave={handleSubmenuLeave}
              >
                <div className="collapsed-icon-wrapper">
                  <FaUsers className="collapsed-icon" />
                </div>
                {hoveredSubmenu === 'usuarios' && (
                  <div 
                    className="hover-submenu"
                    style={{ top: submenuPosition.top, transform: 'translateY(-50%)' }}
                    onMouseEnter={handleSubmenuMouseEnter}
                    onMouseLeave={handleSubmenuLeave}
                  >
                    <NavLink to="/administradores" className="hover-submenu-item">
                      <FaUserShield className="hover-submenu-icon" />
                      <span>Administradores</span>
                    </NavLink>
                    <NavLink to="/profesores" className="hover-submenu-item">
                      <FaUserTie className="hover-submenu-icon" />
                      <span>Profesores</span>
                    </NavLink>
                    <NavLink to="/alumnos" className="hover-submenu-item">
                      <FaGraduationCap className="hover-submenu-icon" />
                      <span>Alumnos</span>
                    </NavLink>
                  </div>
                )}
              </div>

              <div 
                className="collapsed-item submenu-collapsed" 
                data-tooltip="Reportes"
                onMouseEnter={(e) => handleSubmenuHover(e, 'estadisticas')}
                onMouseLeave={handleSubmenuLeave}
              >
                <div className="collapsed-icon-wrapper">
                  <FaChartBar className="collapsed-icon" />
                </div>
                {hoveredSubmenu === 'estadisticas' && (
                  <div 
                    className="hover-submenu"
                    style={{ top: submenuPosition.top, transform: 'translateY(-50%)' }}
                    onMouseEnter={handleSubmenuMouseEnter}
                    onMouseLeave={handleSubmenuLeave}
                  >
                    <NavLink to="/estadisticas-lab-1" className="hover-submenu-item">
                      <FaFlask className="hover-submenu-icon" />
                      <span>Laboratorio 1</span>
                    </NavLink>
                    <NavLink to="/estadisticas-lab-2" className="hover-submenu-item">
                      <FaFlask className="hover-submenu-icon" />
                      <span>Laboratorio 2</span>
                    </NavLink>
                    <NavLink to="/estadisticas-lab-3" className="hover-submenu-item">
                      <FaFlask className="hover-submenu-icon" />
                      <span>Laboratorio 3</span>
                    </NavLink>
                    <NavLink to="/estadisticas-asistencia" className="hover-submenu-item">
                      <FaClock className="hover-submenu-icon" />
                      <span>Asistencia</span>
                    </NavLink>
                  </div>
                )}
              </div>
            </>
          )}

          {(userRole === "estudiante" || userRole === "consultor") && (
            <div className="collapsed-item" data-tooltip="Mis Reservas">
              <NavLink to="/mis-reservas">
                <FaClipboardList className="collapsed-icon" />
              </NavLink>
            </div>
          )}

          {(userRole === "administrador" || userRole === "profesor") && (
            <div className="collapsed-item" data-tooltip="Mis Solicitudes">
              <NavLink to="/mis-solicitudes">
                <FaFileAlt className="collapsed-icon" />
              </NavLink>
            </div>
          )}

          {userRole === "profesor" && (
            <div className="collapsed-item" data-tooltip="Mis Clases">
              <NavLink to="/mis-clases">
                <FaChalkboardTeacher className="collapsed-icon" />
              </NavLink>
            </div>
          )}

          <div className="collapsed-item" data-tooltip="Mi Perfil">
            <NavLink to="/mi-perfil">
              <FaUser className="collapsed-icon" />
            </NavLink>
          </div>

          <div className="collapsed-item logout-collapsed" data-tooltip="Cerrar sesión">
            <button onClick={handleLogoutClick} className="collapsed-logout-btn" style={{padding:0,background:"rgba(255,255,255,0.05)",border:"none",width:44,height:44,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:10,cursor:"pointer"}}>
              <FaSignOutAlt style={{fontSize:28, color:'#fff', display:'block'}} />
            </button>
          </div>
          </div>
        </div>
      )}

      {menuOpen && (
        <div className={`nav-menu ${menuOpen ? "activado" : ""}`}>
          <ul>
            <li>
              <NavLink to="/home" className={({ isActive }) => (isActive ? "active" : "")}>
                <FaHome className="nav-icon" />
                <span>Inicio</span>
              </NavLink>
            </li>

{(userRole === "administrador" || userRole === "consultor" || userRole === "profesor") && (
  <>
    {/* Sección solo para administradores y consultores */}
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
        <li>
          <NavLink to="/observaciones" className={({ isActive }) => (isActive ? "active" : "")}>
            <FaEye className="nav-icon" />
            <span>Observaciones</span>
          </NavLink>
        </li>
      </>
    )}

    {/* Sección de Horarios - visible para admin, consultor y profesor */}
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

    {(userRole === "administrador" || userRole === "consultor") && (
      <li>
        <NavLink to="/gestion-tareas" className={({ isActive }) => (isActive ? "active" : "")}>
          <FaTasks className="nav-icon" />
          <span>{userRole === "administrador" ? "Gestión de Tareas" : "Mis Tareas"}</span>
        </NavLink>
      </li>
    )}
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
                    <span>Reportes</span>
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
                        <span>Asistencia</span>
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
                <FaSignOutAlt className="nav-icon" />
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
