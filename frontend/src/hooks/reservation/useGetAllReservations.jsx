import { useState, useEffect } from 'react';
import { getAllReservations } from '@services/reservation.service.js';

export const useGetAllReservations = (labId, selectedDate) => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchReservations = async () => {
        if (!labId || !selectedDate) {
            console.log('⚠️ No hay labId o fecha seleccionada:', { labId, selectedDate });
            return;
        }

        setLoading(true);
        try {
            // 1. Obtener datos
            const response = await getAllReservations();
            console.log('📥 Respuesta completa del servidor:', response);

            // 2. Extraer array de reservas
            let allReservations;
            if (response?.data) {
                allReservations = response.data;
                console.log('🔄 Usando response.data:', allReservations);
            } else if (Array.isArray(response)) {
                allReservations = response;
                console.log('🔄 Usando response directo:', allReservations);
            } else {
                console.error('❌ Formato de respuesta inesperado:', response);
                throw new Error('Formato de respuesta inválido');
            }

            // 3. Normalizar fecha para comparación
            const targetDate = new Date(selectedDate).toISOString().split('T')[0];
            const targetLabId = parseInt(labId);

            console.log('🎯 Buscando reservas para:', {
                fecha: targetDate,
                laboratorio: targetLabId
            });

            // 4. Filtrar reservas (excluir reservas de mantenimiento)
            const filtered = allReservations.filter(reserva => {
                // Convertir y validar datos de la reserva
                const reservaLabId = parseInt(reserva.labId);
                const reservaDate = new Date(reserva.fechaReserva).toISOString().split('T')[0];

                // Excluir reservas de mantenimiento de la bitácora
                if (reserva.carrera === 'MAINTENANCE') {
                    console.log('� Excluyendo reserva de mantenimiento:', reserva);
                    return false;
                }

                console.log('�🔍 Evaluando reserva:', {
                    id: reserva.id,
                    fecha: reservaDate,
                    lab: reservaLabId,
                    pc: reserva.pcId,
                    rut: reserva.rut,
                    horaInicio: reserva.horaInicio,
                    horaFin: reserva.horaTermino,
                    carrera: reserva.carrera,
                    coincideFecha: reservaDate === targetDate,
                    coincideLab: reservaLabId === targetLabId
                });

                return reservaDate === targetDate && reservaLabId === targetLabId;
            });

            console.log('✅ Reservas filtradas:', filtered);
            
            if (filtered.length > 0) {
                console.log('📋 Detalles de las reservas encontradas:', 
                    filtered.map(r => ({
                        pc: r.pcId,
                        inicio: r.horaInicio,
                        fin: r.horaTermino,
                        rut: r.rut
                    }))
                );
            } else {
                console.log('⚠️ No se encontraron reservas para la fecha y laboratorio seleccionados');
            }

            setReservations(filtered);
            setError(null);

        } catch (err) {
            console.error('❌ Error al obtener reservas:', err);
            setError('Error al cargar las reservas');
            setReservations([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReservations();
    }, [labId, selectedDate]);

    return {
        reservations,
        loading,
        error,
        refetch: fetchReservations
    };
};
