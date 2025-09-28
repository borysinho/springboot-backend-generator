import { createServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import express from "express";
import { DiagramModel } from "./models/DiagramModel.ts";
import { DiagramController } from "./controllers/DiagramController.ts";

const PORT = process.env.PORT || 3000;

// Crear aplicación Express
const app = express();
const server = createServer(app);

// Configurar Socket.IO con CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware para parsear JSON
app.use(express.json());

// Inicializar el modelo (persistencia en memoria)
const diagramModel = new DiagramModel();

// Inicializar el controlador
const diagramController = new DiagramController(diagramModel, io);

// Rutas HTTP para información del servidor
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    connections: diagramController.getActiveConnections().length,
    diagramVersion: diagramController.getModelState().version,
  });
});

app.get("/diagram", (req, res) => {
  res.json(diagramController.getModelState());
});

app.get("/connections", (req, res) => {
  res.json({
    total: diagramController.getActiveConnections().length,
    connections: diagramController.getActiveConnections(),
  });
});

// Ruta para reiniciar el diagrama (útil para desarrollo)
app.post("/reset", (req, res) => {
  diagramModel.clear();
  diagramController.clearConnections();

  res.json({
    message: "Diagram reset successfully",
    timestamp: new Date().toISOString(),
  });
});

// Middleware de logging para desarrollo
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log("🚀 Servidor MVC iniciado");
  console.log(`📡 Servidor HTTP corriendo en puerto ${PORT}`);
  console.log(`🔌 Socket.IO configurado para conexiones WebSocket`);
  console.log(`🌐 Frontend esperado en: http://localhost:5173`);
  console.log(
    `📊 Modelo de diagrama inicializado con versión: ${diagramModel.getVersion()}`
  );
});

// Manejo de señales para cierre graceful
process.on("SIGINT", () => {
  console.log("\n🛑 Recibida señal SIGINT, cerrando servidor...");

  diagramController.clearConnections();
  io.close();
  server.close(() => {
    console.log("✅ Servidor cerrado correctamente");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Recibida señal SIGTERM, cerrando servidor...");

  diagramController.clearConnections();
  io.close();
  server.close(() => {
    console.log("✅ Servidor cerrado correctamente");
    process.exit(0);
  });
});

export { app, server, io, diagramModel, diagramController };
