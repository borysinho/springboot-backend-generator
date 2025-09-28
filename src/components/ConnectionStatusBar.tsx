import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import "./ConnectionStatusBar.css";

interface User {
  id: string;
  name: string;
  connectedAt: Date;
}

interface JsonPatchOperation {
  op: "add" | "remove" | "replace" | "move" | "copy" | "test";
  path: string;
  value?: unknown;
  from?: string;
  timestamp: Date;
  description: string;
}

interface ConnectionStatusBarProps {
  className?: string;
}

const ConnectionStatusBar: React.FC<ConnectionStatusBarProps> = ({
  className = "",
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showDiagramInfo, setShowDiagramInfo] = useState(false);
  const [jsonPatchOperations, setJsonPatchOperations] = useState<
    JsonPatchOperation[]
  >([
    {
      op: "add",
      path: "/classes/-",
      value: { id: "class_1", name: "User" },
      timestamp: new Date(Date.now() - 300000), // 5 minutos atrás
      description: "Clase User creada",
    },
    {
      op: "add",
      path: "/classes/-",
      value: { id: "class_2", name: "Admin" },
      timestamp: new Date(Date.now() - 240000), // 4 minutos atrás
      description: "Clase Admin creada",
    },
    {
      op: "add",
      path: "/relationships/-",
      value: { type: "inheritance", from: "class_2", to: "class_1" },
      timestamp: new Date(Date.now() - 180000), // 3 minutos atrás
      description: "Relación de herencia creada entre Admin y User",
    },
  ]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (
        showDiagramInfo &&
        !target.closest(".diagram-info-btn") &&
        !target.closest(".diagram-operations-dropdown")
      ) {
        setShowDiagramInfo(false);
      }
    };

    if (showDiagramInfo) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDiagramInfo]);

  useEffect(() => {
    // Conectar al servidor Socket.IO
    const socketInstance = io("http://localhost:3001", {
      transports: ["websocket", "polling"],
    });

    socketInstance.on("connect", () => {
      console.log("Connected to server");
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
      setUsers([]);
      setTotalUsers(0);
    });

    socketInstance.on(
      "user_connected",
      (data: {
        userId: string;
        userName: string;
        totalUsers: number;
        connectedUsers: User[];
      }) => {
        setUsers(data.connectedUsers);
        setTotalUsers(data.totalUsers);

        // Agregar operación JSON Patch simulada
        const operation: JsonPatchOperation = {
          op: "add",
          path: "/users/-",
          value: { id: data.userId, name: data.userName },
          timestamp: new Date(),
          description: `Usuario ${data.userName} se conectó`,
        };
        setJsonPatchOperations((prev) => [operation, ...prev.slice(0, 9)]); // Mantener solo las últimas 10
      }
    );

    socketInstance.on(
      "user_disconnected",
      (data: {
        userId: string;
        userName: string;
        totalUsers: number;
        connectedUsers: User[];
      }) => {
        setUsers(data.connectedUsers);
        setTotalUsers(data.totalUsers);

        // Agregar operación JSON Patch simulada
        const operation: JsonPatchOperation = {
          op: "remove",
          path: `/users/${data.userId}`,
          timestamp: new Date(),
          description: `Usuario ${data.userName} se desconectó`,
        };
        setJsonPatchOperations((prev) => [operation, ...prev.slice(0, 9)]); // Mantener solo las últimas 10
      }
    );

    socketInstance.on(
      "welcome",
      (data: { message: string; userId: string; userName: string }) => {
        console.log(data.message);
      }
    );

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const handleTestConnection = () => {
    if (socket && isConnected) {
      socket.emit("ping", { timestamp: new Date() });
      socket.once("pong", (data) => {
        console.log("Pong received:", data);
      });
    }
  };

  return (
    <>
      <div className={`connection-status-bar ${className}`}>
        <button
          className="diagram-info-btn"
          onClick={() => setShowDiagramInfo(true)}
          title="Ver cómo se ensambla el diagrama"
        >
          📋
        </button>

        <div className="status-indicator">
          <div
            className={`status-dot ${
              isConnected ? "connected" : "disconnected"
            }`}
          ></div>
          <span className="status-text">
            {isConnected ? "Conectado" : "Desconectado"}
          </span>
        </div>

        <div className="users-info">
          <span className="users-icon">👥</span>
          <span className="users-count">
            {totalUsers} usuario{totalUsers !== 1 ? "s" : ""} conectado
            {totalUsers !== 1 ? "s" : ""}
          </span>
          {users.length > 0 && (
            <div className="users-list">
              {users.slice(0, 3).map((user) => (
                <div
                  key={user.id}
                  className="user-avatar"
                  title={`${user.name} - Conectado ${new Date(
                    user.connectedAt
                  ).toLocaleTimeString()}`}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
              ))}
              {users.length > 3 && (
                <div
                  className="user-avatar more"
                  title={`${users.length - 3} más...`}
                >
                  +{users.length - 3}
                </div>
              )}
            </div>
          )}
        </div>

        {isConnected && (
          <button
            className="test-connection-btn"
            onClick={handleTestConnection}
            title="Probar conexión"
          >
            🧪
          </button>
        )}
      </div>

      {showDiagramInfo && (
        <div className="diagram-operations-dropdown">
          <div className="dropdown-header">
            <h4>� Operaciones en Tiempo Real</h4>
            <span className="operations-count">
              {jsonPatchOperations.length} operaciones
            </span>
          </div>

          <div className="operations-list">
            {jsonPatchOperations.length === 0 ? (
              <div className="no-operations">
                <span>📝</span>
                <p>No hay operaciones recientes</p>
                <small>
                  Las operaciones aparecerán aquí cuando edites el diagrama
                </small>
              </div>
            ) : (
              jsonPatchOperations.map((operation, index) => (
                <div
                  key={`${operation.timestamp.getTime()}-${index}`}
                  className="operation-item"
                >
                  <div className="operation-icon">
                    {operation.op === "add" && "➕"}
                    {operation.op === "remove" && "🗑️"}
                    {operation.op === "replace" && "🔄"}
                    {operation.op === "move" && "📍"}
                    {operation.op === "copy" && "📋"}
                    {operation.op === "test" && "✅"}
                  </div>
                  <div className="operation-details">
                    <div className="operation-description">
                      {operation.description}
                    </div>
                    <div className="operation-code">
                      <code>
                        {JSON.stringify(
                          {
                            op: operation.op,
                            path: operation.path,
                            ...(operation.value
                              ? { value: operation.value }
                              : {}),
                          },
                          null,
                          0
                        )}
                      </code>
                    </div>
                    <div className="operation-timestamp">
                      {operation.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="dropdown-footer">
            <small>
              💡 Cada cambio en el diagrama genera una operación JSON Patch
            </small>
          </div>
        </div>
      )}
    </>
  );
};

export default ConnectionStatusBar;
