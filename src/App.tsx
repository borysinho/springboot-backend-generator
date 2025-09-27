import React, { useCallback, useState } from "react";
import {
  GraphProvider,
  Paper,
  createElements,
} from "@joint/react";
import "./App.css";

// Definir elementos UML (clases)
// Definir el tipo CustomElement explícitamente
type CustomElement = {
  id: string;
  className: string;
  attributes: string[];
  methods: string[];
  x: number;
  y: number;
  width: number;
  height: number;
};

// Definir el tipo para relaciones UML
type UMLRelationship = {
  id: string;
  source: string;
  target: string;
  relationship:
    | "association"
    | "aggregation"
    | "composition"
    | "generalization"
    | "dependency"
    | "realization";
  label?: string;
  sourceMultiplicity?: string;
  targetMultiplicity?: string;
  sourceRole?: string;
  targetRole?: string;
};

const initialElements = createElements([
  // Diagrama vacío - sin elementos de ejemplo
]);

// Función para convertir UMLRelationship a link de JointJS con multiplicidad
const convertRelationshipToLink = (relationship: UMLRelationship) => {
  const link = {
    id: relationship.id,
    source: { id: relationship.source },
    target: { id: relationship.target },
    labels: [] as any[],
    attrs: {} as any,
  };

  // Agregar etiqueta de relación si existe
  if (relationship.label) {
    link.labels.push({
      position: 0.5,
      attrs: {
        text: {
          text: relationship.label,
          fill: '#333',
          fontSize: 12,
          fontWeight: 'bold',
        },
        rect: {
          fill: 'white',
          stroke: '#333',
          strokeWidth: 1,
          rx: 3,
          ry: 3,
        },
      },
    });
  }

  // Agregar multiplicidad en el extremo source (origen)
  if (relationship.sourceMultiplicity) {
    link.labels.push({
      position: 0.1, // Cerca del extremo source
      attrs: {
        text: {
          text: relationship.sourceMultiplicity,
          fill: '#666',
          fontSize: 11,
        },
      },
    });
  }

  // Agregar multiplicidad en el extremo target (destino)
  if (relationship.targetMultiplicity) {
    link.labels.push({
      position: 0.9, // Cerca del extremo target
      attrs: {
        text: {
          text: relationship.targetMultiplicity,
          fill: '#666',
          fontSize: 11,
        },
      },
    });
  }

  // Configurar el estilo de la línea según el tipo de relación
  switch (relationship.relationship) {
    case 'aggregation':
      link.attrs = {
        '.connection': { stroke: '#9C27B0', strokeWidth: 2 },
        '.marker-target': { fill: '#9C27B0', stroke: '#9C27B0', d: 'M 10 0 L 0 5 L 10 10 z' },
      };
      break;
    case 'composition':
      link.attrs = {
        '.connection': { stroke: '#673AB7', strokeWidth: 2 },
        '.marker-target': { fill: '#673AB7', stroke: '#673AB7', d: 'M 10 0 L 0 5 L 10 10 z' },
      };
      break;
    case 'generalization':
      link.attrs = {
        '.connection': { stroke: '#3F51B5', strokeWidth: 2 },
        '.marker-target': { fill: 'white', stroke: '#3F51B5', strokeWidth: 2, d: 'M 10 0 L 0 5 L 10 10 z' },
      };
      break;
    case 'dependency':
      link.attrs = {
        '.connection': { stroke: '#607D8B', strokeWidth: 1, strokeDasharray: '5,5' },
        '.marker-target': { fill: '#607D8B', d: 'M 10 0 L 0 5 L 10 10 z' },
      };
      break;
    case 'realization':
      link.attrs = {
        '.connection': { stroke: '#00BCD4', strokeWidth: 1, strokeDasharray: '5,5' },
        '.marker-target': { fill: 'white', stroke: '#00BCD4', strokeWidth: 2, d: 'M 10 0 L 0 5 L 10 10 z' },
      };
      break;
    default: // association
      link.attrs = {
        '.connection': { stroke: '#FF5722', strokeWidth: 2 },
        '.marker-target': { fill: '#FF5722', d: 'M 10 0 L 0 5 L 10 10 z' },
      };
  }

  return link;
};

