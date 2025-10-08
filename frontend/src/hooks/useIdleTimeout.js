import { useState, useEffect } from 'react';

const useIdleTimeout = (idleTime = 360000) => { // 6 minutos por defecto (en milisegundos)
    const [isIdle, setIsIdle] = useState(false);
    const [lastActivity, setLastActivity] = useState(Date.now());

    useEffect(() => {
        const handleActivity = () => {
            setLastActivity(Date.now());
            setIsIdle(false);
        };

        // Eventos que reinician el temporizador de inactividad
        const events = [
            'mousedown',
            'mousemove',
            'keydown',
            'scroll',
            'touchstart',
            'click'
        ];

        // Agregar listeners para todos los eventos
        events.forEach(event => {
            document.addEventListener(event, handleActivity);
        });

        // Comprobar inactividad cada minuto
        const interval = setInterval(() => {
            const timeSinceLastActivity = Date.now() - lastActivity;
            if (timeSinceLastActivity >= idleTime && !isIdle) {
                setIsIdle(true);
            }
        }, 60000); // Revisar cada minuto

        return () => {
            // Limpiar listeners y el intervalo
            events.forEach(event => {
                document.removeEventListener(event, handleActivity);
            });
            clearInterval(interval);
        };
    }, [idleTime, lastActivity, isIdle]);

    const resetIdleTimer = () => {
        setLastActivity(Date.now());
        setIsIdle(false);
    };

    return { isIdle, resetIdleTimer };
};

export default useIdleTimeout;
