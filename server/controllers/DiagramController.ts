import { Server as SocketIOServer, Socket } from "socket.io";
import * as jsonpatch from "fast-json-patch";
import {
  DiagramModel,
  DiagramState,
  DiagramPatch,
} from "../models/DiagramModel.ts";

export interface ClientInfo {
  id: string;
  userName: string;
  connectedAt: Date;
  lastActivity: Date;
}

export interface DiagramEvent {
  type:
    | "diagram_update"
    | "diagram_patch"
    | "diagram_sync"
    | "user_joined"
    | "user_left"
    | "patch_ack"
    | "patch_error"
    | "connection_info"
    | "pong"
    | "server_restart";
  data: unknown;
  userId: string;
  timestamp: Date;
}

export class DiagramController {
  private model: DiagramModel;
  private io: SocketIOServer;
  private clients: Map<string, ClientInfo> = new Map();

  constructor(model: DiagramModel, io: SocketIOServer) {
    this.model = model;
    this.io = io;
    this.setupSocketHandlers();
    this.setupModelObserver();
  }

  // Configurar handlers para conexiones Socket.IO
  private setupSocketHandlers(): void {
    this.io.on("connection", (socket: Socket) => {
      console.log("🔗 Nueva conexión Socket.IO:", socket.id);

      // Extraer información del usuario de la query
      const userName =
        (socket.handshake.query.name as string) ||
        `Usuario-${socket.id.slice(0, 4)}`;
      const clientInfo: ClientInfo = {
        id: socket.id,
        userName,
        connectedAt: new Date(),
        lastActivity: new Date(),
      };

      // Registrar cliente
      this.clients.set(socket.id, clientInfo);

      // Notificar a otros usuarios
      this.broadcastToOthers(socket.id, {
        type: "user_joined",
        data: { user: clientInfo },
        userId: socket.id,
        timestamp: new Date(),
      });

      console.log(`👋 Usuario conectado: ${userName} (ID: ${socket.id})`);
      console.log(`📊 Total de conexiones: ${this.clients.size}`);

      // Enviar estado actual del diagrama al nuevo cliente
      this.sendToClient(socket.id, {
        type: "diagram_sync",
        data: this.model.getState(),
        userId: "server",
        timestamp: new Date(),
      });

      // Configurar handlers de eventos del cliente
      this.setupClientEventHandlers(socket);

      // Handler de desconexión
      socket.on("disconnect", () => {
        console.log(`👋 Usuario desconectado: ${userName} (ID: ${socket.id})`);
        this.clients.delete(socket.id);

        // Notificar a otros usuarios
        this.broadcastToOthers(socket.id, {
          type: "user_left",
          data: { userId: socket.id, userName },
          userId: socket.id,
          timestamp: new Date(),
        });

        console.log(`📊 Total de conexiones: ${this.clients.size}`);
      });
    });
  }

  // Configurar handlers para eventos específicos del cliente
  private setupClientEventHandlers(socket: Socket): void {
    // Recibir patch del diagrama
    socket.on(
      "diagram_patch",
      (data: { operations: jsonpatch.Operation[]; version: number }) => {
        try {
          const clientInfo = this.clients.get(socket.id);
          if (!clientInfo) return;

          console.log(
            `📨 Patch recibido de ${clientInfo.userName} (${socket.id})`
          );

          // Crear patch con metadatos
          const patch: DiagramPatch = {
            operations: data.operations,
            userId: socket.id,
            timestamp: new Date(),
            version: data.version,
          };

          // Aplicar patch al modelo
          const success = this.model.applyPatch(patch);

          if (success) {
            // Actualizar actividad del cliente
            clientInfo.lastActivity = new Date();

            // Retransmitir el patch a otros clientes
            this.broadcastToOthers(socket.id, {
              type: "diagram_patch",
              data: patch,
              userId: socket.id,
              timestamp: new Date(),
            });

            // Confirmar al cliente que el patch fue aplicado
            this.sendToClient(socket.id, {
              type: "patch_ack",
              data: { version: this.model.getVersion() },
              userId: "server",
              timestamp: new Date(),
            });
          } else {
            // Notificar error al cliente
            this.sendToClient(socket.id, {
              type: "patch_error",
              data: { message: "Failed to apply patch - version mismatch" },
              userId: "server",
              timestamp: new Date(),
            });
          }
        } catch (error) {
          console.error("❌ Error procesando patch:", error);
          this.sendToClient(socket.id, {
            type: "patch_error",
            data: { message: "Invalid patch format" },
            userId: "server",
            timestamp: new Date(),
          });
        }
      }
    );

    // Solicitar información de conexiones
    socket.on("get_connection_info", () => {
      const connections = Array.from(this.clients.values()).map((client) => ({
        id: client.id,
        name: client.userName,
        connectedAt: client.connectedAt,
        lastActivity: client.lastActivity,
      }));

      this.sendToClient(socket.id, {
        type: "connection_info",
        data: {
          total: this.clients.size,
          connections,
        },
        userId: "server",
        timestamp: new Date(),
      });
    });

    // Solicitar estado completo del diagrama
    socket.on("get_diagram_state", () => {
      this.sendToClient(socket.id, {
        type: "diagram_sync",
        data: this.model.getState(),
        userId: "server",
        timestamp: new Date(),
      });
    });

    // Ping para mantener conexión activa
    socket.on("ping", () => {
      const clientInfo = this.clients.get(socket.id);
      if (clientInfo) {
        clientInfo.lastActivity = new Date();
      }

      this.sendToClient(socket.id, {
        type: "pong",
        data: { timestamp: new Date() },
        userId: "server",
        timestamp: new Date(),
      });
    });
  }

  // Configurar observador del modelo para cambios automáticos
  private setupModelObserver(): void {
    this.model.subscribe((state) => {
      // Los cambios del modelo ya se manejan en los eventos de patch
      // Este observador podría usarse para logging o triggers adicionales
      console.log(
        `📊 Modelo actualizado - Versión: ${state.version}, Celdas: ${state.cells.length}`
      );
    });
  }

  // Enviar mensaje a un cliente específico
  private sendToClient(clientId: string, event: DiagramEvent): void {
    const socket = this.io.sockets.sockets.get(clientId);
    if (socket) {
      socket.emit("diagram_event", event);
    }
  }

  // Retransmitir a todos los clientes excepto el especificado
  private broadcastToOthers(
    excludeClientId: string,
    event: DiagramEvent
  ): void {
    const socket = this.io.sockets.sockets.get(excludeClientId);
    if (socket) {
      socket.broadcast.emit("diagram_event", event);
    }
  }

  // Retransmitir a todos los clientes
  private broadcastToAll(event: DiagramEvent): void {
    this.io.emit("diagram_event", event);
  }

  // Obtener información de conexiones activas
  getActiveConnections(): ClientInfo[] {
    return Array.from(this.clients.values());
  }

  // Obtener estado actual del modelo
  getModelState(): DiagramState {
    return this.model.getState();
  }

  // Limpiar todas las conexiones (útil para reinicio)
  clearConnections(): void {
    this.clients.clear();
    this.broadcastToAll({
      type: "server_restart",
      data: { message: "Server is restarting" },
      userId: "server",
      timestamp: new Date(),
    });
  }

  // Obtener referencia al modelo (para acceso directo si es necesario)
  getModel(): DiagramModel {
    return this.model;
  }
}