// Templates para diferentes tipos de clases UML
const classTemplates = {
  class: {
    className: "NuevaClase",
    attributes: ["- atributo1: String"],
    methods: ["+ metodo1(): void"],
  },
  interface: {
    className: "NuevaInterfaz",
    attributes: [],
    methods: ["metodoAbstracto(): void"], // Sin visibilidad, implícitamente público
  },
  enumeration: {
    className: "Enumeracion",
    attributes: ["VALOR1", "VALOR2", "VALOR3"], // Valores literales sin tipo ni visibilidad
    methods: [],
  },
  package: {
    className: "Paquete",
    attributes: [],
    methods: [],
  },
  note: {
    className: "Nota",
    attributes: ["Esta es una nota importante sobre el diseño del sistema"], // Texto plano único
    methods: [],
  },
};

// Barra lateral de herramientas para agregar elementos
function Toolbar() {
  const handleDragStart = (
    e: React.DragEvent,
    template: keyof typeof classTemplates
  ) => {
    e.dataTransfer.setData("text/plain", template);
    e.dataTransfer.effectAllowed = "copy";
  };

  const toolbarItems = [
    { key: "class", label: "📄 Clase", color: "#4CAF50" },
    { key: "interface", label: "🔗 Interfaz", color: "#2196F3" },
    { key: "enumeration", label: "🔢 Enumeración", color: "#795548" },
    { key: "package", label: "📦 Paquete", color: "#3F51B5" },
    { key: "note", label: "📝 Nota", color: "#FFC107" },
    { key: "association", label: "➡️ Asociación", color: "#FF5722" },
    { key: "aggregation", label: "◇ Agregación", color: "#9C27B0" },
    { key: "composition", label: "◆ Composición", color: "#673AB7" },
    { key: "generalization", label: "△ Generalización", color: "#3F51B5" },
    { key: "dependency", label: "⤸ Dependencia", color: "#607D8B" },
    { key: "realization", label: "△ Realización", color: "#00BCD4" },
  ];

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
            handleDragStart(e, item.key as keyof typeof classTemplates)
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
}

// Componente del panel de propiedades
function PropertiesPanel({
  selectedElement,
  onUpdateElement,
  onUpdateRelationship,
  onClose,
}: {
  selectedElement: CustomElement | UMLRelationship | null;
  onUpdateElement: (element: CustomElement) => void;
  onUpdateRelationship: (relationship: UMLRelationship) => void;
  onClose: () => void;
}) {
  const [className, setClassName] = React.useState("");
  const [attributes, setAttributes] = React.useState<string[]>([]);
  const [methods, setMethods] = React.useState<string[]>([]);
  const [relationshipLabel, setRelationshipLabel] = React.useState("");
  const [sourceMultiplicity, setSourceMultiplicity] = React.useState("");
  const [targetMultiplicity, setTargetMultiplicity] = React.useState("");
  const [sourceRole, setSourceRole] = React.useState("");
  const [targetRole, setTargetRole] = React.useState("");

  // Actualizar el estado local cuando cambia el elemento seleccionado
  React.useEffect(() => {
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
        }}
      >
        💾 Guardar Cambios
      </button>
    </div>
  );
}

