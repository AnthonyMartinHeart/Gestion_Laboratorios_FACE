import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { connectSocket, disconnectSocket, emitUserLogin } from '@services/socket.service';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const navigate = useNavigate();
    const [user, setUser] = useState(() => {
        const storedUser = sessionStorage.getItem('usuario');
        if (storedUser) {
            try {
                return JSON.parse(storedUser);
            } catch {
                return null;
            }
        }
        return null;
    });
    const isAuthenticated = Boolean(user);

    const logout = () => {
        console.log('Ejecutando logout...');
        disconnectSocket(); // Desconectar socket al hacer logout
        localStorage.removeItem('token');
        sessionStorage.removeItem('usuario');
        setUser(null); // Cambiado de '' a null para consistencia
        navigate('/auth', { replace: true });
    };

    useEffect(() => {
        if (!isAuthenticated) {
            disconnectSocket(); // Desconectar socket si no está autenticado
            navigate('/auth');
        } else {
            // Conectar socket cuando el usuario está autenticado
            console.log('👤 Usuario autenticado, conectando socket...');
            const socket = connectSocket();
            
            // Esperar un momento para asegurar la conexión
            setTimeout(() => {
                emitUserLogin(user);
            }, 100);
        }

        // Cleanup: desconectar al desmontar
        return () => {
            if (!isAuthenticated) {
                disconnectSocket();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, navigate]);

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
