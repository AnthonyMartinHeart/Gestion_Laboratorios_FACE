"use strict";
import { Router } from "express";
import { getHealth } from "../controllers/chequeo.controller.js";

const router = Router();
router.get("/", getHealth);
export default router;