import React from "react";
import { classTemplates, toolbarItems } from "../constants/templates";

interface ToolbarProps {
  onDragStart: (
    e: React.DragEvent,
    template: keyof typeof classTemplates
  ) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onDragStart }) => {
  return (
    <div
      style={{
        width: "200px",
        minHeight: "600px",
        background: "#f8f9fa",
        border: "1px solid #dee2e6",
        borderRadius: "8px",
        padding: "15px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
      }}
    >
      <h3
        style={{
          margin: "0 0 15px 0",
          fontSize: "16px",
          color: "#495057",
          textAlign: "center",
          borderBottom: "1px solid #dee2e6",
          paddingBottom: "10px",
        }}
      >
        🛠️ Elementos y Relaciones UML
      </h3>

      {toolbarItems.map((item) => (
        <div
          key={item.key}
          draggable
          onDragStart={(e) =>
            onDragStart(e, item.key as keyof typeof classTemplates)
          }
          style={{
            padding: "10px 12px",
            background: item.color,
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "grab",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            userSelect: "none",
            transition: "transform 0.2s, box-shadow 0.2s",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "scale(0.95)";
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "scale(1)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "scale(1)";
          }}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
};
