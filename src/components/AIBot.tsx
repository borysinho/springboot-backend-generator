import React, { useState, useRef, useEffect } from "react";
import { aiService, type AIResponse } from "../services/AIService";

export interface ClassData {
  className: string;
  attributes: string[];
  methods: string[];
  stereotype?: string;
}

export interface RelationshipData {
  relationshipType: string;
  sourceClass: string;
  targetClass: string;
  multiplicity: {
    source: string;
    target: string;
  };
  description: string;
}

export interface DiagramData {
  classes: ClassData[];
  relationships: RelationshipData[];
}

interface AIBotProps {
  onCreateClass: (classData: ClassData) => void;
  onCreateRelationship: (relationshipData: RelationshipData) => void;
  onGenerateDiagram: (diagramData: DiagramData) => void;
  existingClasses: string[];
  isVisible: boolean;
  onClose: () => void;
}

export const AIBot: React.FC<AIBotProps> = ({
  onCreateClass,
  onCreateRelationship,
  onGenerateDiagram,
  existingClasses,
  isVisible,
  onClose,
}) => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      type: "user" | "ai" | "error";
      content: string;
      timestamp: Date;
    }>
  >([]);
  const [selectedAction, setSelectedAction] = useState<
    "create_class" | "relate_classes" | "generate_diagram"
  >("create_class");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (type: "user" | "ai" | "error", content: string) => {
    const newMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    addMessage("user", userMessage);

    setIsLoading(true);

    try {
      let response: AIResponse;

      switch (selectedAction) {
        case "create_class":
          response = await aiService.createClass(userMessage);
          break;
        case "relate_classes":
          response = await aiService.relateClasses(
            userMessage,
            existingClasses
          );
          break;
        case "generate_diagram":
          response = await aiService.generateDiagram(userMessage);
          break;
        default:
          throw new Error("Acción no válida");
      }

      if (response.success && response.data) {
        addMessage(
          "ai",
          `✅ ${getActionLabel(selectedAction)} generado exitosamente`
        );

        // Ejecutar la acción correspondiente
        switch (selectedAction) {
          case "create_class":
            onCreateClass(response.data as unknown as ClassData);
            break;
          case "relate_classes":
            onCreateRelationship(response.data as unknown as RelationshipData);
            break;
          case "generate_diagram":
            onGenerateDiagram(response.data as unknown as DiagramData);
            break;
        }
      } else {
        addMessage(
          "error",
          `❌ Error: ${response.error || "Respuesta inválida de la IA"}`
        );
      }
    } catch (error) {
      addMessage(
        "error",
        `❌ Error de conexión: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "create_class":
        return "Clase";
      case "relate_classes":
        return "Relación";
      case "generate_diagram":
        return "Diagrama";
      default:
        return "Elemento";
    }
  };

  const getActionDescription = (action: string) => {
    switch (action) {
      case "create_class":
        return 'Describe la clase que quieres crear (ej: "Una clase Usuario con nombre, email y métodos para login")';
      case "relate_classes":
        return 'Describe la relación entre clases (ej: "Un Usuario tiene muchos Pedidos")';
      case "generate_diagram":
        return 'Describe el sistema completo (ej: "Sistema de e-commerce con usuarios, productos y pedidos")';
      default:
        return "";
    }
  };

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        width: "400px",
        height: "600px",
        background: "white",
        border: "1px solid #ddd",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #eee",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#f8f9fa",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "16px", color: "#333" }}>
          🤖 Asistente IA UML
        </h3>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            fontSize: "18px",
            cursor: "pointer",
            color: "#666",
          }}
        >
          ×
        </button>
      </div>

      {/* Action Selector */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #eee",
          background: "#fafafa",
        }}
      >
        <select
          value={selectedAction}
          onChange={(e) =>
            setSelectedAction(
              e.target.value as
                | "create_class"
                | "relate_classes"
                | "generate_diagram"
            )
          }
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        >
          <option value="create_class">🟦 Crear Clase</option>
          <option value="relate_classes">🔗 Relacionar Clases</option>
          <option value="generate_diagram">📊 Generar Diagrama</option>
        </select>
        <p
          style={{
            margin: "8px 0 0 0",
            fontSize: "12px",
            color: "#666",
            lineHeight: "1.4",
          }}
        >
          {getActionDescription(selectedAction)}
        </p>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          background: "#fafafa",
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: "#999",
              fontStyle: "italic",
              marginTop: "100px",
            }}
          >
            ¡Hola! Soy tu asistente IA para diagramas UML.
            <br />
            Selecciona una acción y describe lo que necesitas.
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              marginBottom: "12px",
              padding: "8px 12px",
              borderRadius: "8px",
              background:
                message.type === "user"
                  ? "#007bff"
                  : message.type === "ai"
                  ? "#28a745"
                  : "#dc3545",
              color: "white",
              fontSize: "14px",
              wordWrap: "break-word",
            }}
          >
            {message.content}
          </div>
        ))}
        {isLoading && (
          <div
            style={{
              padding: "8px 12px",
              color: "#666",
              fontStyle: "italic",
            }}
          >
            🤔 Pensando...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: "16px",
          borderTop: "1px solid #eee",
          background: "white",
        }}
      >
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe lo que necesitas..."
            disabled={isLoading}
            style={{
              flex: 1,
              padding: "8px 12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            style={{
              padding: "8px 16px",
              background: isLoading || !input.trim() ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
              fontSize: "14px",
            }}
          >
            {isLoading ? "..." : "Enviar"}
          </button>
        </div>
      </form>
    </div>
  );
};
