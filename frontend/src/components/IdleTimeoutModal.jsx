import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import '@styles/IdleTimeoutModal.css';

const IdleTimeoutModal = ({ isOpen, onClose, onKeepSession, timeoutInSeconds = 30 }) => {
    const [timeLeft, setTimeLeft] = useState(timeoutInSeconds);
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    const handleLogout = () => {
        logout();
    };

    useEffect(() => {
        let timer;
        const checkAndLogout = async () => {
            if (timeLeft <= 0) {
                if (timer) clearInterval(timer);
                await handleLogout();
            }
        };

        if (isOpen && timeLeft > 0) {
            timer = setInterval(async () => {
                setTimeLeft(prevTime => {
                    const newTime = prevTime - 1;
                    if (newTime <= 0) {
                        checkAndLogout();
                    }
                    return newTime;
                });
            }, 1000);
        }

        checkAndLogout();

        return () => {
            if (timer) {
                clearInterval(timer);
            }
        };
    }, [isOpen, timeLeft]);

    useEffect(() => {
        if (isOpen) {
            setTimeLeft(timeoutInSeconds);
        }
    }, [isOpen, timeoutInSeconds]);

    if (!isOpen) return null;

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    return (
        <div className="idle-timeout-overlay">
            <div className="idle-timeout-modal">
                <div className="modal-header">
                    <div className="clock-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle className="clock-face" cx="12" cy="12" r="10"/>
                            <polyline className="clock-hand" points="12 6 12 12 16 14"/>
                        </svg>
                    </div>
                    <h2>¿Aún estás ahí {user?.nombreCompleto ? user.nombreCompleto.split(' ')[0].charAt(0).toUpperCase() + user.nombreCompleto.split(' ')[0].slice(1).toLowerCase() : ''}?</h2>
                </div>
                <p>Tu sesión va a finalizar en:</p>
                <div className="idle-timeout-timer">{formattedTime}</div>
                <div className="idle-timeout-buttons">
                    <button 
                        className="idle-timeout-button close-session" 
                        onClick={handleLogout}
                    >
                        Cerrar sesión
                    </button>
                    <button 
                        className="idle-timeout-button keep-session" 
                        onClick={() => {
                            onKeepSession();
                            onClose();
                        }}
                    >
                        Seguir conectado
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IdleTimeoutModal;
