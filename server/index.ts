import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import {
  DiagramController,
  ViewObserver,
} from "./controllers/DiagramController.js";
import { JsonPatchOperation } from "./validation/UMLValidator.js";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Vite dev server
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Instancia del controlador (única para toda la aplicación)
const diagramController = new DiagramController();

// Conexiones activas - mapea socket.id a viewId
const activeConnections = new Map<string, string>();

io.on("connection", (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);

  // Crear observador para esta vista (socket)
  const viewObserver: ViewObserver = {
    id: socket.id,
    notify: (operation: JsonPatchOperation, newState: any) => {
      // Enviar notificación a la vista específica
      socket.emit("diagram:update", { operation, newState });
    },
  };

  // Registrar la vista en el controlador
  const unregisterView = diagramController.registerView(
    socket.id,
    viewObserver
  );

  // Manejar unión a sala de diagrama
  socket.on("diagram:join", (diagramId: string) => {
    socket.join(`diagram-${diagramId}`);
    activeConnections.set(socket.id, diagramId);
    console.log(`Cliente ${socket.id} se unió al diagrama ${diagramId}`);

    // Notificar a otros clientes en la sala
    socket.to(`diagram-${diagramId}`).emit("user:joined", {
      userId: socket.id,
      timestamp: Date.now(),
    });
  });

  // Manejar operaciones del diagrama - MVC Pattern
  socket.on("diagram:operation", async (operation: JsonPatchOperation) => {
    try {
      console.log(`Operación recibida de vista ${socket.id}:`, operation);

      // El controlador procesa la operación a través del modelo
      const result = await diagramController.processOperation(
        socket.id,
        operation
      );

      if (result.success) {
        // Confirmar operación a la vista que la envió
        socket.emit("operation:confirmed", {
          operation,
          timestamp: Date.now(),
        });

        console.log(`Operación confirmada para vista ${socket.id}`);
      } else {
        // Rechazar operación con errores
        socket.emit("operation:rejected", {
          operation,
          reason: result.errors?.join(", ") || "Error desconocido",
          timestamp: Date.now(),
        });

        console.log(
          `Operación rechazada para vista ${socket.id}:`,
          result.errors
        );
      }
    } catch (error) {
      console.error(`Error procesando operación de vista ${socket.id}:`, error);
      socket.emit("operation:error", {
        operation,
        error: "Error interno del servidor",
        timestamp: Date.now(),
      });
    }
  });

  // Manejar desconexión
  socket.on("disconnect", () => {
    const diagramId = activeConnections.get(socket.id);
    if (diagramId) {
      // Notificar a otros clientes en la sala
      socket.to(`diagram-${diagramId}`).emit("user:left", {
        userId: socket.id,
        timestamp: Date.now(),
      });
      activeConnections.delete(socket.id);
    }

    // Remover la vista del controlador
    unregisterView();

    console.log(`Cliente desconectado: ${socket.id}`);
  });
});

// Rutas HTTP para estadísticas y estado
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

app.get("/diagram/stats", (req, res) => {
  const stats = diagramController.getStatistics();
  res.json(stats);
});

app.get("/diagram/state", (req, res) => {
  const state = diagramController.getCurrentState();
  res.json(state);
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor MVC corriendo en http://localhost:${PORT}`);
  console.log(`📊 WebSocket listo para conexiones`);
  console.log(`🎯 Patrón MVC implementado: Vista -> Controlador -> Modelo`);
});

export { app, server, io };
