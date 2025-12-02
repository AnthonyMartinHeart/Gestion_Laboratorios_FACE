"use strict";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import indexRoutes from "./routes/index.routes.js";
import session from "express-session";
import passport from "passport";
import express, { json, urlencoded } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { cookieKey, HOST, PORT } from "./config/configEnv.js";
import { connectDB } from "./config/configDb.js";
import { createUsers } from "./config/initialSetup.js";
import { passportJwtSetup } from "./auth/passport.auth.js";
import { setIO } from "./services/socket.service.js";

// Set para almacenar usuarios conectados
const connectedUsers = new Set();

async function setupServer() {
  try {
    const app = express();
    const httpServer = createServer(app);
    
    // Configurar Socket.IO
    const io = new Server(httpServer, {
      cors: {
        origin: true,
        credentials: true,
      },
    });

    setIO(io);//---------------


    app.disable("x-powered-by");

    app.use(
      cors({
        credentials: true,
        origin: true,
      }),
    );

    app.use(
      urlencoded({
        extended: true,
        limit: "10mb",
      }),
    );

    app.use(
      json({
        limit: "10mb",
      }),
    );

    app.use(cookieParser());

    app.use(morgan("dev"));

    app.use(
      session({
        secret: cookieKey,
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: false,
          httpOnly: true,
          sameSite: "strict",
        },
      }),
    );

    app.use(passport.initialize());
    app.use(passport.session());

    passportJwtSetup();

    app.use("/api", indexRoutes);

    // Socket.IO - Manejar conexiones
    io.on("connection", (socket) => {
      console.log("🔌 Usuario conectado:", socket.id);

      socket.on("subscribe_lab", ({ labId }) => {
      const id = Number(labId);
      if (!Number.isFinite(id)) return;

      const roomName = `lab_${id}`;
      socket.join(roomName);

      socket.emit("subscribed_lab", { labId: id });
      console.log(` Socket ${socket.id} suscrito a sala ${roomName}`);
      });
      
      // Enviar el conteo actual al nuevo usuario conectado
      socket.emit("users-count", connectedUsers.size);

      socket.on("user-login", (userData) => {
        connectedUsers.add(socket.id);
        console.log(`✅ Usuario ${socket.id} hizo login. Total: ${connectedUsers.size}`);
        console.log('📋 Usuarios conectados:', Array.from(connectedUsers));
        
        // Emitir a todos los clientes el nuevo conteo
        io.emit("users-count", connectedUsers.size);
      });

      // Nuevo evento para obtener el conteo actual
      socket.on("get-users-count", () => {
        console.log(`📊 Cliente ${socket.id} solicita conteo actual: ${connectedUsers.size}`);
        socket.emit("users-count", connectedUsers.size);
      });

      socket.on("user-logout", () => {
        connectedUsers.delete(socket.id);
        console.log(`👋 Usuario ${socket.id} hizo logout. Total: ${connectedUsers.size}`);
        
        // Emitir a todos los clientes el nuevo conteo
        io.emit("users-count", connectedUsers.size);
      });

      socket.on("disconnect", (reason) => {
        connectedUsers.delete(socket.id);
        console.log(`❌ Usuario ${socket.id} desconectado (${reason}). Total: ${connectedUsers.size}`);
        
        // Emitir a todos los clientes el nuevo conteo
        io.emit("users-count", connectedUsers.size);
      });
    });

    httpServer.listen(PORT, () => {
      console.log(`=> Servidor corriendo en ${HOST}:${PORT}/api`);
      console.log(`=> WebSocket disponible en ${HOST}:${PORT}`);
    });
  } catch (error) {
    console.log("Error en index.js -> setupServer(), el error es: ", error);
  }
}

async function setupAPI() {
  try {
    await connectDB();
    await setupServer();
    await createUsers();
  } catch (error) {
    console.log("Error en index.js -> setupAPI(), el error es: ", error);
  }
}

setupAPI()
  .then(() => console.log("=> API Iniciada exitosamente"))
  .catch((error) =>
    console.log("Error en index.js -> setupAPI(), el error es: ", error),
  );
