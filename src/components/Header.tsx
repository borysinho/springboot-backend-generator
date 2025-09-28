import React from "react";
import ConnectionStatusBar from "./ConnectionStatusBar";
import "./Header.css";

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({
  title = "Diagrama UML Colaborativo",
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
          <ConnectionStatusBar />
        </div>
      </div>
    </header>
  );
};

export default Header;
