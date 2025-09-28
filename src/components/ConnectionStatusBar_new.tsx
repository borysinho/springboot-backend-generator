import React, { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import * as jsonpatch from "fast-json-patch";
import "./ConnectionStatusBar.css";

// Contexto para compartir la función de envío de patches
export const DiagramSyncContext = React.createContext<{
  sendDiagramPatch: (
    operations: jsonpatch.Operation[],
    version: number
  ) => void;
  onDiagramPatch: (
    callback: (operations: jsonpatch.Operation[]) => void
  ) => () => void;
  isConnected: boolean;
} | null>(null);

interface User {
  id: string;
  name: string;
  connectedAt: Date;
  lastActivity: Date;
}

interface ConnectionInfo {
  isConnected: boolean;
  users: User[];
  connectionId: string | null;
  lastError: string | null;
}

export const DiagramSyncProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>({
    isConnected: false,
    users: [],
    connectionId: null,
    lastError: null,
  });

  const socketRef = useRef<Socket | null>(null);
  const patchCallbacksRef = useRef<
    ((operations: jsonpatch.Operation[]) => void)[]
  >([]);

  // Conectar al servidor Socket.IO
  useEffect(() => {
    const socket = io("http://localhost:3001", {
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🔗 Conectado al servidor Socket.IO");
      setConnectionInfo((prev) => ({
        ...prev,
        isConnected: true,
        connectionId: socket.id || null,
        lastError: null,
      }));
    });

    socket.on("disconnect", () => {
      console.log("🔌 Desconectado del servidor Socket.IO");
      setConnectionInfo((prev) => ({
        ...prev,
        isConnected: false,
        connectionId: null,
      }));
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Error de conexión:", error);
      setConnectionInfo((prev) => ({
        ...prev,
        lastError: error.message,
      }));
    });

    // Escuchar eventos de usuarios conectados
    socket.on("users_update", (users: User[]) => {
      setConnectionInfo((prev) => ({
        ...prev,
        users,
      }));
    });

    // Escuchar patches del diagrama
    socket.on(
      "diagram_patch",
      (data: { operations: jsonpatch.Operation[]; version: number }) => {
        const { operations } = data;
        console.log(
          "📥 Recibido patch del diagrama:",
          operations.length,
          "operaciones"
        );

        // Notificar a todos los callbacks registrados
        patchCallbacksRef.current.forEach((callback) => {
          try {
            callback(operations);
          } catch (error) {
            console.error("❌ Error ejecutando callback de patch:", error);
          }
        });
      }
    );

    return () => {
      socket.disconnect();
    };
  }, []);

  // Función para enviar patches
  const sendDiagramPatch = useCallback(
    (operations: jsonpatch.Operation[], version: number) => {
      if (socketRef.current && connectionInfo.isConnected) {
        socketRef.current.emit("diagram_patch", { operations, version });
        console.log(
          "📤 Enviado patch del diagrama:",
          operations.length,
          "operaciones"
        );
      } else {
        console.warn("⚠️ No se puede enviar patch: no conectado al servidor");
      }
    },
    [connectionInfo.isConnected]
  );

  // Función para registrar callbacks de patches
  const onDiagramPatch = useCallback(
    (callback: (operations: jsonpatch.Operation[]) => void) => {
      patchCallbacksRef.current.push(callback);

      // Retornar función para desuscribirse
      return () => {
        const index = patchCallbacksRef.current.indexOf(callback);
        if (index > -1) {
          patchCallbacksRef.current.splice(index, 1);
        }
      };
    },
    []
  );

  const contextValue = {
    sendDiagramPatch,
    onDiagramPatch,
    isConnected: connectionInfo.isConnected,
  };

  return (
    <DiagramSyncContext.Provider value={contextValue}>
      {children}
    </DiagramSyncContext.Provider>
  );
};

const ConnectionStatusBar: React.FC = () => {
  const context = React.useContext(DiagramSyncContext);

  if (!context) {
    return (
      <div className="connection-status-bar error">
        Error: No hay contexto de sincronización
      </div>
    );
  }

  const { isConnected } = context;

  return (
    <div
      className={`connection-status-bar ${
        isConnected ? "connected" : "disconnected"
      }`}
    >
      <div className="status-indicator">
        <span className="status-dot"></span>
        <span className="status-text">
          {isConnected ? "Conectado" : "Desconectado"}
        </span>
      </div>
      <div className="connection-info">
        {isConnected ? "Sincronización activa" : "Modo offline"}
      </div>
    </div>
  );
};

export default ConnectionStatusBar;
