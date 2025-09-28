import React, { useCallback, useState, useEffect } from "react";
import { GraphProvider, createElements } from "@joint/react";
import { io, Socket } from "socket.io-client";
import "./App.css";

// Importar tipos
import type { CustomElement, UMLRelationship } from "./types";

// Importar constantes
import { classTemplates, validateElementPosition } from "./constants/templates";

// Importar utilidades
import { convertRelationshipToLink } from "./utils/relationshipUtils";

// Importar componentes
import { Toolbar } from "./components/Toolbar";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { UMLDiagram } from "./components/UMLDiagram";
import Header from "./components/Header";

// Importar hook de sincronización
import { useDiagramSync } from "./hooks/useDiagramSync";

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

  // Estado para información del usuario actual (se obtendría del servidor Socket.IO)
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);

  // Hook para sincronización del diagrama
  const { addElement, updateElementPosition, deleteElement, addRelationship, deleteRelationship } = useDiagramSync({
    currentUserId: currentUser?.id || 'anonymous',
    currentUserName: currentUser?.name || 'Usuario Anónimo',
    onRemoteOperation: useCallback((operation) => {
      console.log('🔄 Aplicando operación remota:', operation);

      switch (operation.type) {
        case 'add_element': {
          // Agregar elemento remoto al estado local
          const newElement = operation.data as CustomElement;
          setDynamicElements(prev => [...prev, newElement]);
          break;
        }

        case 'update_position': {
          // Actualizar posición de elemento remoto
          const positionData = operation.data as { x: number; y: number };
          setDynamicElements(prev =>
            prev.map(el =>
              el.id === operation.elementId
                ? { ...el, x: positionData.x, y: positionData.y }
                : el
            )
          );
          break;
        }

        case 'delete_element':
          // Eliminar elemento remoto
          setDynamicElements(prev => prev.filter(el => el.id !== operation.elementId));
          break;

        case 'add_relationship': {
          // Agregar relación remota
          const newRelationship = operation.data as UMLRelationship;
          setDynamicLinks(prev => [...prev, newRelationship]);
          break;
        }

        case 'delete_relationship':
          // Eliminar relación remota
          setDynamicLinks(prev => prev.filter(rel => rel.id !== operation.elementId));
          break;
      }
    }, []),
  });

  // Conectar con el servidor para obtener información del usuario
  useEffect(() => {
    const socket = io('http://localhost:3001');

    socket.on('welcome', (data: { userId: string; userName: string }) => {
      setCurrentUser({ id: data.userId, name: data.userName });
      console.log('👤 Usuario identificado:', data.userName);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

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
      y?: number,
      containerWidth?: number,
      containerHeight?: number
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
        // Posición específica del drop - validar límites
        const centeredX = x - 100; // Centrar horizontalmente
        const centeredY = y - 60; // Centrar verticalmente

        const validatedPosition = validateElementPosition(
          centeredX,
          centeredY,
          containerWidth,
          containerHeight
        );

        newX = validatedPosition.x;
        newY = validatedPosition.y;
      } else {
        // Posición automática - también validar límites
        const existingElements = [...initialElements, ...dynamicElements];
        const maxX = Math.max(...existingElements.map((el) => el.x || 0), 0);
        const maxY = Math.max(...existingElements.map((el) => el.y || 0), 0);

        newX = maxX + 250;
        newY = maxY > 200 ? 50 : maxY + 170;

        // Validar límites para posición automática
        const validatedPosition = validateElementPosition(
          newX,
          newY,
          containerWidth,
          containerHeight
        );

        newX = validatedPosition.x;
        newY = validatedPosition.y;

        // Si se sale por el lado derecho, empezar nueva fila
        if (containerWidth && newX + 200 + 20 > containerWidth) {
          newX = 20;
          newY = newY + 120 + 20;
        }

        // Si se sale por abajo, reiniciar desde arriba
        if (containerHeight && newY + 120 + 20 > containerHeight) {
          newY = 20;
        }
      }

      const newElement = {
        id: elementCounter.toString(),
        className: templateData.className,
        attributes: [...templateData.attributes],
        methods: [...templateData.methods],
        elementType: templateData.elementType,
        ...(templateData.elementType === "package" && {
          containedElements: [],
        }),
        x: newX,
        y: newY,
        width: 200,
        height: 120,
      };

      setDynamicElements((prev) => [...prev, newElement]);
      setElementCounter((prev) => prev + 1);

      // Enviar operación al servidor para sincronización
      addElement(newElement);

      console.log("Element added:", newElement);
    },
    [dynamicElements, elementCounter, addElement]
  );

  const handleUpdateElementPosition = useCallback(
    (elementId: string, x: number, y: number) => {
      // Actualizar la posición del elemento en dynamicElements
      setDynamicElements((prev) =>
        prev.map((el) => (el.id === elementId ? { ...el, x, y } : el))
      );

      // Enviar operación al servidor para sincronización
      updateElementPosition(elementId, x, y);

      console.log(`Element ${elementId} moved to:`, x, y);
    },
    [updateElementPosition]
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
            const updatedElement = {
              ...el,
              parentPackageId: packageId || undefined,
            };
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
  }-${dynamicElements
    .map(
      (el) =>
        el.id +
        el.className +
        el.attributes.join(",") +
        (el.methods || []).join(",") +
        (el.stereotype || "")
    )
    .join("-")}-${dynamicLinks
    .map(
      (l) => l.id + (l.sourceMultiplicity || "") + (l.targetMultiplicity || "")
    )
    .join("-")}`;

  return (
    <div className="app-container">
      <Header />

      <div
        style={{
          height: "calc(100vh - 70px)",
          display: "flex",
          gap: "10px",
          alignItems: "stretch",
          padding: "5px",
          boxSizing: "border-box",
          marginTop: "70px",
        }}
      >
        <Toolbar onDragStart={handleDragStart} />

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          {relationshipMode && (
            <div
              style={{
                backgroundColor: "#FFF3CD",
                border: "1px solid #FFEAA7",
                borderRadius: "4px",
                padding: "8px 12px",
                marginBottom: "5px",
                color: "#856404",
                fontSize: "14px",
                flexShrink: 0,
              }}
            >
              <strong>Modo Relación:</strong> Creando {relationshipMode}.
              {firstSelectedElement
                ? ` Origen: "${firstSelectedElement.className}". Selecciona destino.`
                : " Selecciona el primer elemento."}
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
                  fontSize: "12px",
                }}
              >
                ✕
              </button>
            </div>
          )}

          <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
            <div style={{ flex: 1, position: "relative" }}>
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
    </div>
  );
}

export default App;
