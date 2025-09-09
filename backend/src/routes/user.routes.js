"use strict";
import { Router } from "express";
import { isAdmin } from "../middlewares/authorization.middleware.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import {
  deleteUser,
  getUser,
  getUsers,
  updateUser,
  setUserActive,
  getConsultores,
  updateFotoPerfil,
  getFotoPerfil,
} from "../controllers/user.controller.js";

const router = Router();

router.use(authenticateJwt); 

router
  .get("/", isAdmin, getUsers)
  .get("/consultores", isAdmin, getConsultores)
  .get("/detail/", getUser) 
  .patch("/detail/", isAdmin, updateUser)
  .delete("/detail/", isAdmin, deleteUser)
  .patch("/active", isAdmin, setUserActive)
  .patch("/foto-perfil", updateFotoPerfil)
  .get("/foto-perfil", getFotoPerfil); 

export default router;
