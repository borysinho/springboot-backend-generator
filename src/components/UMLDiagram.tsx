import React, { useCallback, useEffect, useRef } from "react";
import { useGraph } from "@joint/react";
import { dia, shapes } from "@joint/core";
import type { CustomElement, UMLRelationship } from "../types";
import { classTemplates } from "../constants/templates";
import { convertRelationshipToLink } from "../utils/relationshipUtils";

/* eslint-disable react-hooks/exhaustive-deps */

interface UMLDiagramProps {
  onAddElement: (
    template: keyof typeof classTemplates,
    x?: number,
    y?: number,
    containerWidth?: number,
    containerHeight?: number
  ) => void;
  onSelectElement: (element: CustomElement | UMLRelationship | null) => void;
  onElementMove?: (elementId: string, x: number, y: number) => void;
  elementMap: Map<string, CustomElement>;
  relationships: UMLRelationship[];
}

export const UMLDiagram: React.FC<UMLDiagramProps> = ({
  onAddElement,
  onSelectElement,
  onElementMove,
  elementMap,
  relationships,
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

    // Agregar event listener para clics en elementos
    paper.on("element:pointerclick", (elementView) => {
      const element = elementView.model;
      const elementId = String(element.id);

      // Buscar el elemento en elementMap
      const customElement = elementMap.get(elementId);
      if (customElement) {
        console.log("Elemento seleccionado:", customElement);
        onSelectElement(customElement);
      }
    });

    // Agregar event listener para clics en el fondo (deseleccionar)
    paper.on("blank:pointerclick", () => {
      console.log("Deseleccionando elemento");
      onSelectElement(null);
    });

    return () => {
      console.log("Limpiando Paper en UMLDiagram...");
      if (paperInstanceRef.current) {
        (paperInstanceRef.current as { remove: () => void }).remove();
        paperInstanceRef.current = null;
      }
    };
  }, [graph]); // Solo depende de graph

  // Configurar event listeners cuando cambien las funciones de callback
  useEffect(() => {
    const paper = paperInstanceRef.current as dia.Paper;
    if (!paper) return;

    // Limpiar event listeners anteriores
    paper.off("element:pointerclick");
    paper.off("link:pointerclick");
    paper.off("blank:pointerclick");

    // Agregar event listener para clics en elementos
    paper.on("element:pointerclick", (elementView: dia.ElementView) => {
      const element = elementView.model;
      const elementId = String(element.id);

      // Buscar el elemento en elementMap
      const customElement = elementMap.get(elementId);
      if (customElement) {
        console.log("Elemento seleccionado:", customElement);
        onSelectElement(customElement);
      }
    });

    // Agregar event listener para clics en links (relaciones)
    paper.on("link:pointerclick", (linkView: dia.LinkView) => {
      const link = linkView.model;
      const linkId = String(link.id);

      // Buscar la relación en la lista de relationships
      const relationship = relationships.find((rel) => rel.id === linkId);
      if (relationship) {
        console.log("Relación seleccionada:", relationship);
        onSelectElement(relationship);
      }
    });

    // Agregar event listener para clics en el fondo (deseleccionar)
    paper.on("blank:pointerclick", () => {
      console.log("Deseleccionando elemento");
      onSelectElement(null);
    });

    console.log("Event listeners configurados en Paper");
  }, [elementMap, relationships, onSelectElement, graph]); // Solo cuando cambien estas dependencias
  useEffect(() => {
    if (!graph) return;

    console.log("Sincronizando elementos en UMLDiagram con el grafo");

    elementMap.forEach((element: CustomElement) => {
      const existingCell = graph.getCell(element.id);

      if (!existingCell) {
        // Crear elemento nuevo si no existe
        console.log("Creando elemento nuevo:", element.id, element.className);

        const newElement = new shapes.standard.Rectangle({
          id: element.id,
          position: { x: element.x, y: element.y },
          size: { width: element.width, height: element.height },
          attrs: {
            body: {
              fill: "#ffffff",
              stroke: "#333333",
              strokeWidth: 2,
              rx: 8,
              ry: 8,
            },
            label: {
              text: element.className,
              fill: "#000000",
              fontSize: 14,
              fontWeight: "bold",
              fontFamily: "monospace",
            },
          },
        });

        graph.addCell(newElement);

        // Configurar event listener para movimientos (solo para elementos nuevos)
        if (onElementMove) {
          newElement.on("change:position", (element, newPosition) => {
            console.log("Elemento movido:", element.id, newPosition);
            onElementMove(element.id, newPosition.x, newPosition.y);
          });
        }

        // Calcular y aplicar el tamaño correcto basado en el contenido
        const headerText = element.stereotype
          ? `<<${element.stereotype}>>\n${element.className}`
          : element.className;
        const attributesText =
          element.attributes?.length > 0 ? element.attributes.join("\n") : "";
        const methodsText =
          element.methods?.length > 0 ? element.methods.join("\n") : "";

        const headerLines = headerText.split("\n").length;
        const attributesLines = attributesText
          ? attributesText.split("\n").length
          : 0;
        const methodsLines = methodsText ? methodsText.split("\n").length : 0;

        let totalHeight: number;
        let calculatedWidth = element.width;

        if (element.elementType === "note") {
          // Usar ancho fijo como los demás elementos, pero aplicar word wrap
          const noteWidth = element.width; // Mantener ancho consistente (200px)
          const wrappedText = wrapText(attributesText, noteWidth - 20, 6);
          const wrappedLines = wrappedText.split("\n").length;

          totalHeight = Math.max(wrappedLines * 18 + 30, 80); // 18px por línea + padding
          calculatedWidth = noteWidth;
        } else {
          const headerHeight = headerLines * 20 + 16;
          const attributesHeight =
            attributesLines > 0 ? attributesLines * 18 + 8 : 0;
          const methodsHeight = methodsLines > 0 ? methodsLines * 18 + 8 : 0;
          totalHeight = Math.max(
            headerHeight + attributesHeight + methodsHeight,
            80
          );
        }

        newElement.set("size", { width: calculatedWidth, height: totalHeight });

        // Aplicar apariencia completa al elemento nuevo
        updateElementVisualAttributes(newElement, element);
      } else {
        // Actualizar apariencia de elemento existente
        console.log(
          "Actualizando apariencia de elemento existente:",
          element.id,
          element.className
        );

        // Solo actualizar si el elemento realmente cambió
        const currentAttrs = existingCell.attributes;
        const attributesText =
          element.attributes?.length > 0 ? element.attributes.join("\n") : "";
        const contentChanged = currentAttrs.noteText?.text !== attributesText;

        const needsSizeUpdate =
          !currentAttrs.size ||
          currentAttrs.size.width !== element.width ||
          currentAttrs.size.height !== element.height ||
          contentChanged; // Para notas, recalcular si el contenido cambió

        if (needsSizeUpdate) {
          // Calcular alturas dinámicas basadas en el contenido
          const headerText = element.stereotype
            ? `<<${element.stereotype}>>\n${element.className}`
            : element.className;

          const attributesText =
            element.attributes?.length > 0 ? element.attributes.join("\n") : "";

          const methodsText =
            element.methods?.length > 0 ? element.methods.join("\n") : "";

          const headerLines = headerText.split("\n").length;
          const attributesLines = attributesText
            ? attributesText.split("\n").length
            : 0;
          const methodsLines = methodsText ? methodsText.split("\n").length : 0;

          let totalHeight: number;
          let calculatedWidth = element.width;

          if (element.elementType === "note") {
            // Usar ancho fijo como los demás elementos, pero aplicar word wrap
            const noteWidth = element.width; // Mantener ancho consistente (200px)
            const wrappedText = wrapText(attributesText, noteWidth - 20, 6);
            const wrappedLines = wrappedText.split("\n").length;

            totalHeight = Math.max(wrappedLines * 18 + 30, 80); // 18px por línea + padding
            calculatedWidth = noteWidth;
          } else {
            // Para otros elementos, usar el cálculo normal
            const headerHeight = headerLines * 20 + 16; // 20px por línea + padding
            const attributesHeight =
              attributesLines > 0 ? attributesLines * 18 + 8 : 0;
            const methodsHeight = methodsLines > 0 ? methodsLines * 18 + 8 : 0;

            totalHeight = Math.max(
              headerHeight + attributesHeight + methodsHeight,
              80
            );
          }

          // Actualizar tamaño del elemento
          existingCell.set("size", {
            width: calculatedWidth,
            height: totalHeight,
          });
        }

        // Siempre actualizar atributos visuales (colores, texto, etc.)
        updateElementVisualAttributes(existingCell, element);
      }
    });
  }, [graph, elementMap]);

  // Sincronizar relaciones con el grafo
  useEffect(() => {
    if (!graph) return;

    console.log("Sincronizando relaciones en UMLDiagram con el grafo");

    // Obtener links existentes en el grafo
    const existingLinks = graph.getLinks();
    const existingLinkIds = new Set(existingLinks.map((link) => link.id));

    // Agregar relaciones que no existen en el grafo
    relationships.forEach((relationship) => {
      if (!existingLinkIds.has(relationship.id)) {
        console.log("Agregando relación nueva:", relationship.id);
        const linkData = convertRelationshipToLink(relationship);
        const newLink = new shapes.standard.Link(linkData);
        graph.addCell(newLink);
      }
    });

    // Remover links que ya no existen en relationships
    existingLinks.forEach((link) => {
      const relationshipExists = relationships.some(
        (rel) => rel.id === link.id
      );
      if (!relationshipExists) {
        console.log("Removiendo relación inexistente:", link.id);
        link.remove();
      }
    });

    // Actualizar apariencia de links existentes (solo propiedades visuales)
    relationships.forEach((relationship) => {
      const existingLink = graph.getCell(relationship.id);
      if (existingLink && existingLink.isLink()) {
        console.log(
          "Actualizando apariencia de relación existente:",
          relationship.id
        );
        const linkData = convertRelationshipToLink(relationship);

        // Solo actualizar etiquetas, NO attrs para no interferir con markers automáticos
        existingLink.set("labels", linkData.labels);
      }
    });
  }, [graph, relationships]);

  // Función auxiliar para dividir texto en líneas con word wrap y truncar si es necesario
  const wrapText = useCallback(
    (text: string, maxWidth: number, maxLines: number = 5): string => {
      if (!text) return "";

      const words = text.split(" ");
      const lines: string[] = [];
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = testLine.length * 8; // Aproximación de ancho por carácter

        if (testWidth <= maxWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            // Palabra demasiado larga, truncarla
            const maxChars = Math.floor(maxWidth / 8);
            lines.push(word.substring(0, maxChars - 3) + "...");
            break;
          }
        }
      }

      if (currentLine) {
        lines.push(currentLine);
      }

      // Limitar a maxLines y agregar "..." si hay más contenido
      if (lines.length > maxLines) {
        return lines.slice(0, maxLines - 1).join("\n") + "\n...";
      }

      return lines.join("\n");
    },
    []
  );
  const updateElementVisualAttributes = useCallback(
    (cell: dia.Cell, element: CustomElement) => {
      // Crear el contenido completo de la clase UML
      const headerText = element.stereotype
        ? `<<${element.stereotype}>>\n${element.className}`
        : element.className;

      const attributesText =
        element.attributes?.length > 0 ? element.attributes.join("\n") : "";

      const methodsText =
        element.methods?.length > 0 ? element.methods.join("\n") : "";

      // Calcular alturas para elementos normales
      const headerLines = headerText.split("\n").length;
      const attributesLines = attributesText
        ? attributesText.split("\n").length
        : 0;

      const headerHeight = headerLines * 20 + 16;
      const attributesHeight =
        attributesLines > 0 ? attributesLines * 18 + 8 : 0;

      // Configurar markup y atributos según el tipo de elemento
      if (element.elementType === "note") {
        // Usar ancho fijo como los demás elementos
        const noteWidth = element.width; // Mantener ancho consistente (200px)

        // Aplicar word wrap al texto de la nota
        const wrappedText = wrapText(attributesText, noteWidth - 20, 6); // 20px padding, máximo 6 líneas

        // Para notas: markup simple con texto centrado
        cell.set("markup", [
          {
            tagName: "rect",
            selector: "body",
          },
          {
            tagName: "text",
            selector: "noteText",
          },
        ]);

        cell.attr({
          body: {
            fill: "#fffde7",
            stroke: "#FFC107",
            strokeWidth: 2,
            rx: 8,
            ry: 8,
          },
          noteText: {
            text: wrappedText,
            fill: "#000000",
            fontSize: 12,
            fontFamily: "monospace",
            textAnchor: "middle",
            x: noteWidth / 2, // Usar el ancho calculado
            y: 25, // Posición inicial del texto (desde arriba)
          },
        });
      } else {
        // Para clases/interfaces/enumeraciones/packages: estructura completa
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
          ...(attributesText
            ? [
                {
                  tagName: "text",
                  selector: "attributesLabel",
                },
              ]
            : []),
          ...(attributesText && methodsText
            ? [
                {
                  tagName: "line",
                  selector: "attributesLine",
                },
              ]
            : []),
          ...(methodsText
            ? [
                {
                  tagName: "text",
                  selector: "methodsLabel",
                },
              ]
            : []),
        ]);

        // Configurar colores según el tipo
        const getElementColors = (elementType: string) => {
          switch (elementType) {
            case "interface":
              return { fill: "#e3f2fd", stroke: "#2196F3" };
            case "enumeration":
              return { fill: "#efebe9", stroke: "#795548" };
            case "package":
              return { fill: "#e8eaf6", stroke: "#3F51B5" };
            case "class":
            default:
              return { fill: "#ffffff", stroke: "#333333" };
          }
        };

        const colors = getElementColors(element.elementType);

        // Configurar atributos para mostrar estructura UML completa
        cell.attr({
          body: {
            fill: colors.fill,
            stroke: colors.stroke,
            strokeWidth: 2,
            rx: 8,
            ry: 8,
          },
          headerLabel: {
            text: headerText,
            fill: "#000000",
            fontSize: 14,
            fontWeight: "bold",
            fontFamily: "monospace",
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
            fontFamily: "monospace",
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
            fontFamily: "monospace",
            x: 8,
            y: methodsY,
            textAnchor: "start",
          });
        }
      }
    },
    []
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