// Componente para renderizar una clase UML
function UMLClass({
  element,
  isSelected = false,
  onSelect,
}: {
  element: CustomElement;
  isSelected?: boolean;
  onSelect?: (element: CustomElement) => void;
}) {
  // Determinar el tipo de elemento basado en su contenido
  const getElementType = () => {
    if (!element.methods || element.methods.length === 0) {
      if (!element.attributes || element.attributes.length === 0) {
        return "package";
      }
      // Si tiene atributos pero no métodos, podría ser enumeración o nota
      if (
        element.attributes.some(
          (attr) => !attr.includes(":") && !attr.includes("(")
        )
      ) {
        return "enumeration";
      }
      return "note";
    }
    // Si tiene métodos pero no atributos, es una interfaz
    if (!element.attributes || element.attributes.length === 0) {
      return "interface";
    }
    // Si tiene ambos, es una clase
    return "class";
  };

  const elementType = getElementType();

  const getElementStyle = () => {
    switch (elementType) {
      case "interface":
        return {
          border: "2px solid #2196F3",
          background: "#e3f2fd",
        };
      case "enumeration":
        return {
          border: "2px solid #795548",
          background: "#efebe9",
        };
      case "package":
        return {
          border: "2px solid #3F51B5",
          background: "#e8eaf6",
        };
      case "note":
        return {
          border: "2px solid #FFC107",
          background: "#fffde7",
          fontFamily: "Arial, sans-serif",
        };
      default:
        return {
          border: "2px solid #333",
          background: "white",
        };
    }
  };

  const getHeaderStyle = () => {
    switch (elementType) {
      case "interface":
        return { background: "#bbdefb" };
      case "enumeration":
        return { background: "#d7ccc8" };
      case "package":
        return { background: "#c5cae9" };
      case "note":
        return { background: "#fff9c4" };
      default:
        return { background: "#e3f2fd" };
    }
  };

  const style = getElementStyle();
  const headerStyle = getHeaderStyle();

  return (
    <div
      style={{
        ...style,
        borderRadius: "8px",
        fontFamily: elementType === "note" ? "Arial, sans-serif" : "monospace",
        fontSize: "12px",
        overflow: "hidden",
        boxShadow: isSelected
          ? "0 0 0 3px #007bff, 2px 2px 5px rgba(0,0,0,0.1)"
          : "2px 2px 5px rgba(0,0,0,0.1)",
        minWidth: "150px",
        cursor: onSelect ? "pointer" : "default",
        transition: "box-shadow 0.2s",
      }}
      onClick={() => onSelect && onSelect(element)}
    >
      {/* Nombre del elemento */}
      <div
        style={{
          ...headerStyle,
          padding: "8px",
          fontWeight: "bold",
          textAlign: "center",
          borderBottom: "1px solid #333",
          fontStyle:
            elementType === "interface" || elementType === "enumeration"
              ? "italic"
              : "normal",
        }}
      >
        {elementType === "interface" && "«interface»"}
        {elementType === "enumeration" && "«enumeration»"}
        {elementType === "package" && "📦"}
        {element.className}
      </div>

      {/* Contenido basado en el tipo */}
      {elementType === "interface" && (
        <div style={{ padding: "4px 8px" }}>
          {element.methods?.map((method, index) => (
            <div key={index} style={{ margin: "2px 0" }}>
              {method}
            </div>
          ))}
        </div>
      )}

      {elementType === "enumeration" && (
        <div style={{ padding: "8px" }}>
          {element.attributes?.map((value, index) => (
            <div key={index} style={{ margin: "4px 0", textAlign: "center" }}>
              {value}
            </div>
          ))}
        </div>
      )}

      {elementType === "note" && (
        <div style={{ padding: "8px", fontSize: "11px", lineHeight: "1.4" }}>
          {element.attributes?.map((line, index) => (
            <div key={index} style={{ margin: "2px 0" }}>
              {line}
            </div>
          ))}
        </div>
      )}

      {elementType === "package" && (
        <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
          Paquete vacío
        </div>
      )}

      {elementType === "class" && (
        <>
          {/* Atributos */}
          <div
            style={{
              padding: "4px 8px",
              borderBottom:
                element.methods && element.methods.length > 0
                  ? "1px solid #ddd"
                  : "none",
              minHeight: "20px",
            }}
          >
            {element.attributes?.map((attr, index) => (
              <div key={index} style={{ margin: "2px 0" }}>
                {attr}
              </div>
            ))}
          </div>

          {/* Métodos */}
          {element.methods && element.methods.length > 0 && (
            <div style={{ padding: "4px 8px" }}>
              {element.methods.map((method, index) => (
                <div key={index} style={{ margin: "2px 0" }}>
                  {method}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Componente principal del diagrama UML
function UMLDiagram({
  onAddElement,
  selectedElement,
  onSelectElement,
}: {
  onAddElement: (
    template: keyof typeof classTemplates,
    x?: number,
    y?: number
  ) => void;
  selectedElement: CustomElement | UMLRelationship | null;
  onSelectElement: (element: CustomElement) => void;
}) {
  const renderElement = useCallback(
    (element: CustomElement) => {
      return (
        <UMLClass
          element={element}
          isSelected={
            !!(
              selectedElement &&
              "className" in selectedElement &&
              selectedElement?.id === element.id
            )
          }
          onSelect={onSelectElement}
        />
      );
    },
    [selectedElement, onSelectElement]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const template = e.dataTransfer.getData(
        "text/plain"
      ) as keyof typeof classTemplates;

      console.log("Drop event on diagram:", template, classTemplates[template]);

      if (template) {
        // Calcular la posición relativa al diagrama
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        console.log("Drop position:", x, y);
        onAddElement(template, x, y);
      }
    },
    [onAddElement]
  );

  return (
    <div
      style={{
        height: "600px",
        border: "2px dashed #ccc",
        background: "#f9f9f9",
        position: "relative",
        borderRadius: "8px",
        overflow: "hidden",
      }}
      data-diagram
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          background: "rgba(255, 255, 255, 0.9)",
          padding: "5px 10px",
          borderRadius: "4px",
          fontSize: "12px",
          color: "#666",
          pointerEvents: "none",
          zIndex: 10,
        }}
      >
        Arrastra elementos desde la barra lateral para agregarlos
      </div>
      <Paper
        width="100%"
        height="100%"
        renderElement={renderElement}
        useHTMLOverlay
      />
    </div>
  );
}

function App() {
  const [dynamicElements, setDynamicElements] = useState<CustomElement[]>([]);
  const [elementCounter, setElementCounter] = useState(5);
  const [selectedElement, setSelectedElement] = useState<
    CustomElement | UMLRelationship | null
  >(null);

  // Estados para manejar relaciones UML
  const [relationshipMode, setRelationshipMode] = useState<string | null>(null);
  const [firstSelectedElement, setFirstSelectedElement] =
    useState<CustomElement | null>(null);
  const [dynamicLinks, setDynamicLinks] = useState<UMLRelationship[]>([]);

  const handleAddElement = useCallback(
    (
      template: keyof typeof classTemplates | string,
      x?: number,
      y?: number
    ) => {
      console.log("Adding element/relationship:", template, x, y);

      // Verificar si es una relación UML
      const relationshipTypes = [
        "association",
        "aggregation",
        "composition",
        "generalization",
        "dependency",
        "realization",
      ];
      if (relationshipTypes.includes(template)) {
        // Activar modo de relación
        setRelationshipMode(template);
        setFirstSelectedElement(null);
        console.log("Relationship mode activated:", template);
        return;
      }

      const templateData =
        classTemplates[template as keyof typeof classTemplates];

      // Usar posición proporcionada o calcular automáticamente
      let newX: number, newY: number;

      if (x !== undefined && y !== undefined) {
        // Posición específica del drop
        newX = Math.max(0, x - 100); // Centrar el elemento en la posición del drop
        newY = Math.max(0, y - 60);
      } else {
        // Posición automática
        const existingElements = [...initialElements, ...dynamicElements];
        const maxX = Math.max(...existingElements.map((el) => el.x || 0), 0);
        const maxY = Math.max(...existingElements.map((el) => el.y || 0), 0);

        newX = maxX + 250;
        newY = maxY > 200 ? 50 : maxY + 170;
      }

      const newElement = {
        id: elementCounter.toString(),
        className: templateData.className,
        attributes: [...templateData.attributes],
        methods: [...templateData.methods],
        x: newX,
        y: newY,
        width: 200,
        height: 120,
      };

      setDynamicElements((prev) => [...prev, newElement]);
      setElementCounter((prev) => prev + 1);
      console.log("Element added:", newElement);
    },
    [dynamicElements, elementCounter]
  );

  const handleSelectElement = useCallback(
    (element: CustomElement) => {
      if (relationshipMode) {
        // Modo de relación activo
        if (!firstSelectedElement) {
          // Seleccionar primer elemento
          setFirstSelectedElement(element);
          console.log(
            "First element selected for relationship:",
            element.className
          );
        } else if (firstSelectedElement.id !== element.id) {
          // Seleccionar segundo elemento y crear relación
          const newRelationship: UMLRelationship = {
            id: `link-${Date.now()}`,
            source: firstSelectedElement.id,
            target: element.id,
            relationship: relationshipMode as UMLRelationship["relationship"],
            label: relationshipMode,
          };

          setDynamicLinks((prev) => [...prev, newRelationship]);
          // El grafo se recrea automáticamente cuando cambian las dynamicLinks

          console.log("Relationship created:", newRelationship);

          // Resetear modo de relación
          setRelationshipMode(null);
          setFirstSelectedElement(null);
        }
      } else {
        // Modo normal - seleccionar elemento para edición
        setSelectedElement(element);
      }
    },
    [relationshipMode, firstSelectedElement]
  );

  const handleUpdateElement = useCallback((updatedElement: CustomElement) => {
    // Actualizar en elementos dinámicos
    setDynamicElements((prev) =>
      prev.map((el) => (el.id === updatedElement.id ? updatedElement : el))
    );
    // Actualizar elemento seleccionado
    setSelectedElement(updatedElement);
    // El grafo se recrea automáticamente cuando cambian los dynamicElements
  }, []);

  const handleUpdateRelationship = useCallback(
    (updatedRelationship: UMLRelationship) => {
      // Actualizar en relaciones dinámicas
      setDynamicLinks((prev) =>
        prev.map((rel) =>
          rel.id === updatedRelationship.id ? updatedRelationship : rel
        )
      );
      // Actualizar relación seleccionada
      setSelectedElement(updatedRelationship);
      // No forzar recreación del grafo para relaciones - actualizar directamente
      // setUpdateCounter((prev) => prev + 1);
    },
    []
  );

  const handleDeselectElement = useCallback(() => {
    if (relationshipMode) {
      // Cancelar modo de relación
      setRelationshipMode(null);
      setFirstSelectedElement(null);
      console.log("Relationship mode cancelled");
    } else {
      // Deseleccionar elemento normal
      setSelectedElement(null);
    }
  }, [relationshipMode]);

  // Combinar elementos iniciales con dinámicos
  const allElements = [...initialElements, ...dynamicElements];
  
  // Convertir relaciones dinámicas a links de JointJS con multiplicidad
  const convertedDynamicLinks = dynamicLinks.map(convertRelationshipToLink);
  
  // Usar links convertidos (initialLinks estaba vacío)
  const allLinks = convertedDynamicLinks;  console.log(
    "All elements:",
    allElements.length,
    "dynamic:",
    dynamicElements.length
  );

  // Recrear el key del GraphProvider cuando cambien los elementos o relaciones dinámicas
  // Esto fuerza a React a recrear el grafo con los nuevos elementos/links
  const graphKey = `graph-${dynamicElements.length}-${dynamicLinks.length}-${dynamicLinks.map(l => l.id + (l.sourceMultiplicity || '') + (l.targetMultiplicity || '')).join('-')}`;

  return (
    <div
      style={{
        padding: "20px",
        display: "flex",
        gap: "20px",
        alignItems: "flex-start",
      }}
    >
      <Toolbar />

      <div style={{ flex: 1 }}>
        {dynamicLinks.length > 0 && (
          <button
            onClick={() => {
              const lastRelationship = dynamicLinks[dynamicLinks.length - 1];
              setSelectedElement(lastRelationship);
            }}
            style={{
              background: "#17a2b8",
              color: "white",
              border: "none",
              borderRadius: "4px",
              padding: "8px 16px",
              cursor: "pointer",
              fontSize: "14px",
              marginBottom: "10px",
            }}
          >
            🔗 Seleccionar Última Relación
          </button>
        )}

        {relationshipMode && (
          <div
            style={{
              backgroundColor: "#FFF3CD",
              border: "1px solid #FFEAA7",
              borderRadius: "4px",
              padding: "10px",
              marginBottom: "10px",
              color: "#856404",
            }}
          >
            <strong>Modo Relación Activo:</strong> Creando {relationshipMode}.
            {firstSelectedElement
              ? `Primer elemento seleccionado: "${firstSelectedElement.className}". Haz clic en el segundo elemento.`
              : "Haz clic en el primer elemento para iniciar la relación."}
            <button
              onClick={() => {
                setRelationshipMode(null);
                setFirstSelectedElement(null);
              }}
              style={{
                marginLeft: "10px",
                backgroundColor: "#6C757D",
                color: "white",
                border: "none",
                borderRadius: "3px",
                padding: "2px 6px",
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
          </div>
        )}

        <div style={{ display: "flex", gap: "20px" }}>
          <div style={{ flex: 1 }}>
            <GraphProvider
              key={graphKey}
              initialElements={allElements}
              initialLinks={allLinks}
            >
              <UMLDiagram
                onAddElement={handleAddElement}
                selectedElement={selectedElement}
                onSelectElement={handleSelectElement}
              />
            </GraphProvider>
          </div>

          {selectedElement && (
            <PropertiesPanel
              selectedElement={selectedElement}
              onUpdateElement={handleUpdateElement}
              onUpdateRelationship={handleUpdateRelationship}
              onClose={handleDeselectElement}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
