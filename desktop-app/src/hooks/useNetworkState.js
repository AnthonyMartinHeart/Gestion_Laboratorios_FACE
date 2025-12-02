import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export default function useNetworkState(intervalMs = 12000) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [apiReachable, setApiReachable] = useState(true);
  const [latencyMs, setLatencyMs] = useState(null);
  const [apiBase, setApiBase] = useState(null); // viene del main por IPC
  const lastChangeAt = useRef(Date.now());
  const timer = useRef(null);

  
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cfg = await window.api?.system?.getConfig?.();
        if (mounted && cfg?.API_BASE) setApiBase(cfg.API_BASE);
      } catch {
        
      }
    })();
    return () => { mounted = false; };
  }, []);

  const checkApi = useCallback(async () => {
  try {
    const res = await window.api?.network?.health?.();
    const ok = !!res?.ok;
    setApiReachable(ok);
    setLatencyMs(null); 
    return ok;
  } catch {
    setApiReachable(false);
    setLatencyMs(null);
    return false;
  }
}, []);


  const forceCheck = useCallback(async () => {
    const ok = await checkApi();
    lastChangeAt.current = Date.now();
    return ok;
  }, [checkApi]);

  useEffect(() => {
    const online = () => { setIsOnline(true); lastChangeAt.current = Date.now(); forceCheck(); };
    const offline = () => { setIsOnline(false); lastChangeAt.current = Date.now(); setApiReachable(false); };

    window.addEventListener("online", online);
    window.addEventListener("offline", offline);

    // primer chequeo cuando tengamos apiBase
    if (apiBase) forceCheck();

    timer.current = setInterval(forceCheck, intervalMs);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
      if (timer.current) clearInterval(timer.current);
    };
  }, [forceCheck, intervalMs, apiBase]);

  return useMemo(() => ({
    isOnline,
    apiReachable,
    latencyMs,
    lastChangeAt: lastChangeAt.current,
    forceCheck,
  }), [isOnline, apiReachable, latencyMs, forceCheck]);
}
