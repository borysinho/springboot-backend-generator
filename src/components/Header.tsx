import React from "react";
import { Link } from "react-router-dom";
import ConnectionStatusBar from "./ConnectionStatusBar";
import "./css/Header.css";
import type { JsonPatchOperation } from "../hooks/useDiagramSync";
import type { Socket } from "socket.io-client";

interface HeaderProps {
  title?: string;
  operations?: JsonPatchOperation[];
  socket?: Socket;
  onSave?: () => void;
  diagramName?: string;
}

const Header: React.FC<HeaderProps> = ({
  title = "Diagrama UML Colaborativo",
  operations = [],
  socket,
  onSave,
  diagramName,
}) => {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <Link to="/dashboard" className="dashboard-link">
            ← Volver al Dashboard
          </Link>
          <h1 className="app-title">{title}</h1>
          <div className="app-subtitle">
            Editor de diagramas UML en tiempo real
          </div>
        </div>

        <div className="header-center">
          {diagramName && (
            <div className="diagram-name">
              Diagrama: <strong>{diagramName}</strong>
            </div>
          )}
          {onSave && (
            <button onClick={onSave} className="save-button">
              💾 Guardar Diagrama
            </button>
          )}
          <ConnectionStatusBar operations={operations} socket={socket} />
        </div>

        <div className="header-right">
          {/* Espacio reservado para futuras funcionalidades */}
        </div>
      </div>
    </header>
  );
};

export default Header;
