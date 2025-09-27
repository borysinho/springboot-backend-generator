import React, { useCallback, useState, useEffect } from "react";
import { GraphProvider, createElements } from "@joint/react";
import "./App.css";

// Importar tipos
import type { CustomElement, UMLRelationship } from "./types";

// Importar constantes
import { classTemplates } from "./constants/templates";

// Importar utilidades
import { convertRelationshipToLink } from "./utils/relationshipUtils";

// Importar componentes
import { Toolbar } from "./components/Toolbar";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { UMLDiagram } from "./components/UMLDiagram";

const initialElements = createElements([
  // Diagrama vacío - sin elementos de ejemplo
]);

// Componente principal del diagrama UML
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

  const handleDragStart = useCallback(
    (e: React.DragEvent, template: keyof typeof classTemplates) => {
      e.dataTransfer.setData("text/plain", template);
      e.dataTransfer.effectAllowed = "copy";
    },
    []
  );

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
        elementType: templateData.elementType,
        ...(templateData.elementType === "package" && { containedElements: [] }),
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

  const handleUpdateElementPosition = useCallback(
    (elementId: string, x: number, y: number) => {
      // Actualizar la posición del elemento en dynamicElements
      setDynamicElements((prev) =>
        prev.map((el) => (el.id === elementId ? { ...el, x, y } : el))
      );
      console.log(`Element ${elementId} moved to:`, x, y);
    },
    []
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

  const handleDeleteElement = useCallback(
    (elementToDelete: CustomElement | UMLRelationship) => {
      if ("className" in elementToDelete) {
        // Es un CustomElement - eliminar de elementos dinámicos
        setDynamicElements((prev) =>
          prev.filter((el) => el.id !== elementToDelete.id)
        );

        // Si el elemento tenía un paquete padre, removerlo de la lista de contenidos
        if (elementToDelete.parentPackageId) {
          setDynamicElements((prev) =>
            prev.map((el) =>
              el.id === elementToDelete.parentPackageId && el.containedElements
                ? {
                    ...el,
                    containedElements: el.containedElements.filter(
                      (id) => id !== elementToDelete.id
                    ),
                  }
                : el
            )
          );
        }
      } else {
        // Es un UMLRelationship - eliminar de relaciones dinámicas
        setDynamicLinks((prev) =>
          prev.filter((rel) => rel.id !== elementToDelete.id)
        );
      }
      // Deseleccionar el elemento eliminado
      setSelectedElement(null);
    },
    []
  );

  const handleAssignToPackage = useCallback(
    (elementId: string, packageId: string | null) => {
      setDynamicElements((prev) =>
        prev.map((el) => {
          if (el.id === elementId) {
            // Actualizar el parentPackageId del elemento
            const updatedElement = { ...el, parentPackageId: packageId || undefined };
            return updatedElement;
          } else if (el.elementType === "package") {
            // Si es un paquete, actualizar su lista de elementos contenidos
            if (packageId === el.id) {
              // Agregar el elemento a este paquete
              const containedElements = el.containedElements || [];
              if (!containedElements.includes(elementId)) {
                return {
                  ...el,
                  containedElements: [...containedElements, elementId],
                };
              }
            } else if (el.containedElements?.includes(elementId)) {
              // Remover el elemento de este paquete si estaba asignado a otro
              return {
                ...el,
                containedElements: el.containedElements.filter(
                  (id) => id !== elementId
                ),
              };
            }
          }
          return el;
        })
      );
    },
    []
  );

  const handleSelectRelationship = useCallback(
    (relationship: UMLRelationship) => {
      setSelectedElement(relationship);
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

  // Efecto para manejar la tecla Escape y cerrar el panel de propiedades
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && selectedElement) {
        handleDeselectElement();
      }
    };

    // Agregar el event listener cuando hay un elemento seleccionado
    if (selectedElement) {
      document.addEventListener("keydown", handleKeyDown);
    }

    // Cleanup: remover el event listener
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedElement, handleDeselectElement]); // Dependencia en selectedElement y handleDeselectElement

  // Combinar elementos iniciales con dinámicos
  const allElements = [...initialElements, ...dynamicElements];

  // Convertir relaciones dinámicas a links de JointJS con multiplicidad
  const convertedDynamicLinks = dynamicLinks.map(convertRelationshipToLink);

  // Usar links convertidos (initialLinks estaba vacío)
  const allLinks = convertedDynamicLinks;
  console.log(
    "All elements:",
    allElements.length,
    "dynamic:",
    dynamicElements.length
  );

  // Recrear el key del GraphProvider cuando cambien los elementos o relaciones dinámicas
  // Esto fuerza a React a recrear el grafo con los nuevos elementos/links
  const graphKey = `graph-${dynamicElements.length}-${
    dynamicLinks.length
  }-${dynamicLinks
    .map(
      (l) => l.id + (l.sourceMultiplicity || "") + (l.targetMultiplicity || "")
    )
    .join("-")}`;

  return (
    <div
      style={{
        padding: "20px",
        display: "flex",
        gap: "20px",
        alignItems: "flex-start",
      }}
    >
      <Toolbar onDragStart={handleDragStart} />

      <div style={{ flex: 1 }}>
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
                onUpdateElementPosition={handleUpdateElementPosition}
                onSelectRelationship={handleSelectRelationship}
                dynamicLinks={dynamicLinks}
              />
            </GraphProvider>
          </div>

          {selectedElement && (
            <PropertiesPanel
              selectedElement={selectedElement}
              onUpdateElement={handleUpdateElement}
              onUpdateRelationship={handleUpdateRelationship}
              onDeleteElement={handleDeleteElement}
              onAssignToPackage={handleAssignToPackage}
              allElements={[...initialElements, ...dynamicElements]}
              onClose={handleDeselectElement}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
