import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import {
  DiagramController,
  ViewObserver,
} from "./controllers/DiagramController.js";
import { InvitationController } from "./controllers/InvitationController.js";
import { DiagramSnapshotController } from "./controllers/DiagramSnapshotController.js";
import { JsonPatchOperation } from "./validation/UMLValidator.js";
import { UserModel } from "./models/UserModel.js";

const app = express();
const server = createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:5173", // Vite dev server
//     methods: ["GET", "POST"],
//   },
// });
const io = null; // Temporalmente deshabilitado

const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Instancia del controlador (única para toda la aplicación)
const diagramController = new DiagramController();
const invitationController = new InvitationController();
const diagramSnapshotController = new DiagramSnapshotController();

// Conexiones activas - mapea socket.id a viewId
const activeConnections = new Map<string, string>();

// io.on("connection", (socket) => {
//   console.log(`Cliente conectado: ${socket.id}`);

//   // Crear observador para esta vista (socket)
//   const viewObserver: ViewObserver = {
//     id: socket.id,
//     notify: (operation: JsonPatchOperation, newState: any) => {
//       // Enviar notificación a la vista específica
//       socket.emit("diagram:update", { operation, newState });
//     },
//   };

//   // Registrar la vista en el controlador
//   const unregisterView = diagramController.registerView(
//     socket.id,
//     viewObserver
//   );

//   // Manejar unión a sala de diagrama
//   socket.on("diagram:join", (diagramId: string) => {
//     socket.join(`diagram-${diagramId}`);
//     activeConnections.set(socket.id, diagramId);
//     console.log(`Cliente ${socket.id} se unió al diagrama ${diagramId}`);

//     // Notificar a otros clientes en la sala
//     socket.to(`diagram-${diagramId}`).emit("user:joined", {
//       userId: socket.id,
//       timestamp: Date.now(),
//     });
//   });

//   // Manejar operaciones del diagrama - MVC Pattern
//   socket.on("diagram:operation", async (operation: JsonPatchOperation) => {
//     try {
//       console.log(`Operación recibida de vista ${socket.id}:`, operation);

//       // El controlador procesa la operación a través del modelo
//       const result = await diagramController.processOperation(
//         socket.id,
//         operation
//       );

//       if (result.success) {
//         // Confirmar operación a la vista que la envió
//         socket.emit("operation:confirmed", {
//           operation,
//           timestamp: Date.now(),
//         });

//         console.log(`Operación confirmada para vista ${socket.id}`);
//       } else {
//         // Rechazar operación con errores
//         socket.emit("operation:rejected", {
//           operation,
//           reason: result.errors?.join(", ") || "Error desconocido",
//           timestamp: Date.now(),
//         });

//         console.log(
//           `Operación rechazada para vista ${socket.id}:`,
//           result.errors
//         );
//       }
//     } catch (error) {
//       console.error(`Error procesando operación de vista ${socket.id}:`, error);
//       socket.emit("operation:error", {
//         operation,
//         error: "Error interno del servidor",
//         timestamp: Date.now(),
//       });
//     }
//   });

//   // Manejar desconexión
//   socket.on("disconnect", () => {
//     const diagramId = activeConnections.get(socket.id);
//     if (diagramId) {
//       // Notificar a otros clientes en la sala
//       socket.to(`diagram-${diagramId}`).emit("user:left", {
//         userId: socket.id,
//         timestamp: Date.now(),
//       });
//       activeConnections.delete(socket.id);
//     }

//     // Remover la vista del controlador
//     unregisterView();

//     console.log(`Cliente desconectado: ${socket.id}`);
//   });
// });

// Rutas HTTP para estadísticas y estado
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// Endpoint de prueba para validación de credenciales
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`Intento de login - Email: ${email}`);

    const userModel = new UserModel();
    const user = await userModel.validateCredentials(email, password);

    console.log(`Resultado validación - Usuario encontrado: ${!!user}`);
    if (user) {
      console.log(`Login exitoso para: ${user.email}`);
      res.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email },
      });
    } else {
      console.log(`Login fallido para: ${email}`);
      res.status(401).json({ success: false, error: "Credenciales inválidas" });
    }
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Endpoint de prueba para registro de usuarios
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Faltan campos requeridos: name, email, password" });
    }

    const userModel = new UserModel();
    const newUser = await userModel.create({ name, email, password });

    res.status(201).json({
      success: true,
      user: { id: newUser.id, name: newUser.name, email: newUser.email },
    });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.get("/diagram/stats", (req, res) => {
  const stats = diagramController.getStatistics();
  res.json(stats);
});

app.get("/diagram/state", (req, res) => {
  const state = diagramController.getCurrentState();
  res.json(state);
});

// Rutas API para invitaciones
app.post("/api/invitations", (req, res) =>
  invitationController.createInvitation(req, res)
);
app.get("/api/invitations/user/:userId", (req, res) =>
  invitationController.getInvitationsByUser(req, res)
);
app.get("/api/invitations/:id", (req, res) =>
  invitationController.getInvitationById(req, res)
);
app.post("/api/invitations/:id/accept", (req, res) =>
  invitationController.acceptInvitation(req, res)
);
app.post("/api/invitations/:id/reject", (req, res) =>
  invitationController.rejectInvitation(req, res)
);
app.delete("/api/invitations/:id", (req, res) =>
  invitationController.deleteInvitation(req, res)
);
app.get("/api/invitations", (req, res) =>
  invitationController.getAllInvitations(req, res)
);

// Endpoint de prueba
app.get("/api/test", (req, res) => {
  res.json({
    message: "API funcionando correctamente",
    timestamp: new Date().toISOString(),
  });
});

// Rutas API para diagramas
app.get("/api/diagrams/check-name", (req, res) =>
  diagramSnapshotController.checkDiagramNameExists(req, res)
);
app.get("/api/diagrams/user/:userId", (req, res) =>
  diagramSnapshotController.getDiagramsByUser(req, res)
);
app.post("/api/diagrams", (req, res) =>
  diagramSnapshotController.createDiagram(req, res)
);

// Iniciar servidor
server
  .listen(PORT, () => {
    console.log(`🚀 Servidor MVC corriendo en http://localhost:${PORT}`);
    console.log(`📊 WebSocket listo para conexiones`);
    console.log(`🎯 Patrón MVC implementado: Vista -> Controlador -> Modelo`);
  })
  .on("error", (error) => {
    console.error("Error al iniciar servidor:", error);
    process.exit(1);
  });

// Manejar errores no capturados
process.on("uncaughtException", (error) => {
  console.error("Error no capturado:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Rechazo no manejado en:", promise, "razón:", reason);
  process.exit(1);
});

export { app, server, io };
