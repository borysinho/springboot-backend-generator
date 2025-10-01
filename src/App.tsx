import React, { useCallback, useState, useEffect, useMemo } from "react";
import { GraphProvider, createElements } from "@joint/react";
import { useSearchParams, useParams } from "react-router-dom";
import "./App.css";

// Importar tipos
import type { CustomElement, UMLRelationship } from "./types";
import type { DiagramData } from "./components/AIBot";

// Importar constantes
import { classTemplates, validateElementPosition } from "./constants/templates";

// Importar utilidades
import {
  calculateElementWidth,
  calculateElementHeight,
} from "./utils/elementSizing";
import { convertRelationshipToLink } from "./utils/relationshipUtils";
import { truncateText } from "./utils/textUtils";

// Importar hooks
import { useDiagramSync } from "./hooks/useDiagramSync";
import { useSocket } from "./hooks/useSocket";
import { useNotifications } from "./hooks/useNotifications";

// Importar componentes
import { Toolbar } from "./components/Toolbar";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { UMLDiagram } from "./components/UMLDiagram";
import { AIBot } from "./components/AIBot";
import DatabaseConfigModal, {
  type DatabaseConfig,
} from "./components/DatabaseConfigModal";
import Header from "./components/Header";
import NotificationSystem from "./components/NotificationSystem";

const initialElements = createElements([
  // Diagrama vacío - sin elementos de ejemplo
]);

