"use strict";
import { Router } from "express";
import { registerOrResolveDevice } from "../controllers/equipo.controller.js";

const router = Router();
router.post("/register-or-resolve", registerOrResolveDevice);

export default router;
