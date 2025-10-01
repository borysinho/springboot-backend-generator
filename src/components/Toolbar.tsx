import React from "react";
import { classTemplates, toolbarGroups } from "../constants/templates";
import "./css/Toolbar.css";

interface ToolbarProps {
  onDragStart: (
    e: React.DragEvent,
    template: keyof typeof classTemplates
  ) => void;
  onClick?: (template: keyof typeof classTemplates) => void;
  onAIBotClick?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onPrint?: () => void;
  onExport?: () => void;
  onGenerateBackend?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onDragStart,
  onClick,
  onAIBotClick,
  onUndo,
  onRedo,
  onPrint,
  onExport,
  onGenerateBackend,
}) => {
  const relationshipTypes = [
    "association",
    "aggregation",
    "composition",
    "generalization",
    "dependency",
    "realization",
  ];

  const getItemIcon = (key: string) => {
    const iconMap: Record<string, string> = {
      class: "📦",
      interface: "🔌",
      enumeration: "📊",
      package: "📁",
      association: "🔗",
      aggregation: "📎",
      composition: "🔧",
      generalization: "⬆️",
      dependency: "⚡",
      realization: "🎯",
    };
    return iconMap[key] || "📄";
  };

  return (
    <div className="toolbar-container">
      <div className="toolbar-header">
        <h3 className="toolbar-title">Herramientas UML</h3>
      </div>

      <div className="toolbar-content">
        {toolbarGroups.map((group) => (
          <div key={group.title} className="toolbar-section">
            <h4 className="toolbar-section-title">{group.title}</h4>
            <div className="toolbar-grid">
              {group.items.map((item) => {
                const isRelationship = relationshipTypes.includes(item.key);
                return (
                  <div
                    key={item.key}
                    className={`toolbar-item ${
                      isRelationship ? "toolbar-relationship-item" : ""
                    }`}
                    draggable={!isRelationship}
                    onDragStart={
                      !isRelationship
                        ? (e) =>
                            onDragStart(
                              e,
                              item.key as keyof typeof classTemplates
                            )
                        : undefined
                    }
                    onClick={
                      onClick
                        ? () => onClick(item.key as keyof typeof classTemplates)
                        : undefined
                    }
                    title={
                      isRelationship
                        ? `Haz click para crear ${item.label.toLowerCase()}`
                        : `Arrastrar para agregar ${item.label.toLowerCase()}`
                    }
                  >
                    <div className="toolbar-item-icon">
                      {getItemIcon(item.key)}
                    </div>
                    <div className="toolbar-item-label">{item.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="toolbar-actions-section">
          <h4 className="toolbar-section-title">Acciones</h4>
          <div className="toolbar-actions-grid">
            <button
              className="toolbar-action-button"
              onClick={onUndo}
              title="Deshacer última acción"
            >
              <div className="toolbar-item-icon">↶</div>
              <div className="toolbar-item-label">Deshacer</div>
            </button>
            <button
              className="toolbar-action-button"
              onClick={onRedo}
              title="Rehacer última acción"
            >
              <div className="toolbar-item-icon">↷</div>
              <div className="toolbar-item-label">Rehacer</div>
            </button>
            <button
              className="toolbar-action-button"
              onClick={onPrint}
              title="Imprimir diagrama"
            >
              <div className="toolbar-item-icon">🖨️</div>
              <div className="toolbar-item-label">Imprimir</div>
            </button>
            <button
              className="toolbar-action-button"
              onClick={onExport}
              title="Exportar diagrama"
            >
              <div className="toolbar-item-icon">📤</div>
              <div className="toolbar-item-label">Exportar</div>
            </button>
            <button
              className="toolbar-action-button"
              onClick={onGenerateBackend}
              title="Generar backend Spring Boot"
            >
              <div className="toolbar-item-icon">⚙️</div>
              <div className="toolbar-item-label">Backend</div>
            </button>
          </div>
        </div>

        <div className="toolbar-ai-section">
          <button className="ai-bot-button" onClick={onAIBotClick}>
            Asistente IA
          </button>
        </div>
      </div>
    </div>
  );
};
