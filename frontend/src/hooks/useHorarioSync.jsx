import { useState, useEffect, useCallback } from 'react';
import { getHorarios, saveHorarios as saveHorariosAPI } from '@services/horarios.service.js';
import Swal from 'sweetalert2';

const useHorarioSync = () => {
  const [horarios, setHorarios] = useState(null);
  const [lastModified, setLastModified] = useState(null);
  const [modifiedBy, setModifiedBy] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Función para cargar horarios (localStorage + backend como fallback)
  const loadHorarios = useCallback(async () => {
    try {
      setIsLoading(true);
      
      console.log('=== CARGANDO HORARIOS (HÍBRIDO) ===');
      
      // Primero intentar desde localStorage (más rápido)
      const localData = JSON.parse(localStorage.getItem("horarios")) || {};
      
      // Verificar si los datos locales son recientes (menos de 30 segundos)
      const localIsRecent = localData.timestamp && 
                          (Date.now() - localData.timestamp < 30000);
      
      // Si tenemos datos locales recientes, usarlos sin consultar al backend
      if (localIsRecent && localData.lastModified && localData.lab1 && localData.lab2 && localData.lab3) {
        console.log('Usando datos locales recientes:', {
          timestamp: new Date(localData.timestamp).toLocaleTimeString(),
          lastModified: new Date(localData.lastModified).toLocaleTimeString()
        });
        
        // Siempre actualizar el estado con datos locales para evitar problemas
        setHorarios(localData);
        setLastModified(localData.lastModified);
        setModifiedBy(localData.modifiedBy);
        
        setIsLoading(false);
        return;
      }
      
      // Intentar desde backend pero sin bloquear si falla
      let backendData = null;
      try {
        backendData = await getHorarios();
        console.log('Datos del backend:', backendData);
      } catch (error) {
        console.log('Backend no disponible, usando localStorage:', error.message);
      }
      
      // Determinar qué datos usar
      let dataToUse = localData;
      
      if (backendData && !backendData.error && backendData.lastModified) {
        // Si el backend tiene datos más recientes, usarlos
        if (!localData.lastModified || 
            new Date(backendData.lastModified) > new Date(localData.lastModified)) {
          console.log('Backend tiene datos más recientes');
          dataToUse = backendData;
          // Actualizar localStorage
          localStorage.setItem("horarios", JSON.stringify(backendData));
        }
      }
      
      // Si hay datos nuevos, actualizar el estado
      if (dataToUse.lastModified && dataToUse.lastModified !== lastModified) {
        console.log('Datos nuevos detectados:', {
          anterior: lastModified,
          nuevo: dataToUse.lastModified,
          modificadoPor: dataToUse.modifiedBy,
          fuente: backendData && !backendData.error ? 'backend' : 'localStorage'
        });
        
        setHorarios(dataToUse);
        setLastModified(dataToUse.lastModified);
        setModifiedBy(dataToUse.modifiedBy);
        
        // Mostrar notificación solo si no es la carga inicial
        if (lastModified !== null) {
          Swal.fire({
            title: "🔄 Horarios actualizados",
            text: `Sincronizado - Modificado por ${dataToUse.modifiedBy || 'administrador'}`,
            icon: "success",
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 2500,
            timerProgressBar: true
          });
        }
      } else if (!dataToUse.lastModified && lastModified === null) {
        // Primera carga
        setHorarios(dataToUse);
        setLastModified(dataToUse.lastModified);
        setModifiedBy(dataToUse.modifiedBy);
      }
      
    } catch (error) {
      console.error('Error al cargar horarios:', error);
      // Fallback total a localStorage
      try {
        const localData = JSON.parse(localStorage.getItem("horarios")) || {};
        if (localData.lastModified) {
          setHorarios(localData);
          setLastModified(localData.lastModified);
          setModifiedBy(localData.modifiedBy);
        }
      } catch (localError) {
        console.error('Error al cargar desde localStorage:', localError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [lastModified]);

  // Cargar horarios al montar el componente
  useEffect(() => {
    loadHorarios();
  }, [loadHorarios]);

  // Polling cada 30 segundos para sincronizar (reducido para evitar sobrecarga al servidor)
  useEffect(() => {
    const interval = setInterval(() => {
      loadHorarios();
    }, 30000); // 30 segundos - reducido para evitar demasiadas peticiones

    return () => clearInterval(interval);
  }, [loadHorarios]);

  // Listener para eventos de storage (sincronización entre pestañas del mismo navegador)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'horarios' && e.newValue) {
        console.log('📡 Storage event detectado desde otra pestaña');
        const localData = JSON.parse(e.newValue);
        if (localData.lastModified !== lastModified) {
          console.log('Aplicando cambios desde storage event');
          setHorarios(localData);
          setLastModified(localData.lastModified);
          setModifiedBy(localData.modifiedBy);
          
          // Notificación inmediata para cambios entre pestañas
          Swal.fire({
            title: "📄 Horarios sincronizados",
            text: `Actualizado desde otra pestaña por ${localData.modifiedBy || 'administrador'}`,
            icon: "info",
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
          });
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [lastModified]);

  // Listener para BroadcastChannel (comunicación moderna entre pestañas)
  useEffect(() => {
    if (!('BroadcastChannel' in window)) return;

    const channel = new BroadcastChannel('horarios-updates');
    
    channel.onmessage = (event) => {
      if (event.data.type === 'HORARIOS_UPDATED') {
        console.log('📻 BroadcastChannel mensaje recibido:', event.data);
        
        // Aplicar cambios inmediatamente
        const newData = event.data.data;
        setHorarios(newData);
        setLastModified(newData.lastModified);
        setModifiedBy(newData.modifiedBy);
        
        // Notificación instantánea
        Swal.fire({
          title: "📡 Sincronización instantánea",
          text: `Horarios actualizados por ${newData.modifiedBy}`,
          icon: "success",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 1500
        });
      }
    };

    return () => channel.close();
  }, []);
  
  // Sincronizar cuando la ventana vuelve a tener foco (para tablets/móviles que cambian de apps)
  useEffect(() => {
    // Variables para controlar cuándo sincronizar
    let lastFocusTime = Date.now();
    const minTimeBetweenSync = 10000; // 10 segundos mínimo entre sincronizaciones
    
    const handleFocus = () => {
      const now = Date.now();
      // Solo sincronizar si ha pasado suficiente tiempo
      if (now - lastFocusTime > minTimeBetweenSync) {
        console.log('🔍 Ventana recibió foco, sincronizando...');
        loadHorarios();
        lastFocusTime = now;
      } else {
        console.log('🔍 Ventana recibió foco, pero sincronización reciente ignorada');
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadHorarios]);

  // Función para guardar horarios (localStorage + backend en background)
  const saveHorarios = useCallback(async (lab1, lab2, lab3, user) => {
    try {
      setIsLoading(true);
      
      const dataToSave = { 
        lab1, 
        lab2, 
        lab3,
        lastModified: new Date().toISOString(),
        modifiedBy: user?.nombre || 'Administrador',
        timestamp: Date.now()
      };
      
      console.log('=== GUARDANDO HORARIOS (HÍBRIDO) ===');
      console.log('Datos a guardar:', dataToSave);
      
      // 1. Guardar inmediatamente en localStorage para respuesta rápida
      localStorage.setItem("horarios", JSON.stringify(dataToSave));
      
      // 2. Actualizar estado local inmediatamente
      setHorarios(dataToSave);
      setLastModified(dataToSave.lastModified);
      setModifiedBy(dataToSave.modifiedBy);
      
      // 3. Notificar a otras pestañas inmediatamente
      try {
        // StorageEvent
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'horarios',
          newValue: JSON.stringify(dataToSave),
          oldValue: null,
          storageArea: localStorage,
          url: window.location.href
        }));

        // BroadcastChannel
        if ('BroadcastChannel' in window) {
          const channel = new BroadcastChannel('horarios-updates');
          channel.postMessage({
            type: 'HORARIOS_UPDATED',
            data: dataToSave
          });
          channel.close();
        }

        console.log('✅ Eventos de sincronización disparados');
        
      } catch (error) {
        console.log('Error al notificar cambios localmente:', error);
      }
      
      // 4. Intentar guardar en backend en background (no bloquear si falla)
      try {
        const backendResult = await saveHorariosAPI({
          lab1, 
          lab2, 
          lab3,
          modifiedBy: user?.nombre || 'Administrador'
        });
        
        if (backendResult && !backendResult.error) {
          console.log('✅ También guardado en backend exitosamente');
          // Actualizar localStorage con datos del backend si son diferentes
          if (backendResult.lastModified !== dataToSave.lastModified) {
            localStorage.setItem("horarios", JSON.stringify(backendResult));
          }
        } else {
          console.log('⚠️ Backend no disponible, solo localStorage');
        }
      } catch (backendError) {
        console.log('⚠️ Error de backend (ignorado):', backendError.message);
      }
      
      return dataToSave;
      
    } catch (error) {
      console.error('Error al guardar horarios:', error);
      
      Swal.fire({
        title: "❌ Error al guardar",
        text: `No se pudieron guardar los horarios: ${error.message}`,
        icon: "error",
        confirmButtonText: "Aceptar"
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    horarios,
    lastModified,
    modifiedBy,
    isLoading,
    saveHorarios,
    refreshHorarios: loadHorarios
  };
};

export default useHorarioSync;
