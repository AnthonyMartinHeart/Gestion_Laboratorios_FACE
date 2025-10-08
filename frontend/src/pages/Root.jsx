import { Outlet } from 'react-router-dom';
import Navbar from '@components/Navbar';
import { AuthProvider } from '@context/AuthContext';
import { useEffect, useState } from 'react';
import IdleTimeoutModal from '@components/IdleTimeoutModal';
import useIdleTimeout from '@hooks/useIdleTimeout';
import { useAuth } from '@context/AuthContext';

function Root() {
  return (
    <AuthProvider>
      <Layout />
    </AuthProvider>
  );
}

function Layout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isIdle, resetIdleTimer } = useIdleTimeout(); // Usa el valor por defecto de 6 minutos
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const collapsed = document.body.getAttribute("data-navbar-collapsed") === "true";
      setIsCollapsed(collapsed);
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-navbar-collapsed']
    });
    
    const initialCollapsed = document.body.getAttribute("data-navbar-collapsed") === "true";
    setIsCollapsed(initialCollapsed);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isIdle && user) {
      setShowTimeoutModal(true);
    }
  }, [isIdle, user]);

  const handleKeepSession = () => {
    resetIdleTimer();
    setShowTimeoutModal(false);
  };

  return (
    <div className={`app-layout ${isCollapsed ? 'collapsed' : 'expanded'}`}>
      <Navbar />
      <main className={`main-content ${isCollapsed ? 'collapsed' : 'expanded'}`}>
        <Outlet />
      </main>
      {user && (
        <IdleTimeoutModal
          isOpen={showTimeoutModal}
          onClose={() => setShowTimeoutModal(false)}
          onKeepSession={handleKeepSession}
          timeoutInSeconds={30}
        />
      )}
    </div>
  );
}

export default Root;
