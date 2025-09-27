import React from "react";
import type { CustomElement } from "../types";

interface UMLClassProps {
  element: CustomElement;
  isSelected?: boolean;
  onSelect?: (element: CustomElement) => void;
}

export const UMLClass: React.FC<UMLClassProps> = ({
  element,
  isSelected = false,
  onSelect,
}) => {
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
};
