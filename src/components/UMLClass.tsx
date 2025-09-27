import React, { useState, useRef, useCallback, useEffect } from "react";
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
  const [isDragging, setIsDragging] = useState(false);
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
    setIsDragging(false);
  }, []);

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (mouseDownPos.current) {
        const deltaX = Math.abs(e.clientX - mouseDownPos.current.x);
        const deltaY = Math.abs(e.clientY - mouseDownPos.current.y);

        // Si el movimiento es menor a 5px, considerarlo como un click
        if (deltaX < 5 && deltaY < 5 && !isDragging) {
          onSelect?.(element);
        }
      }
    },
    [element, isDragging, onSelect]
  );

  // Detectar si se está arrastrando
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (mouseDownPos.current) {
        const deltaX = Math.abs(e.clientX - mouseDownPos.current.x);
        const deltaY = Math.abs(e.clientY - mouseDownPos.current.y);

        if (deltaX > 5 || deltaY > 5) {
          setIsDragging(true);
        }
      }
    };

    const handleMouseUpGlobal = () => {
      mouseDownPos.current = null;
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUpGlobal);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUpGlobal);
    };
  }, []);
  // Determinar el tipo de elemento basado en su contenido
  const getElementType = () => {
    // Usar el tipo fijo del elemento en lugar de determinar dinámicamente
    return element.elementType;
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
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
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
