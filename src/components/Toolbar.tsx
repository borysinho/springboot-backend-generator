import React from "react";
import { classTemplates, toolbarGroups } from "../constants/templates";

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
        width: "180px",
        height: "100%",
        background: "#f8f9fa",
        border: "1px solid #dee2e6",
        borderRadius: "6px",
        paddingLeft: "8px",
        paddingRight: "8px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
        overflowY: "auto",
        flexShrink: 0,
      }}
    >
      <h3
        style={{
          margin: "0 0 6px 0",
          fontSize: "14px",
          color: "#495057",
          textAlign: "center",
          borderBottom: "1px solid #dee2e6",
          paddingBottom: "6px",
        }}
      >
        🛠️ UML
      </h3>

      {toolbarGroups.map((group, groupIndex) => (
        <div key={group.title}>
          <h4
            style={{
              margin: "0 0 4px 0",
              fontSize: "11px",
              color: "#6c757d",
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: "0.3px",
              borderBottom: "1px solid #e9ecef",
              paddingBottom: "2px",
            }}
          >
            {group.title}
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {group.items.map((item) => (
              <div
                key={item.key}
                draggable
                onDragStart={(e) =>
                  onDragStart(e, item.key as keyof typeof classTemplates)
                }
                style={{
                  padding: "6px 8px",
                  background: item.color,
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "grab",
                  fontSize: "11px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  userSelect: "none",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  fontWeight: "500",
                  minHeight: "28px",
                }}
                onMouseDown={(e) => {
                  (e.currentTarget as HTMLElement).style.transform =
                    "scale(0.95)";
                }}
                onMouseUp={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                }}
                title={`Arrastrar para agregar ${item.label.toLowerCase()}`}
              >
                {item.label}
              </div>
            ))}
          </div>
          {groupIndex < toolbarGroups.length - 1 && (
            <div
              style={{
                height: "1px",
                background: "#dee2e6",
                margin: "8px 0",
                opacity: 0.5,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
};
