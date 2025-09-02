import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from '@pages/Login';
import Home from '@pages/Home';
import Users from '@pages/Users';
import Administradores from '@pages/Administradores';
import Alumnos from '@pages/Alumnos';
import Profesores from '@pages/Profesores';
import Register from '@pages/Register';
import Error404 from '@pages/Error404';
import Root from '@pages/Root';
import ProtectedRoute from '@components/ProtectedRoute';
import SelectPC from '@pages/SelectPC';
import Turnos from '@pages/Turnos';   
import Horarios from '@pages/Horarios';   
import Bitacoras from '@pages/Bitacoras'; 
import MiPerfil from '@pages/MiPerfil';
import MisReservas from '@pages/MisReservas';
import MisSolicitudes from '@pages/MisSolicitudes';
import MisClases from '@pages/MisClases';
import Estadisticas from '@pages/Estadisticas';
import GestionTareas from '@pages/GestionTareas';
import '@styles/styles.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    errorElement: <Error404 />,
    children: [
      {
        path: '/home',
        element: <Home />,
      },
      {
        path: '/select-pc/:labId',
        element: <SelectPC />,
      },
      {
        path: '/users',
        element: (
          <ProtectedRoute allowedRoles={['administrador']}>
            <Users />
          </ProtectedRoute>
        ),
      },
      {
        path: '/administradores',
        element: (
          <ProtectedRoute allowedRoles={['administrador']}>
            <Administradores />
          </ProtectedRoute>
        ),
      },
      {
        path: '/alumnos',
        element: (
          <ProtectedRoute allowedRoles={['administrador']}>
            <Alumnos />
          </ProtectedRoute>
        ),
      },
      {
        path: '/profesores',
        element: (
          <ProtectedRoute allowedRoles={['administrador']}>
            <Profesores />
          </ProtectedRoute>
        ),
      },
      {
        path: '/turnos',
        element: (
          <ProtectedRoute allowedRoles={['administrador', 'consultor']}>
            <Turnos />
          </ProtectedRoute>
        ),
      },
      {
        path: '/bitacoras',
        element: (
          <ProtectedRoute allowedRoles={['administrador', 'consultor']}>
            <Bitacoras />
          </ProtectedRoute>
        ),
      },
      {
        path: '/laboratorio-1',
        element: (
          <ProtectedRoute allowedRoles={['administrador', 'consultor']}>
            <Bitacoras laboratorio={1} />
          </ProtectedRoute>
        ),
      },
      {
        path: '/laboratorio-2',
        element: (
          <ProtectedRoute allowedRoles={['administrador', 'consultor']}>
            <Bitacoras laboratorio={2} />
          </ProtectedRoute>
        ),
      },
      {
        path: '/laboratorio-3',
        element: (
          <ProtectedRoute allowedRoles={['administrador', 'consultor']}>
            <Bitacoras laboratorio={3} />
          </ProtectedRoute>
        ),
      },
      {
        path: '/mi-perfil',
        element: (
          <ProtectedRoute allowedRoles={['administrador', 'consultor', 'usuario', 'estudiante', 'profesor']}>
            <MiPerfil />
          </ProtectedRoute>
        ),
      },
      {
        path: '/mis-reservas',
        element: (
          <ProtectedRoute allowedRoles={['estudiante', 'consultor']}>
            <MisReservas />
          </ProtectedRoute>
        ),
      },
      {
        path: '/mis-solicitudes',
        element: (
          <ProtectedRoute allowedRoles={['administrador', 'profesor']}>
            <MisSolicitudes />
          </ProtectedRoute>
        ),
      },
      {
        path: '/mis-clases',
        element: (
          <ProtectedRoute allowedRoles={['profesor']}>
            <MisClases />
          </ProtectedRoute>
        ),
      },

      {
        path: '/horarios',
        element: (
          <ProtectedRoute allowedRoles={['administrador', 'consultor']}>
            <Horarios />
          </ProtectedRoute>
        ),
      },
      {
        path: '/horarios-laboratorio-1',
        element: (
          <ProtectedRoute allowedRoles={['administrador', 'consultor']}>
            <Horarios laboratorio={1} />
          </ProtectedRoute>
        ),
      },
      {
        path: '/horarios-laboratorio-2',
        element: (
          <ProtectedRoute allowedRoles={['administrador', 'consultor']}>
            <Horarios laboratorio={2} />
          </ProtectedRoute>
        ),
      },
      {
        path: '/horarios-laboratorio-3',
        element: (
          <ProtectedRoute allowedRoles={['administrador', 'consultor']}>
            <Horarios laboratorio={3} />
          </ProtectedRoute>
        ),
      },
      {
        path: '/estadisticas',
        element: (
          <ProtectedRoute allowedRoles={['administrador']}>
            <Estadisticas />
          </ProtectedRoute>
        ),
      },
      {
        path: '/gestion-tareas',
        element: (
          <ProtectedRoute allowedRoles={['administrador', 'consultor']}>
            <GestionTareas />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '/auth',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />
);
