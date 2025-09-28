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
    <div className={`connection-status-bar ${className}`}>
      <div className="status-indicator">
        <div
          className={`status-dot ${isConnected ? "connected" : "disconnected"}`}
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
  );
};

export default ConnectionStatusBar;
