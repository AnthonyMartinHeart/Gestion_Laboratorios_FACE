import { useState, useEffect } from "react";
import { getSesionesByFecha } from "@services/sesion.service";

export const useGetSesiones = (labId, selectedDate) => {
    const [sesiones, setSesiones] = useState([]);

    const fetchSesiones = async () => {
        if (!labId || !selectedDate) return;

        try {
            const res = await getSesionesByFecha(selectedDate);
            const data = res?.data || [];

            const sesionesFiltradas = data.filter(s => parseInt(s.labId) === parseInt(labId));
            setSesiones(sesionesFiltradas);
        } catch (e) {
            console.error("Error obteniendo sesiones:", e);
            setSesiones([]);
        }
    };

    useEffect(() => {
        fetchSesiones();
    }, [labId, selectedDate]);

    return { sesiones, refetchSesiones: fetchSesiones };
};
