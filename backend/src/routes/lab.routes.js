"use strict";
import { Router } from "express";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { isAdmin } from "../middlewares/authorization.middleware.js";
import {
  getLabsConfig,
  updateLabFreeMode,
} from "../controllers/labConfig.controller.js";

const router = Router();

// Todas estas rutas requieren admin logeado
router.use(authenticateJwt, isAdmin);

router.get("/config", getLabsConfig);
router.patch("/:labId/free-mode", updateLabFreeMode);

export default router;
