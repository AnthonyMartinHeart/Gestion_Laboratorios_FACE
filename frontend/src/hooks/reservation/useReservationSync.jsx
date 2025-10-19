import { useState, useEffect, useCallback } from 'react';
import { getAllReservations } from '@services/reservation.service.js';

const useReservationSync = (labId) => {
  const [reservedPCs, setReservedPCs] = useState(new Map());
  const [loading, setLoading] = useState(false);

  // Función para obtener el rango de PCs del laboratorio
  const getLabPCRange = useCallback((labId) => {
    switch (labId) {
      case 'lab1': return { start: 1, end: 40 };
      case 'lab2': return { start: 41, end: 60 };
      case 'lab3': return { start: 61, end: 80 };
      default: return { start: 1, end: 40 };
    }
  }, []);

  // Función para verificar si una reserva está activa ahora
  const isReservationActive = useCallback((reservation) => {
    // Verificar que la reserva esté en estado "active" solo si el campo existe
    if (reservation.status && reservation.status !== 'active') {
      console.log('Reserva no está activa (status):', reservation.status, reservation);
      return false;
    }

    // Las reservas de mantenimiento siempre están activas (si tienen status active o no tienen status)
    if (reservation.carrera === 'MAINTENANCE') {
      console.log('Reserva de mantenimiento activa:', reservation);
      return true;
    }

    const now = new Date();
    
    // Convertir la hora de término a minutos desde medianoche
    const [horaTermino, minutoTermino] = reservation.horaTermino.split(':').map(Number);
    const tiempoTerminoEnMinutos = horaTermino * 60 + minutoTermino;
    
    // Convertir la hora actual a minutos desde medianoche
    const tiempoActualEnMinutos = now.getHours() * 60 + now.getMinutes();
    
    // Si faltan 35 minutos o menos para que termine la reserva, no mostrarla como ocupada
    const minutosHastaTermino = tiempoTerminoEnMinutos - tiempoActualEnMinutos;
    if (minutosHastaTermino <= 35) {
      console.log(`PC ${reservation.pcId} - Reserva por terminar en ${minutosHastaTermino} minutos, mostrando como disponible`);
      return false;
    }

    // Usar fecha local en lugar de UTC
    const today = now.getFullYear() + '-' + 
                  String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                  String(now.getDate()).padStart(2, '0');
    
    // Normalizar la fecha de la reserva (extraer solo la parte de fecha)
    let reservationDate = reservation.fechaReserva;
    if (reservationDate.includes('T')) {
      reservationDate = reservationDate.split('T')[0];
    }
    
    console.log('Verificando reserva:', {
      pc: reservation.pcId,
      fechaReserva: reservationDate,
      fechaHoy: today,
      horaInicio: reservation.horaInicio,
      horaTermino: reservation.horaTermino,
      carrera: reservation.carrera,
      status: reservation.status || 'sin status'
    });
    
    // Solo considerar reservas de hoy
    if (reservationDate !== today) {
      console.log('Reserva no es de hoy, descartando');
      return false;
    }

    // Para reservas normales, mostrar todas las del día actual
    // (no filtrar por hora para que se vean durante todo el día)
    console.log('Reserva activa del día actual');
    return true;
  }, []);

  // Función para cargar reservas desde el backend
  const loadReservations = useCallback(async () => {
    try {
      setLoading(true);
      const reservations = await getAllReservations();
      
      if (!Array.isArray(reservations)) {
        console.error('Reservas no es un array:', reservations);
        return;
      }

      const { start, end } = getLabPCRange(labId);
      const newReservedPCs = new Map();

      console.log(`=== CARGANDO RESERVAS PARA ${labId.toUpperCase()} ===`);
      console.log('Rango de PCs:', { start, end });
      console.log('Total reservas recibidas:', reservations.length);

      // Filtrar solo las reservas activas del laboratorio actual
      const activeReservations = reservations.filter(reservation => {
        const pcInRange = reservation.pcId >= start && reservation.pcId <= end;
        const isActive = isReservationActive(reservation);
        
        console.log(`PC ${reservation.pcId}: enRango=${pcInRange}, activa=${isActive}`);
        
        return pcInRange && isActive;
      });

      console.log('Reservas activas filtradas:', activeReservations.length);

      // Procesar reservas activas
      activeReservations.forEach(reservation => {
        const endTime = new Date();
        const [endHour, endMin] = reservation.horaTermino.split(':').map(Number);
        endTime.setHours(endHour, endMin, 0, 0);

        const reservationData = {
          id: reservation.id,
          horaInicio: reservation.horaInicio,
          horaTermino: reservation.horaTermino,
          carrera: reservation.carrera,
          rut: reservation.rut,
          endTime: endTime.getTime(),
          isClassBlock: reservation.carrera === 'ADMIN',
          isMaintenance: reservation.carrera === 'MAINTENANCE'
        };

        console.log(`Agregando reserva para PC ${reservation.pcId}:`, reservationData);

        // Log para debug de mantenimiento
        if (reservation.carrera === 'MAINTENANCE') {
          console.log('Reserva de mantenimiento encontrada:', reservation);
        }

        newReservedPCs.set(reservation.pcId, reservationData);
      });

      console.log('=== MAPA FINAL DE RESERVAS ===');
      console.log('PCs reservados:', Array.from(newReservedPCs.keys()));
      console.log('Detalles completos:', newReservedPCs);

      setReservedPCs(newReservedPCs);
    } catch (error) {
      console.error('Error al cargar reservas:', error);
    } finally {
      setLoading(false);
    }
  }, [labId, getLabPCRange, isReservationActive]);

  // Cargar reservas al montar el componente
  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  // Polling cada 5 segundos para sincronizar en tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      loadReservations();
    }, 5000); // 5 segundos

    return () => clearInterval(interval);
  }, [loadReservations]);

  // Función para verificar si un PC está reservado
  const isReserved = useCallback((pcNumber) => {
    const reservation = reservedPCs.get(pcNumber);
    
    console.log(`Verificando si PC ${pcNumber} está reservado:`, {
      tieneReserva: !!reservation,
      reserva: reservation,
      esBloque: reservation?.isClassBlock,
      esMantenimiento: reservation?.isMaintenance
    });
    
    if (!reservation) return false;
    
    // Solo considerar como "reservado" si es una reserva individual (no bloque de clases ni mantenimiento)
    const isIndividualReservation = !reservation.isClassBlock && !reservation.isMaintenance;
    console.log(`PC ${pcNumber} - es reserva individual:`, isIndividualReservation);
    
    return isIndividualReservation;
  }, [reservedPCs]);

  // Función para verificar si un PC está en mantenimiento
  const isInMaintenance = useCallback((pcNumber) => {
    const reservation = reservedPCs.get(pcNumber);
    const inMaintenance = reservation && reservation.isMaintenance;
    if (inMaintenance) {
      console.log(`PC ${pcNumber} está en mantenimiento:`, reservation);
    }
    return inMaintenance;
  }, [reservedPCs]);

  // Función para verificar si hay bloques de clases activos
  const getActiveClassBlocks = useCallback(() => {
    const blocks = new Map();
    const now = new Date().getTime();

    reservedPCs.forEach((reservation, pcNumber) => {
      if (reservation.isClassBlock && reservation.endTime > now) {
        const blockKey = `${labId}_${reservation.horaInicio}_${reservation.horaTermino}`;
        if (!blocks.has(blockKey)) {
          blocks.set(blockKey, {
            horaInicio: reservation.horaInicio,
            horaTermino: reservation.horaTermino,
            title: 'CLASES', // O podríamos extraer esto de algún campo adicional
            endTime: reservation.endTime
          });
        }
      }
    });

    return blocks;
  }, [reservedPCs, labId]);

  // Función para verificar si estamos en un bloque de clases activo
  const isInClassBlock = useCallback(() => {
    const classBlocks = getActiveClassBlocks();
    const now = new Date().getTime();

    for (const [blockKey, block] of classBlocks) {
      const [blockLabId, horaInicio, horaTermino] = blockKey.split('_');
      if (blockLabId === labId) {
        // Verificar si estamos dentro del horario del bloque
        const startTime = new Date();
        const [startHour, startMin] = horaInicio.split(':').map(Number);
        startTime.setHours(startHour, startMin, 0, 0);
        
        const endTime = new Date();
        const [endHour, endMin] = horaTermino.split(':').map(Number);
        endTime.setHours(endHour, endMin, 0, 0);
        
        if (now >= startTime.getTime() && now <= endTime.getTime()) {
          return { active: true, block };
        }
      }
    }
    
    return { active: false, block: null };
  }, [getActiveClassBlocks, labId]);

  return {
    reservedPCs,
    loading,
    isReserved,
    isInMaintenance,
    isInClassBlock,
    getActiveClassBlocks,
    refreshReservations: loadReservations
  };
};

export default useReservationSync;
