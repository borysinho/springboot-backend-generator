import React from "react";
import ConnectionStatusBar from "./ConnectionStatusBar";
import "./Header.css";
import type { JsonPatchOperation } from "../hooks/useDiagramSync";
import type { Socket } from "socket.io-client";

interface HeaderProps {
  title?: string;
  operations?: JsonPatchOperation[];
  socket?: Socket;
}

const Header: React.FC<HeaderProps> = ({
  title = "Diagrama UML Colaborativo",
  operations = [],
  socket,
}) => {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="app-title">{title}</h1>
          <div className="app-subtitle">
            Editor de diagramas UML en tiempo real
          </div>
        </div>

        <div className="header-right">
          <ConnectionStatusBar operations={operations} socket={socket} />
        </div>
      </div>
    </header>
  );
};

export default Header;
