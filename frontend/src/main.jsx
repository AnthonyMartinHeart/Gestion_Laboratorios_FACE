import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from '@pages/Login';
import Home from '@pages/Home';
import Users from '@pages/Users';
import Register from '@pages/Register';
import Error404 from '@pages/Error404';
import Root from '@pages/Root';
import ProtectedRoute from '@components/ProtectedRoute';
import SelectPC from '@pages/SelectPC';
import Turnos from '@pages/Turnos';      
import Bitacoras from '@pages/Bitacoras'; 
import MiPerfil from '@pages/MiPerfil';
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
        path: '/turnos',
        element: (
          <ProtectedRoute allowedRoles={['administrador', 'consultor']}>
            <Turnos />
          </ProtectedRoute>
        ),
      },,
      {
        path: '/bitacoras',
        element: (
          <ProtectedRoute allowedRoles={['administrador', 'consultor']}>
            <Bitacoras />
          </ProtectedRoute>
        ),
      },
      {
        path: '/mi-perfil',
        element: (
          <ProtectedRoute allowedRoles={['administrador', 'consultor', 'usuario']}>
            <MiPerfil />
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
