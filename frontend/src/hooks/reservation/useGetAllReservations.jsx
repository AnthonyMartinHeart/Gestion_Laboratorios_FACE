import { useState, useEffect } from 'react';
import { getAllReservations } from '@services/reservation.service.js';
import { obtenerSolicitudes } from '@services/solicitud.service.js';

export const useGetAllReservations = (labId, selectedDate) => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchReservations = async () => {
        if (!labId || !selectedDate) {
            return;
        }

        setLoading(true);
        try {
            // Normalizar fecha para el backend
            const targetDate = new Date(selectedDate).toISOString().split('T')[0];
            
            // 1. Obtener bitácora combinada (reservas + sesiones) desde el backend
            const response = await getAllReservations({
                from: targetDate,
                to: targetDate,
                labId: parseInt(labId)
            });

            // 2. Extraer array de reservas/sesiones
            let allReservations;
            if (response?.data) {
                allReservations = response.data;
            } else if (Array.isArray(response)) {
                allReservations = response;
            } else {
                console.error('❌ Formato de respuesta inesperado:', response);
                throw new Error('Formato de respuesta inválido');
            }

            console.log('📊 Bitácora recibida del backend:', {
                total: allReservations.length,
                muestra: allReservations.slice(0, 3)
            });

            // 3. Excluir reservas de mantenimiento de la bitácora
            const filteredReservations = allReservations.filter(reserva => {
                return reserva.carrera !== 'MAINTENANCE';
            });

            console.log('📋 Reservas filtradas:', filteredReservations.length);

            // 4. Obtener solicitudes aprobadas (solo si el usuario tiene permisos)
            let solicitudesAprobadas = [];
            try {
                const solicitudesResponse = await obtenerSolicitudes();
                
                if (solicitudesResponse?.data) {
                    solicitudesAprobadas = solicitudesResponse.data.filter(s => s.estado === 'aprobada');
                } else if (Array.isArray(solicitudesResponse)) {
                    solicitudesAprobadas = solicitudesResponse.filter(s => s.estado === 'aprobada');
                }
            } catch (solicitudError) {
                console.warn('⚠️ No se pudieron cargar solicitudes (puede ser por permisos):', solicitudError);
                // Continuar sin solicitudes si hay error de permisos
            }

            // 5. Variables ya definidas arriba para comparación con solicitudes
            const targetLabId = parseInt(labId);

            // 6. Convertir solicitudes aprobadas a formato de reserva
            const reservasFromSolicitudes = [];
            
            // Mapeo de laboratorios
            const labMap = { 'lab1': 1, 'lab2': 2, 'lab3': 3 };
            const pcRanges = {
                1: { start: 1, end: 40 },
                2: { start: 41, end: 60 },
                3: { start: 61, end: 80 }
            };
            
            solicitudesAprobadas.forEach(solicitud => {
                const solicitudLabId = labMap[solicitud.laboratorio] || parseInt(solicitud.laboratorio);
                
                // Solo procesar solicitudes del laboratorio actual
                if (solicitudLabId !== targetLabId) {
                    return;
                }
                
                // Función para verificar si una fecha específica está en la solicitud
                const isFechaEnSolicitud = (fecha, solicitud) => {
                    if (solicitud.tipoSolicitud === 'unica') {
                        const fechaSolicitud = new Date(solicitud.fecha).toISOString().split('T')[0];
                        return fechaSolicitud === fecha;
                    } else {
                        // Solicitud recurrente
                        const fechaInicio = new Date(solicitud.fecha).toISOString().split('T')[0];
                        const fechaTermino = new Date(solicitud.fechaTermino).toISOString().split('T')[0];
                        const fechaCheck = new Date(fecha);
                        
                        if (fecha < fechaInicio || fecha > fechaTermino) {
                            return false;
                        }
                        
                        // Verificar día de la semana
                        const diasSemanaMap = {
                            0: 'domingo', 1: 'lunes', 2: 'martes', 3: 'miercoles', 4: 'jueves', 5: 'viernes', 6: 'sabado'
                        };
                        const diaSemana = diasSemanaMap[fechaCheck.getDay()];
                        return solicitud.diasSemana && solicitud.diasSemana.includes(diaSemana);
                    }
                };
                
                // Verificar si la fecha seleccionada está en el rango de la solicitud
                const estaEnRango = isFechaEnSolicitud(targetDate, solicitud);
                if (!estaEnRango) {
                    return;
                }
                
                // Verificar si esta fecha específica fue cancelada
                const clasesCanceladas = solicitud.clasesCanceladas || [];
                const estaCancelada = clasesCanceladas.some(cc => {
                    if (!cc.fecha) return false;
                    const fechaCancelada = new Date(cc.fecha).toISOString().split('T')[0];
                    return fechaCancelada === targetDate;
                });
                
                // Si la clase de esta fecha fue cancelada, NO crear reservas virtuales
                if (estaCancelada) {
                    return;
                }
                
                // Crear una "reserva" para cada PC del laboratorio
                const pcRange = pcRanges[solicitudLabId];
                for (let pcId = pcRange.start; pcId <= pcRange.end; pcId++) {
                    reservasFromSolicitudes.push({
                        id: `solicitud-${solicitud.id}-pc-${pcId}`,
                        pcId: pcId,
                        labId: solicitudLabId,
                        rut: solicitud.profesorRut || '00.000.000-0',
                        carrera: 'ADMIN',
                        horaInicio: solicitud.horaInicio,
                        horaTermino: solicitud.horaTermino,
                        fechaReserva: targetDate,
                        isClassBlock: true,
                        tituloSolicitud: solicitud.titulo,
                        tipoActividad: solicitud.tipoActividad || 'Clase' // Propagar tipoActividad
                    });
                }
            });
            
            // 7. Combinar reservas normales con reservas de solicitudes
            const todasLasReservas = [...filteredReservations, ...reservasFromSolicitudes];

            setReservations(todasLasReservas);
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
