"use strict";
import { Router } from "express";
import userRoutes from "./user.routes.js";
import authRoutes from "./auth.routes.js";
import reservationRoutes from "./reservation.routes.js";
import horarioRoutes from "./horario.routes.js";
import estadisticasRoutes from "./estadisticas.routes.js";

const router = Router();

router
    .use("/auth", authRoutes)
    .use("/user", userRoutes)
    .use("/reservas", reservationRoutes)
    .use("/horarios", horarioRoutes)
    .use("/estadisticas", estadisticasRoutes);

export default router;
