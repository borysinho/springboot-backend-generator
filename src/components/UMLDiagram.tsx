import React, { useCallback, useEffect } from "react";
import { Paper, useGraph } from "@joint/react";
import { UMLClass } from "./UMLClass";
import type { CustomElement, UMLRelationship } from "../types";
import {
  classTemplates,
  validateElementPosition,
} from "../constants/templates";

interface UMLDiagramProps {
  onAddElement: (
    template: keyof typeof classTemplates,
    x?: number,
    y?: number,
    containerWidth?: number,
    containerHeight?: number
  ) => void;
  selectedElement: CustomElement | UMLRelationship | null;
  onSelectElement: (element: CustomElement) => void;
  onUpdateElementPosition: (elementId: string, x: number, y: number) => void;
  onSelectRelationship: (relationship: UMLRelationship) => void;
  dynamicLinks: UMLRelationship[];
}

export const UMLDiagram: React.FC<UMLDiagramProps> = ({
  onAddElement,
  selectedElement,
  onSelectElement,
  onUpdateElementPosition,
  onSelectRelationship,
  dynamicLinks,
}) => {
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

        // Obtener dimensiones del contenedor
        const containerWidth = rect.width;
        const containerHeight = rect.height;

        console.log(
          "Drop position:",
          x,
          y,
          "Container size:",
          containerWidth,
          containerHeight
        );
        onAddElement(template, x, y, containerWidth, containerHeight);
      }
    },
    [onAddElement]
  );

  // Hook para acceder al grafo de JointJS
  const graph = useGraph();

  // Escuchar cambios de posición de elementos
  useEffect(() => {
    if (!graph) return;

    const handleElementMove = (element: {
      id: string;
      position: () => { x: number; y: number };
      set: (key: string, value: { x: number; y: number }) => void;
    }) => {
      const position = element.position();
      let { x, y } = position;
      const elementId = element.id;

      // Validar límites para evitar que los elementos se salgan del área visible
      // Obtener dimensiones del contenedor del diagrama
      const diagramElement = document.querySelector(
        "[data-diagram]"
      ) as HTMLElement;
      if (diagramElement) {
        const containerWidth = diagramElement.offsetWidth;
        const containerHeight = diagramElement.offsetHeight;

        const validatedPosition = validateElementPosition(
          x,
          y,
          containerWidth,
          containerHeight
        );

        // Si la posición cambió, actualizarla en el grafo
        if (validatedPosition.x !== x || validatedPosition.y !== y) {
          element.set("position", validatedPosition);
          x = validatedPosition.x;
          y = validatedPosition.y;
        }
      }

      // Actualizar la posición en el estado de la aplicación
      onUpdateElementPosition(elementId, x, y);
    };

    // Escuchar el evento 'change:position' en todos los elementos
    graph.on("change:position", handleElementMove);

    // Cleanup
    return () => {
      graph.off("change:position", handleElementMove);
    };
  }, [graph, onUpdateElementPosition]);

  // Agregar event listeners directamente a los elementos DOM de los links
  useEffect(() => {
    const handleLinkElementClick = (event: Event) => {
      const target = event.target as HTMLElement;
      console.log("Link element clicked:", target);

      // Buscar el elemento padre que tenga el model-id
      const linkElement = target.closest("[model-id]") as HTMLElement;
      if (linkElement) {
        const linkId = linkElement.getAttribute("model-id");
        console.log("Found link ID from DOM:", linkId);
        if (linkId) {
          const relationship = dynamicLinks.find(
            (rel: UMLRelationship) => rel.id === linkId
          );
          console.log("Found relationship:", relationship);
          if (relationship) {
            onSelectRelationship(relationship);
          }
        }
      }
    };

    // Función para agregar listeners a los links existentes
    const addListenersToLinks = () => {
      // Buscar todos los elementos de link en el DOM
      const linkElements = document.querySelectorAll("[model-id]");
      console.log("Found link elements in DOM:", linkElements.length);

      linkElements.forEach((element) => {
        const modelId = element.getAttribute("model-id");
        // Verificar si es un link (no un elemento)
        const isLink = dynamicLinks.some((link) => link.id === modelId);
        if (isLink && !element.hasAttribute("data-link-listener")) {
          console.log("Adding click listener to link element:", modelId);
          element.addEventListener("click", handleLinkElementClick);
          element.setAttribute("data-link-listener", "true");
        }
      });
    };

    // Agregar listeners inicialmente
    setTimeout(addListenersToLinks, 100);

    // Observer para detectar cuando se agregan nuevos links al DOM
    const observer = new MutationObserver((mutations) => {
      let shouldAddListeners = false;
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (
                element.hasAttribute("model-id") ||
                element.querySelector("[model-id]")
              ) {
                shouldAddListeners = true;
              }
            }
          });
        }
      });
      if (shouldAddListeners) {
        setTimeout(addListenersToLinks, 50);
      }
    });

    // Observar cambios en el DOM
    const diagramElement = document.querySelector("[data-diagram]");
    if (diagramElement) {
      observer.observe(diagramElement, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      observer.disconnect();
      // Remover listeners de todos los elementos
      const linkElements = document.querySelectorAll("[data-link-listener]");
      linkElements.forEach((element) => {
        element.removeEventListener("click", handleLinkElementClick);
        element.removeAttribute("data-link-listener");
      });
    };
  }, [dynamicLinks, onSelectRelationship]);

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
        {/* Arrastra elementos desde la barra lateral para agregarlos */}
      </div>
      <Paper
        width="100%"
        height="100%"
        renderElement={renderElement}
        useHTMLOverlay
        interactive
      />
    </div>
  );
};
