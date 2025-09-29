import { createServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import express from "express";
import { DiagramController } from "./controllers/DiagramController";

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

// Inicializar el controlador MVC simple
const diagramController = new DiagramController(io);

// Rutas HTTP para información del servidor
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    message: "Controlador MVC simple funcionando",
  });
});

app.get("/diagram", (req, res) => {
  res.json({
    message: "Diagrama no implementado en controlador simple",
    timestamp: new Date().toISOString(),
  });
});

app.get("/connections", (req, res) => {
  res.json({
    message: "Conexiones no rastreadas en controlador simple",
    timestamp: new Date().toISOString(),
  });
});

// Ruta para reiniciar (placeholder)
app.post("/reset", (req, res) => {
  res.json({
    message: "Reset no implementado en controlador simple",
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
    `� Controlador MVC simple listo para recibir operaciones JSON Patch`
  );
});

// Manejo de señales para cierre graceful
process.on("SIGINT", () => {
  console.log("\n🛑 Recibida señal SIGINT, cerrando servidor...");

  io.close();
  server.close(() => {
    console.log("✅ Servidor cerrado correctamente");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Recibida señal SIGTERM, cerrando servidor...");

  io.close();
  server.close(() => {
    console.log("✅ Servidor cerrado correctamente");
    process.exit(0);
  });
});

export { app, server, io, diagramController };
