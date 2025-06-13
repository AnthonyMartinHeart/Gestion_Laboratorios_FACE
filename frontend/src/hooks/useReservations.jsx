import { useState, useEffect, useCallback } from 'react';
import {
  createReservation,
  getReservationsByPC,
  getAllReservations,
  updateReservation,
  deleteReservation,
} from '@services/reservation.service.js';

// Hook para crear reserva
export function useCreateReservation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const mutate = useCallback(async (newData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await createReservation(newData);
      if (res.error) {
        setError(res.error);
        return { success: false, error: res.error };
      }
      setSuccess(true);
      return { success: true, data: res };
    } catch (err) {
      const errorMsg = err?.response?.data?.error || err?.message || 'Error desconocido';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, loading, error, success };
}

// Hook para obtener reservas por PC y fecha
export function useGetReservationsByPC(pcId, fechaReserva) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    if (!pcId) {
      setData([]);
      return;
    }
    setLoading(true);
    setError(null);

    getReservationsByPC(pcId, fechaReserva)
      .then((res) => {
        if (!isMounted) return;
        if (res.error) {
          setError(res.error);
          setData([]);
        } else {
          setData(res);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err?.response?.data?.error || err?.message || 'Error desconocido');
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [pcId, fechaReserva]);

  return { data, loading, error };
}

// Hook para obtener todas las reservas
export function useGetAllReservations() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    getAllReservations()
      .then((res) => {
        if (!isMounted) return;
        if (res.error) {
          setError(res.error);
          setData([]);
        } else {
          setData(res);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err?.response?.data?.error || err?.message || 'Error desconocido');
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { data, loading, error };
}

// Hook para actualizar reserva
export function useUpdateReservation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const mutate = useCallback(async ({ id, data }) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await updateReservation(id, data);
      if (res.error) {
        setError(res.error);
        setLoading(false);
        return false;
      }
      setSuccess(true);
      return true;
    } catch (err) {
      setError(err?.message || 'Error desconocido');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, loading, error, success };
}

// Hook para eliminar reserva
export function useDeleteReservation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const mutate = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await deleteReservation(id);
      if (res.error) {
        setError(res.error);
        setLoading(false);
        return false;
      }
      setSuccess(true);
      return true;
    } catch (err) {
      setError(err?.message || 'Error desconocido');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, loading, error, success };
}

// Hook para obtener reservas filtradas por fecha
export function useReservationsByDate(fechaReserva) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    if (!fechaReserva) {
      setData([]);
      return;
    }

    setLoading(true);
    setError(null);

    getAllReservations()
      .then((res) => {
        if (!isMounted) return;
        if (res.error) {
          setError(res.error);
          setData([]);
        } else {
          const filtered = res.filter((r) => r.fechaReserva === fechaReserva);
          setData(filtered);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err?.response?.data?.error || err?.message || 'Error desconocido');
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [fechaReserva]);

  return { data, loading, error };
}
