import React, { useCallback, useEffect, useRef } from "react";
import { useGraph } from "@joint/react";
import { dia, shapes } from "@joint/core";
import type { CustomElement, UMLRelationship } from "../types";
import { classTemplates } from "../constants/templates";

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
  elementMap: Map<string, CustomElement>;
}

export const UMLDiagram: React.FC<UMLDiagramProps> = ({
  onAddElement,
  selectedElement,
  onSelectElement,
  onUpdateElementPosition,
  onSelectRelationship,
  dynamicLinks,
  elementMap,
}) => {
  const graph = useGraph();
  const paperRef = useRef<HTMLDivElement>(null);
  const paperInstanceRef = useRef<unknown>(null);

  // Inicializar Paper manualmente
  useEffect(() => {
    if (!graph || !paperRef.current) {
      console.log("Graph o paperRef no disponible");
      return;
    }

    console.log("Inicializando Paper manualmente en UMLDiagram...");

    // Verificar el contenedor
    console.log("Contenedor del Paper:", paperRef.current);
    console.log(
      "Dimensiones del contenedor:",
      paperRef.current?.getBoundingClientRect()
    );

    // Crear Paper usando JointJS puro
    const paper = new dia.Paper({
      el: paperRef.current,
      model: graph,
      width: "100%",
      height: "100%",
      gridSize: 10,
      drawGrid: { name: "mesh", args: { color: "#ddd", thickness: 1 } },
      interactive: true,
      cellViewNamespace: shapes,
    });

    paperInstanceRef.current = paper;
    console.log("Paper creado en UMLDiagram:", paper);
    console.log("Elemento del Paper:", paper.el);
    console.log("SVG del Paper:", paper.svg);

    // Verificar que el Paper se agregó al DOM
    setTimeout(() => {
      console.log("Verificación post-creación en UMLDiagram:");
      console.log("Paper en DOM:", document.contains(paper.el));
      console.log("SVG en DOM:", document.contains(paper.svg));
      console.log("Celdas en grafo:", graph.getCells().length);
    }, 100);

    return () => {
      console.log("Limpiando Paper en UMLDiagram...");
      if (paperInstanceRef.current) {
        (paperInstanceRef.current as { remove: () => void }).remove();
        paperInstanceRef.current = null;
      }
    };
  }, [graph]);

  // Actualizar apariencia de elementos existentes cuando cambie elementMap
  useEffect(() => {
    if (!graph) return;

    console.log("Actualizando apariencia de elementos en UMLDiagram");

    elementMap.forEach((element: CustomElement) => {
      const cell = graph.getCell(element.id);
      if (cell) {
        console.log(
          "Actualizando apariencia de elemento:",
          element.id,
          element.className
        );

        // Crear el contenido completo de la clase UML
        const headerText = element.stereotype
          ? `${element.stereotype}\n${element.className}`
          : element.className;

        const attributesText =
          element.attributes?.length > 0 ? element.attributes.join("\n") : "";

        const methodsText =
          element.methods?.length > 0 ? element.methods.join("\n") : "";

        // Calcular alturas dinámicas basadas en el contenido
        const headerLines = headerText.split("\n").length;
        const attributesLines = attributesText
          ? attributesText.split("\n").length
          : 0;
        const methodsLines = methodsText ? methodsText.split("\n").length : 0;

        const headerHeight = headerLines * 20 + 16; // 20px por línea + padding
        const attributesHeight =
          attributesLines > 0 ? attributesLines * 18 + 8 : 0;
        const methodsHeight = methodsLines > 0 ? methodsLines * 18 + 8 : 0;

        const totalHeight = Math.max(
          headerHeight + attributesHeight + methodsHeight,
          80
        );

        // Actualizar tamaño del elemento
        cell.set("size", { width: element.width, height: totalHeight });

        // Configurar markup personalizado para estructura UML
        cell.set("markup", [
          {
            tagName: "rect",
            selector: "body",
          },
          {
            tagName: "text",
            selector: "headerLabel",
          },
          {
            tagName: "line",
            selector: "headerLine",
          },
          ...(attributesText ? [
            {
              tagName: "text",
              selector: "attributesLabel",
            }
          ] : []),
          ...(attributesText && methodsText ? [
            {
              tagName: "line",
              selector: "attributesLine",
            }
          ] : []),
          ...(methodsText ? [
            {
              tagName: "text",
              selector: "methodsLabel",
            }
          ] : []),
        ]);

        // Configurar atributos para mostrar estructura UML completa
        cell.attr({
          body: {
            fill: "#ffffff",
            stroke: "#000000",
            strokeWidth: 2,
            rx: 8,
            ry: 8,
            width: element.width,
            height: totalHeight,
          },
          headerLabel: {
            text: headerText,
            fill: "#000000",
            fontSize: 14,
            fontWeight: "bold",
            x: element.width / 2,
            y: 20,
            textAnchor: "middle",
          },
          headerLine: {
            x1: 0,
            y1: headerHeight,
            x2: element.width,
            y2: headerHeight,
            stroke: "#000000",
            strokeWidth: 1,
          },
        });

        // Atributos (si existen)
        if (attributesText) {
          cell.attr("attributesLabel", {
            text: attributesText,
            fill: "#000000",
            fontSize: 12,
            x: 8,
            y: headerHeight + 20,
            textAnchor: "start",
          });

          // Línea separadora entre atributos y métodos
          if (methodsText) {
            const attributesBottom = headerHeight + attributesHeight;
            cell.attr("attributesLine", {
              x1: 0,
              y1: attributesBottom,
              x2: element.width,
              y2: attributesBottom,
              stroke: "#000000",
              strokeWidth: 1,
            });
          }
        }

        // Métodos (si existen)
        if (methodsText) {
          const methodsY = headerHeight + attributesHeight + 20;
          cell.attr("methodsLabel", {
            text: methodsText,
            fill: "#000000",
            fontSize: 12,
            x: 8,
            y: methodsY,
            textAnchor: "start",
          });
        }
      }
    });
  }, [graph, elementMap]);

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

  return (
    <div
      ref={paperRef}
      style={{
        width: "100%",
        height: "100%",
        border: "1px solid #ccc",
        borderRadius: "4px",
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    />
  );
};