// Componente principal del diagrama UML
function App() {
  const [searchParams] = useSearchParams();
  const { id: urlDiagramId } = useParams<{ id: string }>();
  const [diagramName, setDiagramName] = useState<string>("");
  const [currentDiagramId, setCurrentDiagramId] = useState<string | null>(null);
  const [dynamicElements, setDynamicElements] = useState<CustomElement[]>([]);
  const [elementCounter, setElementCounter] = useState(5);
  const [graphSessionId] = useState(1);
  const [isAIBotVisible, setIsAIBotVisible] = useState(false);
  const [isDatabaseConfigModalOpen, setIsDatabaseConfigModalOpen] =
    useState(false);

  // Cargar diagrama desde BD o inicializar nuevo
  useEffect(() => {
    const loadDiagram = async () => {
      const userStr = localStorage.getItem("user");

      if (!userStr) {
        window.location.href = "/login";
        return;
      }

      const user = JSON.parse(userStr);

      if (urlDiagramId) {
        // Cargar diagrama existente por ID
        try {
          console.log("Cargando diagrama:", urlDiagramId);
          const response = await fetch(`/api/diagrams/${urlDiagramId}`);

          if (response.ok) {
            const diagram = await response.json();
            console.log("Diagrama cargado:", diagram);

            setDiagramName(diagram.name);
            setCurrentDiagramId(urlDiagramId);

            // Cargar elementos y relaciones desde el state
            const state = diagram.state || { elements: {}, relationships: {} };
            const elements = Object.values(state.elements || {}) as any[];

            // Convertir elementos a formato del frontend
            const loadedElements = elements.map((el: any) => ({
              id: el.id,
              className: el.className,
              attributes: el.attributes,
              methods: el.methods,
              elementType: el.elementType,
              stereotype: el.stereotype,
              parentPackageId: el.parentPackageId,
              containedElements: el.containedElements,
              x: el.x || 0,
              y: el.y || 0,
              width: el.width || 200,
              height: el.height || 120,
            }));

            // Convertir relaciones a formato del frontend
            const relationships = Object.values(
              state.relationships || {}
            ) as any[];
            const loadedRelationships = relationships.map((rel: any) => ({
              id: rel.id,
              source: rel.source,
              target: rel.target,
              relationship: rel.relationship,
              label: rel.label,
              sourceMultiplicity: rel.sourceMultiplicity,
              targetMultiplicity: rel.targetMultiplicity,
              sourceRole: rel.sourceRole,
              targetRole: rel.targetRole,
            }));

            setDynamicElements(loadedElements);
            setDynamicLinks(loadedRelationships);

            // Actualizar el contador de elementos para evitar conflictos de IDs
            const maxElementId = Math.max(
              ...loadedElements.map((el) => {
                const numId = parseInt(el.id);
                return isNaN(numId) ? 0 : numId;
              }),
              4 // Mínimo 5 (contador inicia en 5)
            );
            setElementCounter(maxElementId + 1);

            console.log("Elementos cargados:", loadedElements.length);
            console.log("Relaciones cargadas:", loadedRelationships.length);
            console.log(
              "Contador de elementos actualizado a:",
              maxElementId + 1
            );

            // Inicializar el historial con el estado cargado
            setTimeout(() => {}, 100);
          } else if (response.status === 404) {
            alert("Diagrama no encontrado");
            window.location.href = "/";
            return;
          } else {
            throw new Error("Error cargando diagrama");
          }
        } catch (error) {
          console.error("Error loading diagram:", error);
          alert("Error al cargar el diagrama");
          window.location.href = "/";
          return;
        }
      } else {
        // Flujo anterior para diagramas sin ID (por compatibilidad)
        const nameParam = searchParams.get("name");

        if (nameParam) {
          // Verificar si el nombre ya existe
          try {
            const response = await fetch(
              `/api/diagrams/check-name?name=${encodeURIComponent(
                nameParam
              )}&creatorId=${encodeURIComponent(user.id)}`
            );

            if (response.ok) {
              const { exists } = await response.json();
              if (exists) {
                alert(
                  `Ya tienes un diagrama con el nombre "${nameParam}". Por favor elige un nombre diferente.`
                );
                window.location.href = "/";
                return;
              }
            }
          } catch (error) {
            console.error("Error checking diagram name:", error);
          }

          setDiagramName(nameParam);
          // Generar diagramId para nuevos diagramas
          const newDiagramId = `diagram-${Date.now()}-${user.id}`;
          setCurrentDiagramId(newDiagramId);
        } else {
          // Pedir nombre y crear nuevo diagrama
          let name = prompt("Ingresa el nombre del diagrama:");
          let isValidName = false;

          while (!isValidName && name !== null) {
            if (!name || name.trim() === "") {
              alert("El nombre del diagrama es obligatorio");
              name = prompt("Ingresa el nombre del diagrama:");
              continue;
            }

            name = name.trim();

            try {
              const response = await fetch(
                `/api/diagrams/check-name?name=${encodeURIComponent(
                  name
                )}&creatorId=${encodeURIComponent(user.id)}`
              );

              if (response.ok) {
                const { exists } = await response.json();
                if (exists) {
                  alert(
                    `Ya tienes un diagrama con el nombre "${name}". Por favor elige un nombre diferente.`
                  );
                  name = prompt("Ingresa el nombre del diagrama:");
                  continue;
                }
              }
            } catch (error) {
              console.error("Error checking diagram name:", error);
              alert("Error al verificar el nombre del diagrama");
              name = prompt("Ingresa el nombre del diagrama:");
              continue;
            }

            isValidName = true;
          }

          if (name && name.trim()) {
            setDiagramName(name.trim());
            const newDiagramId = `diagram-${Date.now()}-${user.id}`;
            setCurrentDiagramId(newDiagramId);
          } else {
            window.location.href = "/";
            return;
          }
        }
      }
    };

    loadDiagram();
  }, [urlDiagramId, searchParams]);

  // Configurar conexión Socket.IO usando el hook
  const { socket, isConnected } = useSocket();

  // Configurar sistema de notificaciones
  const { notifications, addNotification, removeNotification } =
    useNotifications();

  // Actualizar graphSessionId solo cuando cambie el diagrama actual
  useEffect(() => {
    if (isConnected && currentDiagramId) {
      console.log("📡 Conectado al servidor para colaboración en tiempo real");

      // Unirse al diagrama actual
      if (socket) {
        socket.emit("diagram:join", currentDiagramId);
        console.log(`Unido al diagrama: ${currentDiagramId}`);
      }
      // No incrementar graphSessionId aquí para evitar recrear el grafo
    }
  }, [isConnected, socket, currentDiagramId]);

  const [selectedElement, setSelectedElement] = useState<
    CustomElement | UMLRelationship | null
  >(null);

  // Estados para manejar relaciones UML
  const [relationshipMode, setRelationshipMode] = useState<string | null>(null);
  const [firstSelectedElement, setFirstSelectedElement] =
    useState<CustomElement | null>(null);
  const [dynamicLinks, setDynamicLinks] = useState<UMLRelationship[]>([]);

  // Hook para sincronización y tracking de operaciones
  const {
    operations,
    trackElementAddWithCallbacks,
    trackElementRemove,
    trackElementUpdate,
    trackRelationshipAdd,
    trackRelationshipRemove,
    trackRelationshipUpdate,
    handleUndo,
    handleRedo,
  } = useDiagramSync(
    socket || undefined,
    diagramName || "temp-diagram",
    addNotification
  );

  // Función para guardar el diagrama
  const handleSaveDiagram = useCallback(async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        addNotification(
          "error",
          "Error de Autenticación",
          "No se encontró información del usuario. Por favor, inicia sesión nuevamente.",
          false
        );
        return;
      }

      const user = JSON.parse(userStr);

      if (!diagramName) {
        addNotification(
          "error",
          "Nombre del Diagrama Requerido",
          "El diagrama debe tener un nombre para poder guardarse.",
          false
        );
        return;
      }

      // Construir el estado del diagrama
      const diagramState = {
        elements: {} as Record<string, CustomElement>,
        relationships: {} as Record<string, UMLRelationship>,
        version: 1,
        lastModified: Date.now(),
      };

      // Agregar elementos al estado
      [...initialElements, ...dynamicElements].forEach((element) => {
        diagramState.elements[element.id] = {
          id: element.id,
          className: element.className,
          attributes: element.attributes || [],
          methods: element.methods || [],
          elementType: element.elementType,
          stereotype: element.stereotype,
          parentPackageId: element.parentPackageId,
          containedElements: element.containedElements || [],
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
        };
      });

      // Agregar relaciones al estado
      dynamicLinks.forEach((relationship) => {
        diagramState.relationships[relationship.id] = {
          id: relationship.id,
          source: relationship.source,
          target: relationship.target,
          relationship: relationship.relationship,
          label: relationship.label,
          sourceMultiplicity: relationship.sourceMultiplicity,
          targetMultiplicity: relationship.targetMultiplicity,
          sourceRole: relationship.sourceRole,
          targetRole: relationship.targetRole,
        };
      });

      // Preparar los datos para enviar
      const isUpdate = !!currentDiagramId;
      const diagramData = {
        ...(isUpdate
          ? {}
          : {
              diagramId: currentDiagramId || `diagram-${Date.now()}-${user.id}`,
            }),
        name: diagramName,
        description: `Diagrama UML creado por ${user.name || user.email}`,
        creatorId: user.id,
        collaborators: [],
        state: diagramState,
        isPublic: false,
        tags: [],
      };

      console.log(
        `${isUpdate ? "Actualizando" : "Guardando"} diagrama:`,
        diagramData
      );

      // Enviar a la API
      const url = isUpdate
        ? `/api/diagrams/${currentDiagramId}`
        : "/api/diagrams";
      const method = isUpdate ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(diagramData),
      });

      if (response.ok) {
        const savedDiagram = await response.json();
        console.log("Diagrama guardado exitosamente:", savedDiagram);

        // Si es creación, actualizar el currentDiagramId
        if (!isUpdate) {
          setCurrentDiagramId(savedDiagram.diagramId);
        }

        addNotification(
          "success",
          "Diagrama Guardado",
          `El diagrama "${diagramName}" se ha guardado exitosamente.`,
          true,
          3000
        );
      } else {
        const errorText = await response.text();
        console.error("Error al guardar diagrama:", response.status, errorText);

        addNotification(
          "error",
          "Error al Guardar",
          `No se pudo guardar el diagrama. Error: ${errorText}`,
          false
        );
      }
    } catch (error) {
      console.error("Error inesperado al guardar diagrama:", error);

      addNotification(
        "error",
        "Error Inesperado",
        "Ocurrió un error inesperado al guardar el diagrama. Por favor, inténtalo de nuevo.",
        false
      );
    }
  }, [
    diagramName,
    dynamicElements,
    dynamicLinks,
    addNotification,
    currentDiagramId,
  ]);

  // Función para imprimir
  const handlePrint = useCallback(() => {
    try {
      window.print();
      addNotification(
        "success",
        "Impresión Iniciada",
        "Se ha abierto el diálogo de impresión.",
        true,
        3000
      );
    } catch (error) {
      console.error("Error al imprimir:", error);
      addNotification(
        "error",
        "Error de Impresión",
        "No se pudo iniciar la impresión. Por favor, inténtalo de nuevo.",
        false
      );
    }
  }, [addNotification]);

  // Función para exportar
  const handleExport = useCallback(async () => {
    try {
      // Mostrar diálogo de selección
      const exportType = window.prompt(
        "Seleccione el formato de exportación:\n\n1. JSON (datos del diagrama)\n2. SVG (imagen vectorial)\n\nIngrese 1 o 2:",
        "1"
      );

      if (!exportType || !["1", "2"].includes(exportType.trim())) {
        addNotification(
          "warning",
          "Exportación Cancelada",
          "Selección inválida. La exportación ha sido cancelada.",
          true,
          3000
        );
        return;
      }

      const isJSON = exportType.trim() === "1";
      const diagramIdToExport = currentDiagramId || urlDiagramId;

      if (!diagramIdToExport) {
        addNotification(
          "error",
          "Error de Exportación",
          "No se pudo identificar el diagrama actual.",
          false
        );
        return;
      }

      // Llamar al endpoint correspondiente
      const endpoint = isJSON
        ? `/api/diagrams/${diagramIdToExport}/export/json`
        : `/api/diagrams/${diagramIdToExport}/export/svg`;

      const response = await fetch(endpoint);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      // Crear blob y descargar
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const fileName = isJSON
        ? `${diagramName || "diagrama"}_${
            new Date().toISOString().split("T")[0]
          }.json`
        : `${diagramName || "diagrama"}_${
            new Date().toISOString().split("T")[0]
          }.svg`;

      const linkElement = document.createElement("a");
      linkElement.href = url;
      linkElement.download = fileName;
      document.body.appendChild(linkElement);
      linkElement.click();
      document.body.removeChild(linkElement);

      // Limpiar URL del objeto
      window.URL.revokeObjectURL(url);

      addNotification(
        "success",
        "Exportación Completada",
        `El diagrama se ha exportado como "${fileName}".`,
        true,
        3000
      );
    } catch (error) {
      console.error("Error al exportar:", error);
      addNotification(
        "error",
        "Error de Exportación",
        "No se pudo exportar el diagrama. Por favor, inténtalo de nuevo.",
        false
      );
    }
  }, [diagramName, currentDiagramId, urlDiagramId, addNotification]);

  // Función para generar backend
  const handleGenerateBackend = useCallback(() => {
    setIsDatabaseConfigModalOpen(true);
  }, []);

  // Función para confirmar generación de backend con configuración de BD
  const handleConfirmBackendGeneration = useCallback(
    async (dbConfig: DatabaseConfig) => {
      try {
        setIsDatabaseConfigModalOpen(false);

        addNotification(
          "info",
          "Generando Backend",
          "Iniciando transformación del diagrama a modelo físico...",
          true,
          2000
        );

        // Construir el estado del diagrama
        const diagramState = {
          elements: {} as Record<string, CustomElement>,
          relationships: {} as Record<string, UMLRelationship>,
          version: 1,
          lastModified: Date.now(),
        };

        // Agregar elementos al estado
        [...initialElements, ...dynamicElements].forEach((element) => {
          diagramState.elements[element.id] = {
            id: element.id,
            className: element.className,
            attributes: element.attributes || [],
            methods: element.methods || [],
            elementType: element.elementType,
            stereotype: element.stereotype,
            parentPackageId: element.parentPackageId,
            containedElements: element.containedElements || [],
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
          };
        });

        // Agregar relaciones al estado
        dynamicLinks.forEach((relationship) => {
          diagramState.relationships[relationship.id] = {
            id: relationship.id,
            source: relationship.source,
            target: relationship.target,
            relationship: relationship.relationship,
            label: relationship.label,
            sourceMultiplicity: relationship.sourceMultiplicity,
            targetMultiplicity: relationship.targetMultiplicity,
            sourceRole: relationship.sourceRole,
            targetRole: relationship.targetRole,
          };
        });

        // Enviar el diagrama al servidor para transformación y generación
        const response = await fetch("/api/diagrams/generate-backend", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            diagramState,
            diagramName: diagramName || "generated-backend",
            databaseConfig: dbConfig,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Error del servidor: ${response.status}`
          );
        }

        // El servidor devuelve un archivo ZIP directamente
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const linkElement = document.createElement("a");
        linkElement.href = url;
        linkElement.download = `${diagramName || "backend"}.zip`;
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
        window.URL.revokeObjectURL(url);

        addNotification(
          "success",
          "Backend Generado",
          `El backend Spring Boot "${
            diagramName || "backend"
          }.zip" se ha descargado exitosamente.`,
          true,
          5000
        );
      } catch (error) {
        console.error("Error al generar backend:", error);
        addNotification(
          "error",
          "Error en Generación",
          `No se pudo generar el backend: ${
            error instanceof Error ? error.message : "Error desconocido"
          }`,
          false
        );
      }
    },
    [diagramName, dynamicElements, dynamicLinks, addNotification]
  );

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

      // Solicitar nombre para elementos estructurales
      const structuralTypes = ["class", "interface", "enumeration", "package"];
      let elementName = templateData.className;
      if (structuralTypes.includes(template)) {
        const name = prompt("Ingresa el nombre del elemento:");
        if (name === null) return; // Usuario canceló
        const trimmedName = name.trim();
        if (trimmedName === "") {
          alert("El nombre no puede estar vacío.");
          return;
        }
        elementName = trimmedName;
      }

      // Usar posición proporcionada o calcular automáticamente
      let newX: number, newY: number;

      if (x !== undefined && y !== undefined) {
        // Posición específica del drop - validar límites
        const centeredX = x - 100; // Centrar horizontalmente
        const centeredY = y - 60; // Centrar verticalmente

        console.log("Posición original del drop:", x, y);
        console.log("Posición centrada:", centeredX, centeredY);

        const elementWidth = calculateElementWidth({
          className: elementName,
          attributes: templateData.attributes,
          methods: templateData.methods,
          elementType: templateData.elementType,
        });
        const elementHeight = calculateElementHeight({
          className: elementName,
          attributes: templateData.attributes,
          methods: templateData.methods,
          elementType: templateData.elementType,
        });

        const validatedPosition = validateElementPosition(
          centeredX,
          centeredY,
          containerWidth,
          containerHeight,
          elementWidth,
          elementHeight
        );

        console.log("Posición validada:", validatedPosition);

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
        const elementWidth = calculateElementWidth({
          className: elementName,
          attributes: templateData.attributes,
          methods: templateData.methods,
          elementType: templateData.elementType,
        });
        const elementHeight = calculateElementHeight({
          className: elementName,
          attributes: templateData.attributes,
          methods: templateData.methods,
          elementType: templateData.elementType,
        });

        const validatedPosition = validateElementPosition(
          newX,
          newY,
          containerWidth,
          containerHeight,
          elementWidth,
          elementHeight
        );

        newX = validatedPosition.x;
        newY = validatedPosition.y;

        // Si se sale por el lado derecho, empezar nueva fila
        if (containerWidth && newX + elementWidth + 20 > containerWidth) {
          newX = 20;
          newY = newY + elementHeight + 20;
        }

        // Si se sale por abajo, reiniciar desde arriba
        if (containerHeight && newY + elementHeight + 20 > containerHeight) {
          newY = 20;
        }
      }

      const newElement = {
        id: elementCounter.toString(),
        className: elementName,
        attributes: [...templateData.attributes],
        methods: [...templateData.methods],
        elementType: templateData.elementType,
        ...(templateData.elementType === "package" && {
          containedElements: [],
        }),
        x: newX,
        y: newY,
        width: calculateElementWidth({
          className: elementName,
          attributes: templateData.attributes,
          methods: templateData.methods,
          elementType: templateData.elementType,
        }),
        height: calculateElementHeight({
          className: elementName,
          attributes: templateData.attributes,
          methods: templateData.methods,
          elementType: templateData.elementType,
        }),
      };

      console.log(
        "Creando elemento con ID:",
        newElement.id,
        "Contador actual:",
        elementCounter
      );

      // Incrementar contador inmediatamente para evitar conflictos de IDs
      setElementCounter((prev) => {
        const newCounter = prev + 1;
        console.log("Incrementando contador de", prev, "a", newCounter);
        return newCounter;
      });

      // Agregar elemento inmediatamente al estado local para visualización inmediata
      setDynamicElements((prev) => [...prev, newElement]);

      // Mostrar notificación de éxito inmediata
      addNotification(
        "success",
        "Elemento Agregado",
        `"${newElement.className}" (${newElement.elementType}) se agregó correctamente al diagrama.`,
        true, // Auto-close después de 3 segundos
        3000
      );

      // Enviar operación con callbacks para sincronización
      trackElementAddWithCallbacks(
        newElement,
        // Callback de confirmación - operación exitosa, no hacer nada adicional
        () => {
          console.log(
            "✅ Operación confirmada para elemento:",
            newElement.className,
            "ID:",
            newElement.id
          );
        },
        // Callback de rechazo - remover elemento del estado local
        (_, reason) => {
          console.log(
            "❌ Operación rechazada, removiendo elemento:",
            newElement.className,
            "razón:",
            reason
          );

          // Remover elemento del estado local
          setDynamicElements((prev) =>
            prev.filter((el) => el.id !== newElement.id)
          );

          // Agregar notificación específica para elemento no agregado
          addNotification(
            "error",
            "Elemento No Agregado",
            `No se pudo agregar "${newElement.className}" (${newElement.elementType}). ${reason}`,
            false // No auto-close para errores importantes
          );
        }
      );

      console.log("Element operation sent:", newElement);
    },
    [
      dynamicElements,
      elementCounter,
      trackElementAddWithCallbacks,
      addNotification,
    ]
  );

  // Funciones para el bot de IA
  const handleAICreateClass = useCallback(
    (classData: {
      className: string;
      attributes: string[];
      methods: string[];
      stereotype?: string;
    }) => {
      // Crear una clase usando los datos de la IA
      const newElement: CustomElement = {
        id: elementCounter.toString(),
        className: classData.className,
        attributes: classData.attributes || [],
        methods: classData.methods || [],
        elementType: "class",
        stereotype: classData.stereotype,
        x: Math.random() * 400 + 50,
        y: Math.random() * 300 + 50,
        width: 200,
        height: 120,
      };

      setElementCounter((prev) => prev + 1);
      setDynamicElements((prev) => [...prev, newElement]);

      addNotification(
        "success",
        "Clase Creada por IA",
        `La clase "${classData.className}" se creó exitosamente.`,
        true,
        3000
      );
    },
    [elementCounter, addNotification]
  );

  const handleAICreateRelationship = useCallback(
    (relationshipData: {
      relationshipType: string;
      sourceClass: string;
      targetClass: string;
      multiplicity: { source: string; target: string };
      description: string;
    }) => {
      // Buscar los elementos por nombre
      const sourceElement = dynamicElements.find(
        (el) => el.className === relationshipData.sourceClass
      );
      const targetElement = dynamicElements.find(
        (el) => el.className === relationshipData.targetClass
      );

      if (!sourceElement || !targetElement) {
        addNotification(
          "error",
          "Error en Relación IA",
          "No se encontraron las clases especificadas en el diagrama.",
          false
        );
        return;
      }

      // Crear la relación
      const newLink: UMLRelationship = {
        id: `link_${Date.now()}`,
        source: sourceElement.id,
        target: targetElement.id,
        relationship:
          relationshipData.relationshipType as UMLRelationship["relationship"],
        sourceMultiplicity: relationshipData.multiplicity?.source || "1",
        targetMultiplicity: relationshipData.multiplicity?.target || "1",
        label: truncateText(relationshipData.description || "", 10),
      };

      // Agregar el link (necesitas implementar esta lógica)
      console.log("Relación IA creada:", newLink);

      addNotification(
        "success",
        "Relación Creada por IA",
        `Relación ${relationshipData.relationshipType} entre ${relationshipData.sourceClass} y ${relationshipData.targetClass} creada.`,
        true,
        3000
      );
    },
    [dynamicElements, addNotification]
  );

  const handleAIGenerateDiagram = useCallback(
    (diagramData: DiagramData) => {
      // Crear múltiples clases y relaciones
      let newCounter = elementCounter;
      const newElements: CustomElement[] = [];
      const newRelationships: UMLRelationship[] = [];

      // Crear clases
      diagramData.classes?.forEach((classData, index) => {
        const newElement: CustomElement = {
          id: newCounter.toString(),
          className: classData.className,
          attributes: classData.attributes || [],
          methods: classData.methods || [],
          elementType: "class",
          stereotype: classData.stereotype,
          x: (index % 3) * 250 + 50,
          y: Math.floor(index / 3) * 200 + 50,
          width: calculateElementWidth({
            className: classData.className,
            attributes: classData.attributes || [],
            methods: classData.methods || [],
            elementType: "class",
            stereotype: classData.stereotype,
          }),
          height: calculateElementHeight({
            className: classData.className,
            attributes: classData.attributes || [],
            methods: classData.methods || [],
            elementType: "class",
            stereotype: classData.stereotype,
          }),
        };
        newElements.push(newElement);
        newCounter++;
      });

      // Crear mapa de nombres de clases a IDs para las relaciones
      const classNameToIdMap = new Map<string, string>();
      newElements.forEach((element) => {
        classNameToIdMap.set(element.className, element.id);
      });

      // Crear relaciones
      diagramData.relationships?.forEach((relationshipData) => {
        const sourceId = classNameToIdMap.get(relationshipData.sourceClass);
        const targetId = classNameToIdMap.get(relationshipData.targetClass);

        if (sourceId && targetId) {
          const newRelationship: UMLRelationship = {
            id: `ai-link-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            source: sourceId,
            target: targetId,
            relationship:
              relationshipData.relationshipType as UMLRelationship["relationship"],
            label: truncateText(
              relationshipData.description || relationshipData.relationshipType,
              10
            ),
            sourceMultiplicity: relationshipData.multiplicity?.source,
            targetMultiplicity: relationshipData.multiplicity?.target,
          };
          newRelationships.push(newRelationship);
        }
      });

      setElementCounter(newCounter);
      setDynamicElements((prev) => [...prev, ...newElements]);
      setDynamicLinks((prev) => [...prev, ...newRelationships]);

      addNotification(
        "success",
        "Diagrama Generado por IA",
        `Se crearon ${diagramData.classes?.length || 0} clases y ${
          diagramData.relationships?.length || 0
        } relaciones exitosamente.`,
        true,
        3000
      );
    },
    [elementCounter, addNotification]
  );

  const handleSelectElement = useCallback(
    (element: CustomElement | UMLRelationship | null) => {
      if (element) {
        if (relationshipMode) {
          // Si estamos en modo relación y se hace click en un elemento, manejar la lógica de relación
          if ("className" in element) {
            // Es un CustomElement
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
                relationship:
                  relationshipMode as UMLRelationship["relationship"],
                label: truncateText(relationshipMode, 10),
              };

              setDynamicLinks((prev) => [...prev, newRelationship]);

              // El grafo se recrea automáticamente cuando cambian las dynamicLinks

              // Trackear la creación de la relación
              trackRelationshipAdd(newRelationship);

              console.log("Relationship created:", newRelationship);

              // Resetear modo de relación
              setRelationshipMode(null);
              setFirstSelectedElement(null);
            }
          }
        } else {
          // Modo normal - seleccionar elemento o relación para edición
          setSelectedElement(element);
        }
      } else {
        // Deseleccionar elemento
        setSelectedElement(null);
      }
    },
    [relationshipMode, firstSelectedElement, trackRelationshipAdd]
  );

  const handleUpdateElement = useCallback(
    (updatedElement: CustomElement) => {
      // Encontrar el elemento original para comparar cambios
      const originalElement = dynamicElements.find(
        (el) => el.id === updatedElement.id
      );

      // Actualizar en elementos dinámicos
      setDynamicElements((prev) =>
        prev.map((el) => (el.id === updatedElement.id ? updatedElement : el))
      );
      // Actualizar elemento seleccionado
      setSelectedElement(updatedElement);

      // Trackear la operación si hay cambios
      if (originalElement) {
        const changes: Partial<CustomElement> = {};
        if (originalElement.className !== updatedElement.className)
          changes.className = updatedElement.className;
        if (
          JSON.stringify(originalElement.attributes) !==
          JSON.stringify(updatedElement.attributes)
        )
          changes.attributes = updatedElement.attributes;
        if (
          JSON.stringify(originalElement.methods) !==
          JSON.stringify(updatedElement.methods)
        )
          changes.methods = updatedElement.methods;
        if (
          originalElement.x !== updatedElement.x ||
          originalElement.y !== updatedElement.y
        ) {
          changes.x = updatedElement.x;
          changes.y = updatedElement.y;
        }
        if (originalElement.stereotype !== updatedElement.stereotype)
          changes.stereotype = updatedElement.stereotype;
        if (originalElement.parentPackageId !== updatedElement.parentPackageId)
          changes.parentPackageId = updatedElement.parentPackageId;
        if (
          JSON.stringify(originalElement.containedElements || []) !==
          JSON.stringify(updatedElement.containedElements || [])
        )
          changes.containedElements = updatedElement.containedElements;
        if (originalElement.width !== updatedElement.width)
          changes.width = updatedElement.width;
        if (originalElement.height !== updatedElement.height)
          changes.height = updatedElement.height;

        if (Object.keys(changes).length > 0) {
          trackElementUpdate(
            updatedElement.id,
            originalElement.className || "Elemento",
            changes
          );
        }
      }

      // El grafo se recrea automáticamente cuando cambian los dynamicElements
    },
    [dynamicElements, trackElementUpdate]
  );

  const handleUpdateRelationship = useCallback(
    (updatedRelationship: UMLRelationship) => {
      // Encontrar la relación original para comparar cambios
      const originalRelationship = dynamicLinks.find(
        (rel) => rel.id === updatedRelationship.id
      );

      // Actualizar en relaciones dinámicas
      setDynamicLinks((prev) =>
        prev.map((rel) =>
          rel.id === updatedRelationship.id ? updatedRelationship : rel
        )
      );
      // Actualizar relación seleccionada
      setSelectedElement(updatedRelationship);

      // Trackear la operación si hay cambios
      if (originalRelationship) {
        const changes: Partial<UMLRelationship> = {};
        if (
          originalRelationship.relationship !== updatedRelationship.relationship
        ) {
          changes.relationship = updatedRelationship.relationship;
        }

        if (Object.keys(changes).length > 0) {
          trackRelationshipUpdate(updatedRelationship.id, changes);
        }
      }

      // No forzar recreación del grafo para relaciones - actualizar directamente
      // setUpdateCounter((prev) => prev + 1);
    },
    [dynamicLinks, trackRelationshipUpdate]
  );

  const handleDeleteElement = useCallback(
    (elementToDelete: CustomElement | UMLRelationship) => {
      if ("className" in elementToDelete) {
        // Es un CustomElement - eliminar de elementos dinámicos
        setDynamicElements((prev) =>
          prev.filter((el) => el.id !== elementToDelete.id)
        );

        // Trackear la eliminación del elemento
        trackElementRemove(
          elementToDelete.id,
          elementToDelete.className || "Elemento"
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

        // Trackear la eliminación de la relación
        trackRelationshipRemove(elementToDelete.id);
      }
      // Deseleccionar el elemento eliminado
      setSelectedElement(null);
    },
    [trackElementRemove, trackRelationshipRemove]
  );

  const handleAssignToPackage = useCallback(
    (elementId: string, packageId: string | null) => {
      // Encontrar el elemento original antes del cambio
      const originalElement = dynamicElements.find((el) => el.id === elementId);

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

      // Trackear el cambio de paquete del elemento
      if (originalElement) {
        const newPackageId = packageId || undefined;
        if (originalElement.parentPackageId !== newPackageId) {
          trackElementUpdate(
            elementId,
            originalElement.className || "Elemento",
            { parentPackageId: newPackageId }
          );
        }
      }
    },
    [dynamicElements, trackElementUpdate]
  );

  const handleElementMove = useCallback(
    (elementId: string, x: number, y: number) => {
      console.log("Actualizando posición del elemento:", elementId, x, y);

      // Actualizar la posición en dynamicElements
      setDynamicElements((prev) =>
        prev.map((el) => (el.id === elementId ? { ...el, x, y } : el))
      );
    },
    []
  );

  // Efecto para manejar la tecla Escape y cerrar el panel de propiedades
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && selectedElement) {
        handleSelectElement(null);
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
  }, [selectedElement, handleSelectElement]); // Dependencias necesarias

  // Combinar elementos iniciales con dinámicos
  const allElements = useMemo(
    () => [...initialElements, ...dynamicElements],
    [dynamicElements]
  );

  // Debug: Log cuando cambie dynamicElements
  useEffect(() => {
    console.log(
      "🔄 dynamicElements cambió:",
      dynamicElements.length,
      dynamicElements.map((el) => ({ id: el.id, name: el.className }))
    );
  }, [dynamicElements]);

  // Crear elementos JointJS vacíos para que JointJS sepa de su existencia (solo para conexiones)
  const jointElements = useMemo(
    () =>
      allElements.map((element: CustomElement) => ({
        id: element.id,
        type: "standard.Rectangle",
        position: { x: element.x, y: element.y },
        size: { width: element.width, height: element.height },
        attrs: {
          body: { fill: "transparent", stroke: "transparent", strokeWidth: 0 },
          label: { text: "" },
        },
      })),
    [allElements]
  );

  // Crear mapa de elementos por ID para acceso rápido
  const elementMap = useMemo(() => {
    const map = new Map<string, CustomElement>();
    allElements.forEach((element) => {
      map.set(element.id, element);
    });
    console.log("📋 elementMap actualizado:", map.size, "elementos");
    return map;
  }, [allElements]);

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

  // Recrear el key del GraphProvider solo cuando cambie la sesión
  // Los elementos se sincronizan dinámicamente sin recrear el grafo
  const graphKey = `graph-session-${graphSessionId}`;

  return (
    <div className="app-container">
      <Header
        title={
          diagramName ? `Diagrama: ${diagramName}` : "Diagrama UML Colaborativo"
        }
        operations={operations}
        socket={socket || undefined}
        onSave={handleSaveDiagram}
        diagramName={diagramName}
      />

      {/* Sistema de notificaciones */}
      <NotificationSystem
        notifications={notifications}
        onRemove={removeNotification}
      />

      {/* Overlay de instrucciones para modo relación */}
      {relationshipMode && (
        <div className="relationship-overlay">
          <strong>Modo Relación:</strong> Creando {relationshipMode}.
          {firstSelectedElement
            ? ` Origen: "${firstSelectedElement.className}". Haz click en el elemento destino.`
            : " Haz click en el elemento origen."}
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

      <div className="app-content">
        <Toolbar
          onDragStart={handleDragStart}
          onClick={handleAddElement}
          onAIBotClick={() => setIsAIBotVisible(true)}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onPrint={handlePrint}
          onExport={handleExport}
          onGenerateBackend={handleGenerateBackend}
        />

        <div className="diagram-container">
          <GraphProvider
            key={graphKey}
            initialElements={jointElements}
            initialLinks={allLinks as any}
          >
            <UMLDiagram
              onAddElement={handleAddElement}
              onSelectElement={handleSelectElement}
              onElementMove={handleElementMove}
              elementMap={elementMap}
              relationships={dynamicLinks}
            />
          </GraphProvider>
        </div>

        {selectedElement && (
          <div className="properties-container">
            <PropertiesPanel
              selectedElement={selectedElement}
              onUpdateElement={handleUpdateElement}
              onUpdateRelationship={handleUpdateRelationship}
              onDeleteElement={handleDeleteElement}
              onAssignToPackage={handleAssignToPackage}
              allElements={[...initialElements, ...dynamicElements]}
              onClose={() => handleSelectElement(null)}
            />
          </div>
        )}
      </div>

      {/* Bot de IA */}
      <AIBot
        onCreateClass={handleAICreateClass}
        onCreateRelationship={handleAICreateRelationship}
        onGenerateDiagram={handleAIGenerateDiagram}
        existingClasses={dynamicElements.map((el) => el.className)}
        isVisible={isAIBotVisible}
        onClose={() => setIsAIBotVisible(false)}
      />

      {/* Modal de configuración de base de datos */}
      <DatabaseConfigModal
        isOpen={isDatabaseConfigModalOpen}
        onClose={() => setIsDatabaseConfigModalOpen(false)}
        onConfirm={handleConfirmBackendGeneration}
        diagramName={diagramName}
      />
    </div>
  );
}

export default App;
