"use strict";
import { Router } from "express";
import userRoutes from "./user.routes.js";
import authRoutes from "./auth.routes.js";
import reservationRoutes from "./reservation.routes.js";
import horarioRoutes from "./horario.routes.js";
import estadisticasRoutes from "./estadisticas.routes.js";
import turnoRoutes from "./turno.routes.js";
import solicitudRoutes from "./solicitud.routes.js";
import clasesRoutes from "./clases.routes.js";
import notificacionesRoutes from "./notificaciones.routes.js";
import tareaRoutes from "./tarea.routes.js";

const router = Router();

router
    .use("/auth", authRoutes)
    .use("/user", userRoutes)
    .use("/reservas", reservationRoutes)
    .use("/horarios", horarioRoutes)
    .use("/estadisticas", estadisticasRoutes)
    .use("/turnos", turnoRoutes)
    .use("/solicitudes", solicitudRoutes)
    .use("/clases", clasesRoutes)
    .use("/notificaciones", notificacionesRoutes)
    .use("/tareas", tareaRoutes);

export default router;
