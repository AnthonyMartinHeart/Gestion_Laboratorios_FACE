import { Outlet } from 'react-router-dom';
import Navbar from '@components/Navbar';
import { AuthProvider } from '@context/AuthContext';
import { useEffect, useState } from 'react';

function Root() {
  return (
    <AuthProvider>
      <Layout />
    </AuthProvider>
  );
}

function Layout() {
  const [isCollapsed, setIsCollapsed] = useState(false); 

  
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

  return (
    <div className={`app-layout ${isCollapsed ? 'collapsed' : 'expanded'}`}>
      <Navbar />
      <main className={`main-content ${isCollapsed ? 'collapsed' : 'expanded'}`}>
        <Outlet />
      </main>
    </div>
  );
}

export default Root;
