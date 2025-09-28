import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import "./ConnectionStatusBar.css";

interface User {
  id: string;
  name: string;
  connectedAt: Date;
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
        <div
          className="diagram-info-modal-overlay"
          onClick={() => setShowDiagramInfo(false)}
        >
          <div
            className="diagram-info-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="diagram-info-header">
              <h3>🔧 Ensamblaje del Diagrama en Tiempo Real</h3>
              <button
                className="close-modal-btn"
                onClick={() => setShowDiagramInfo(false)}
              >
                ✕
              </button>
            </div>
            <div className="diagram-info-content">
              <p>
                <strong>¿Cómo se construye tu diagrama?</strong>
              </p>

              <p>
                Cada acción que realizas en la interfaz se traduce
                automáticamente a operaciones
                <strong>JSON Patch</strong> que modifican el estado del diagrama
                de manera precisa y eficiente.
              </p>

              <h4>📝 Operaciones Soportadas:</h4>

              <div className="operation-example">
                <strong>➕ Agregar Clase:</strong>
                <code>
                  {
                    '{ "op": "add", "path": "/classes/-", "value": { "id": "class_1", "name": "User" } }'
                  }
                </code>
              </div>

              <div className="operation-example">
                <strong>🔄 Renombrar Elemento:</strong>
                <code>
                  {
                    '{ "op": "replace", "path": "/classes/0/name", "value": "Administrator" }'
                  }
                </code>
              </div>

              <div className="operation-example">
                <strong>📍 Mover en Canvas:</strong>
                <code>
                  {
                    '{ "op": "replace", "path": "/classes/0/position", "value": { "x": 150, "y": 250 } }'
                  }
                </code>
              </div>

              <div className="operation-example">
                <strong>🔗 Crear Relación:</strong>
                <code>
                  {
                    '{ "op": "add", "path": "/relationships/-", "value": { "type": "inheritance", "from": "A", "to": "B" } }'
                  }
                </code>
              </div>

              <div className="operation-example">
                <strong>🗑️ Eliminar Elemento:</strong>
                <code>{'{ "op": "remove", "path": "/classes/1" }'}</code>
              </div>

              <h4>⚡ Ventajas del Enfoque:</h4>
              <ul>
                <li>
                  <strong>Precisión:</strong> Cada cambio se describe
                  exactamente
                </li>
                <li>
                  <strong>Eficiencia:</strong> Solo se transmiten los cambios,
                  no el diagrama completo
                </li>
                <li>
                  <strong>Reversibilidad:</strong> Fácil de "deshacer"
                  operaciones
                </li>
                <li>
                  <strong>Colaboración:</strong> Múltiples usuarios pueden
                  editar simultáneamente
                </li>
                <li>
                  <strong>Sincronización:</strong> Cambios se propagan en tiempo
                  real via WebSocket
                </li>
              </ul>

              <h4>🔄 Flujo de Trabajo:</h4>
              <ol>
                <li>Usuario edita el diagrama (arrastra, crea, elimina)</li>
                <li>UI detecta el cambio y genera operación JSON Patch</li>
                <li>Operación se envía al servidor via WebSocket</li>
                <li>Servidor valida y aplica el cambio al estado global</li>
                <li>Cambio se propaga a todos los clientes conectados</li>
                <li>UI de cada cliente actualiza automáticamente</li>
              </ol>

              <p className="diagram-info-footer">
                <em>
                  Esta arquitectura permite colaboración en tiempo real con
                  mínimo ancho de banda y máxima precisión.
                </em>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ConnectionStatusBar;
