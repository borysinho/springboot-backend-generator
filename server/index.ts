import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { UMLValidator } from "./validation/UMLValidator";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Estado del servidor
let diagramState: any = {
  elements: {},
  relationships: {},
};

const umlValidator = new UMLValidator();

// Conexiones activas
const activeConnections = new Map<string, string>();

io.on("connection", (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);

  // Enviar estado inicial del diagrama
  socket.emit("diagram:state", diagramState);

  // Manejar unión a sala de diagrama
  socket.on("diagram:join", (diagramId: string) => {
    socket.join(`diagram-${diagramId}`);
    activeConnections.set(socket.id, diagramId);
    console.log(`Cliente ${socket.id} se unió al diagrama ${diagramId}`);

    // Notificar a otros clientes
    socket.to(`diagram-${diagramId}`).emit("user:joined", {
      userId: socket.id,
      timestamp: Date.now(),
    });
  });

  // Manejar operaciones del diagrama
  socket.on("diagram:operation", async (operation: any) => {
    try {
      console.log(`Operación recibida de ${socket.id}:`, operation);

      // Validar operación con reglas UML
      const validationResult = await umlValidator.validateOperation(
        operation,
        diagramState
      );

      if (!validationResult.valid) {
        socket.emit("operation:rejected", {
          operation,
          reason: validationResult.errors.join(", "),
          timestamp: Date.now(),
        });
        return;
      }

      // Aplicar operación al estado del diagrama
      applyOperationToState(operation);

      // Broadcast a otros clientes en el mismo diagrama
      const diagramId = activeConnections.get(socket.id);
      if (diagramId) {
        socket.to(`diagram-${diagramId}`).emit("diagram:operation", {
          operation,
          timestamp: Date.now(),
        });
      }

      // Confirmar operación al cliente emisor
      socket.emit("operation:confirmed", {
        operation,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Error procesando operación:", error);
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
      socket.to(`diagram-${diagramId}`).emit("user:left", {
        userId: socket.id,
        timestamp: Date.now(),
      });
      activeConnections.delete(socket.id);
    }
    console.log(`Cliente desconectado: ${socket.id}`);
  });
});

/**
 * Aplica una operación al estado del diagrama
 */
function applyOperationToState(operation: any): void {
  const { op, path, value } = operation;
  const pathParts = path.split("/").filter((p: string) => p !== "");

  if (pathParts.length < 2) return;

  const collection = pathParts[0];
  const itemId = pathParts[1];
  const attribute = pathParts[2];

  if (collection === "elements") {
    if (op === "add" && value) {
      diagramState.elements[itemId] = value;
    } else if (op === "remove") {
      delete diagramState.elements[itemId];
    } else if (op === "replace" && attribute) {
      if (!diagramState.elements[itemId]) diagramState.elements[itemId] = {};
      diagramState.elements[itemId][attribute] = value;
    }
  } else if (collection === "relationships") {
    if (op === "add" && value) {
      diagramState.relationships[itemId] = value;
    } else if (op === "remove") {
      delete diagramState.relationships[itemId];
    } else if (op === "replace" && attribute) {
      if (!diagramState.relationships[itemId])
        diagramState.relationships[itemId] = {};
      diagramState.relationships[itemId][attribute] = value;
    }
  }
}

// Rutas HTTP
app.get("/health", (req: any, res: any) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

app.get("/diagram/:id", (req: any, res: any) => {
  res.json(diagramState);
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 WebSocket listo para conexiones`);
});

export { app, server, io };
