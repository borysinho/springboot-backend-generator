import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const PORT = process.env.PORT || 3001;

const app = express();
const server = createServer(app);

// Configurar CORS para el servidor
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Almacenar información de usuarios conectados
const connectedUsers = new Map<
  string,
  { id: string; name: string; connectedAt: Date }
>();

// Generar nombre de usuario único
function generateUserName(): string {
  const adjectives = [
    "Rápido",
    "Inteligente",
    "Creativo",
    "Valiente",
    "Sabio",
    "Ágil",
  ];
  const nouns = ["León", "Tigre", "Águila", "Lobo", "Oso", "Halcon"];

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 1000);

  return `${adjective}${noun}${number}`;
}

// Manejar conexiones Socket.IO
io.on("connection", (socket) => {
  console.log(`🔗 Nueva conexión: ${socket.id}`);

  // Generar nombre único para el usuario
  const userName = generateUserName();
  const userInfo = {
    id: socket.id,
    name: userName,
    connectedAt: new Date(),
  };

  // Almacenar información del usuario
  connectedUsers.set(socket.id, userInfo);

  // Enviar mensaje de bienvenida al nuevo usuario
  socket.emit("welcome", {
    message: `¡Bienvenido ${userName}!`,
    userId: socket.id,
    userName: userName,
  });

  // Notificar a todos los usuarios sobre la conexión
  io.emit("user_connected", {
    userId: socket.id,
    userName: userName,
    totalUsers: connectedUsers.size,
    connectedUsers: Array.from(connectedUsers.values()).map((user) => ({
      id: user.id,
      name: user.name,
      connectedAt: user.connectedAt,
    })),
  });

  console.log(`👤 Usuario conectado: ${userName} (ID: ${socket.id})`);
  console.log(`�� Total de conexiones: ${connectedUsers.size}`);

  // Manejar desconexiones
  socket.on("disconnect", () => {
    console.log(`👋 Usuario desconectado: ${userName} (ID: ${socket.id})`);

    // Remover usuario de la lista
    connectedUsers.delete(socket.id);

    // Notificar a todos los usuarios sobre la desconexión
    io.emit("user_disconnected", {
      userId: socket.id,
      userName: userName,
      totalUsers: connectedUsers.size,
      connectedUsers: Array.from(connectedUsers.values()).map((user) => ({
        id: user.id,
        name: user.name,
        connectedAt: user.connectedAt,
      })),
    });

    console.log(`📊 Total de conexiones: ${connectedUsers.size}`);
  });

  // Manejar operaciones JSON Patch
  socket.on("json_patch_operation", (operation) => {
    console.log(`📝 Operación JSON Patch recibida de ${userName}:`);
    console.log(`   Operación: ${operation.op}`);
    console.log(`   Ruta: ${operation.path}`);
    console.log(`   Descripción: ${operation.description}`);
    console.log(`   Timestamp: ${operation.timestamp}`);
    if (operation.value !== undefined) {
      console.log(`   Valor:`, operation.value);
    }
    if (operation.from) {
      console.log(`   Desde: ${operation.from}`);
    }
    console.log(`   ──────────────────────────────────`);

    // Reenviar la operación a todos los demás usuarios conectados
    socket.broadcast.emit("diagram_operation", {
      ...operation,
      userId: socket.id,
      userName: userName,
    });
  });

  // Manejar mensajes de prueba (opcional)
  socket.on("ping", (data) => {
    socket.emit("pong", { ...data, serverTime: new Date() });
  });
});

// Endpoint de health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date(),
    connections: connectedUsers.size,
    users: Array.from(connectedUsers.values()).map((user) => ({
      id: user.id,
      name: user.name,
      connectedAt: user.connectedAt,
    })),
  });
});

// Endpoint para obtener información de usuarios conectados
app.get("/users", (req, res) => {
  res.json({
    totalUsers: connectedUsers.size,
    users: Array.from(connectedUsers.values()).map((user) => ({
      id: user.id,
      name: user.name,
      connectedAt: user.connectedAt,
    })),
  });
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor Socket.IO corriendo en puerto ${PORT}`);
  console.log(`🌐 Health check disponible en: http://localhost:${PORT}/health`);
  console.log(`👥 Información de usuarios en: http://localhost:${PORT}/users`);
});
