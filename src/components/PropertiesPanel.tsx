import React, { useState, useEffect } from "react";
import type { CustomElement, UMLRelationship } from "../types";

interface PropertiesPanelProps {
  selectedElement: CustomElement | UMLRelationship | null;
  onUpdateElement: (element: CustomElement) => void;
  onUpdateRelationship: (relationship: UMLRelationship) => void;
  onDeleteElement: (element: CustomElement | UMLRelationship) => void;
  onClose: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  onUpdateElement,
  onUpdateRelationship,
  onDeleteElement,
  onClose,
}) => {
  const [className, setClassName] = useState("");
  const [attributes, setAttributes] = useState<string[]>([]);
  const [methods, setMethods] = useState<string[]>([]);
  const [relationshipLabel, setRelationshipLabel] = useState("");
  const [sourceMultiplicity, setSourceMultiplicity] = useState("");
  const [targetMultiplicity, setTargetMultiplicity] = useState("");
  const [sourceRole, setSourceRole] = useState("");
  const [targetRole, setTargetRole] = useState("");

  // Actualizar el estado local cuando cambia el elemento seleccionado
  useEffect(() => {
    if (selectedElement) {
      if ("className" in selectedElement) {
        // Es un CustomElement
        setClassName(selectedElement.className);
        setAttributes([...selectedElement.attributes]);
        setMethods([...(selectedElement.methods || [])]);
        // Limpiar campos de relación
        setRelationshipLabel("");
        setSourceMultiplicity("");
        setTargetMultiplicity("");
        setSourceRole("");
        setTargetRole("");
      } else {
        // Es un UMLRelationship
        setRelationshipLabel(selectedElement.label || "");
        setSourceMultiplicity(selectedElement.sourceMultiplicity || "");
        setTargetMultiplicity(selectedElement.targetMultiplicity || "");
        setSourceRole(selectedElement.sourceRole || "");
        setTargetRole(selectedElement.targetRole || "");
        // Limpiar campos de elemento
        setClassName("");
        setAttributes([]);
        setMethods([]);
      }
    }
  }, [selectedElement]);

  const handleSave = () => {
    if (selectedElement && "className" in selectedElement) {
      const updatedElement = {
        ...selectedElement,
        className,
        attributes,
        methods,
      };
      onUpdateElement(updatedElement);
    } else if (selectedElement) {
      const updatedRelationship = {
        ...selectedElement,
        label: relationshipLabel,
        sourceMultiplicity,
        targetMultiplicity,
        sourceRole,
        targetRole,
      };
      onUpdateRelationship(updatedRelationship);
    }
  };

  const addAttribute = () => {
    setAttributes([...attributes, ""]);
  };

  const updateAttribute = (index: number, value: string) => {
    const newAttributes = [...attributes];
    newAttributes[index] = value;
    setAttributes(newAttributes);
  };

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const addMethod = () => {
    setMethods([...methods, ""]);
  };

  const updateMethod = (index: number, value: string) => {
    const newMethods = [...methods];
    newMethods[index] = value;
    setMethods(newMethods);
  };

  const removeMethod = (index: number) => {
    setMethods(methods.filter((_, i) => i !== index));
  };

  const handleDelete = () => {
    if (
      selectedElement &&
      window.confirm("¿Estás seguro de que quieres eliminar este elemento?")
    ) {
      onDeleteElement(selectedElement);
    }
  };

  if (!selectedElement) return null;

  return (
    <div
      style={{
        width: "300px",
        background: "#f8f9fa",
        border: "1px solid #dee2e6",
        borderRadius: "8px",
        padding: "15px",
        boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "15px",
          borderBottom: "1px solid #dee2e6",
          paddingBottom: "10px",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "16px", color: "#495057" }}>
          🏷️{" "}
          {selectedElement && "className" in selectedElement
            ? "Propiedades"
            : "Propiedades de Relación"}
        </h3>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            fontSize: "18px",
            cursor: "pointer",
            color: "#6c757d",
            padding: "0",
          }}
        >
          ×
        </button>
      </div>

      {!(selectedElement && "className" in selectedElement) &&
      selectedElement ? (
        <>
          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Tipo de relación:
            </label>
            <span style={{ fontSize: "14px", color: "#495057" }}>
              {(selectedElement as UMLRelationship).relationship}
            </span>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Etiqueta:
            </label>
            <input
              type="text"
              value={relationshipLabel}
              onChange={(e) => setRelationshipLabel(e.target.value)}
              placeholder="Etiqueta opcional"
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ced4da",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Multiplicidad origen:
            </label>
            <select
              value={sourceMultiplicity}
              onChange={(e) => setSourceMultiplicity(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ced4da",
                borderRadius: "4px",
                fontSize: "14px",
                backgroundColor: "white",
              }}
            >
              <option value="">Sin multiplicidad</option>
              <option value="1">1 (uno)</option>
              <option value="*">* (cero o más)</option>
              <option value="0..1">0..1 (opcional)</option>
              <option value="1..*">1..* (uno o más)</option>
              <option value="0..*">0..* (cero o más)</option>
            </select>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Multiplicidad destino:
            </label>
            <select
              value={targetMultiplicity}
              onChange={(e) => setTargetMultiplicity(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ced4da",
                borderRadius: "4px",
                fontSize: "14px",
                backgroundColor: "white",
              }}
            >
              <option value="">Sin multiplicidad</option>
              <option value="1">1 (uno)</option>
              <option value="*">* (cero o más)</option>
              <option value="0..1">0..1 (opcional)</option>
              <option value="1..*">1..* (uno o más)</option>
              <option value="0..*">0..* (cero o más)</option>
            </select>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Rol origen:
            </label>
            <input
              type="text"
              value={sourceRole}
              onChange={(e) => setSourceRole(e.target.value)}
              placeholder="Rol opcional"
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ced4da",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Rol destino:
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="Rol opcional"
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ced4da",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            />
          </div>
        </>
      ) : selectedElement ? (
        <>
          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Nombre de la clase:
            </label>
            <input
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ced4da",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "5px",
              }}
            >
              <label style={{ fontWeight: "bold" }}>Atributos:</label>
              <button
                onClick={addAttribute}
                style={{
                  background: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                + Agregar
              </button>
            </div>
            {attributes.map((attr, index) => (
              <div
                key={index}
                style={{ display: "flex", gap: "5px", marginBottom: "5px" }}
              >
                <input
                  type="text"
                  value={attr}
                  onChange={(e) => updateAttribute(index, e.target.value)}
                  placeholder="- atributo: Tipo"
                  style={{
                    flex: 1,
                    padding: "6px",
                    border: "1px solid #ced4da",
                    borderRadius: "4px",
                    fontSize: "12px",
                  }}
                />
                <button
                  onClick={() => removeAttribute(index)}
                  style={{
                    background: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    padding: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: "15px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "5px",
              }}
            >
              <label style={{ fontWeight: "bold" }}>Métodos:</label>
              <button
                onClick={addMethod}
                style={{
                  background: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                + Agregar
              </button>
            </div>
            {methods.map((method, index) => (
              <div
                key={index}
                style={{ display: "flex", gap: "5px", marginBottom: "5px" }}
              >
                <input
                  type="text"
                  value={method}
                  onChange={(e) => updateMethod(index, e.target.value)}
                  placeholder="+ metodo(): Tipo"
                  style={{
                    flex: 1,
                    padding: "6px",
                    border: "1px solid #ced4da",
                    borderRadius: "4px",
                    fontSize: "12px",
                  }}
                />
                <button
                  onClick={() => removeMethod(index)}
                  style={{
                    background: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    padding: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </>
      ) : null}

      <button
        onClick={handleSave}
        style={{
          width: "100%",
          background: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          padding: "10px",
          fontSize: "14px",
          cursor: "pointer",
          fontWeight: "bold",
          marginBottom: "10px",
        }}
      >
        💾 Guardar Cambios
      </button>

      <button
        onClick={handleDelete}
        style={{
          width: "100%",
          background: "#dc3545",
          color: "white",
          border: "none",
          borderRadius: "4px",
          padding: "10px",
          fontSize: "14px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        🗑️ Eliminar Elemento
      </button>
    </div>
  );
};
