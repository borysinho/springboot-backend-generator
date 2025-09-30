import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket(url: string = "http://localhost:3002") {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Crear conexión Socket.IO
    const newSocket = io(url, {
      transports: ["websocket", "polling"],
      timeout: 5000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Manejar conexión exitosa
    newSocket.on("connect", () => {
      console.log("Conectado al servidor:", newSocket.id);
      setIsConnected(true);
      setConnectionError(null);
    });

    // Manejar errores de conexión
    newSocket.on("connect_error", (error) => {
      console.error("Error de conexión:", error);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    // Manejar desconexión
    newSocket.on("disconnect", (reason) => {
      console.log("Desconectado del servidor:", reason);
      setIsConnected(false);
    });

    // Cleanup al desmontar
    return () => {
      newSocket.close();
      socketRef.current = null;
    };
  }, [url]);

  return {
    socket,
    isConnected,
    connectionError,
  };
}
