"use strict";
import { Router } from "express";
import { endSession, startSession } from "../controllers/sesion.controller.js";

const router = Router();
router.post("/start", startSession);
router.post("/end", endSession); // o PATCH /:id/end si prefieres

export default router;
