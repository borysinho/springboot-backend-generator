import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import type { JsonPatchOperation } from "../hooks/useDiagramSync";
import "./ConnectionStatusBar.css";

interface User {
  id: string;
  name: string;
  connectedAt: Date;
}

interface ConnectionStatusBarProps {
  className?: string;
  operations?: JsonPatchOperation[];
}

const ConnectionStatusBar: React.FC<ConnectionStatusBarProps> = ({
  className = "",
  operations = [],
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showDiagramInfo, setShowDiagramInfo] = useState(false);

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

  // Manejar la tecla ESC para cerrar el dropdown
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showDiagramInfo) {
        setShowDiagramInfo(false);
      }
    };

    if (showDiagramInfo) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
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
          onClick={() => setShowDiagramInfo(!showDiagramInfo)}
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
              {operations.length} operaciones
            </span>
          </div>

          <div className="operations-list">
            {operations.length === 0 ? (
              <div className="no-operations">
                <span>📝</span>
                <p>No hay operaciones recientes</p>
                <small>
                  Las operaciones aparecerán aquí cuando edites el diagrama
                </small>
              </div>
            ) : (
              operations.map((operation, index) => (
                <div
                  key={`${operation.timestamp}-${index}`}
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
                            timestamp: new Date(
                              operation.timestamp
                            ).toISOString(),
                            ...(operation.value
                              ? { value: operation.value }
                              : {}),
                            ...(operation.from ? { from: operation.from } : {}),
                          },
                          null,
                          0
                        )}
                      </code>
                    </div>
                    <div className="operation-timestamp">
                      {new Date(operation.timestamp).toLocaleTimeString()}
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
