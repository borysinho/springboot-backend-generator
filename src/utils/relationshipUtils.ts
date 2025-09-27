import type { UMLRelationship, CustomElement } from "../types";

// Función para convertir UMLRelationship a link de JointJS con multiplicidad
export const convertRelationshipToLink = (relationship: UMLRelationship) => {
  const link = {
    id: relationship.id,
    source: { id: relationship.source },
    target: { id: relationship.target },
    labels: [] as Array<{
      position: number;
      attrs: {
        text?: {
          text: string;
          fill: string;
          fontSize: number;
          fontWeight?: string;
          fontStyle?: string;
        };
        rect?: {
          fill: string;
          stroke: string;
          strokeWidth: number;
          rx: number;
          ry: number;
        };
      };
    }>,
    attrs: {} as Record<
      string,
      {
        stroke?: string;
        strokeWidth?: number;
        fill?: string;
        d?: string;
        strokeDasharray?: string;
      }
    >,
  };

  // Agregar etiqueta de relación si existe
  if (relationship.label) {
    link.labels.push({
      position: 0.5,
      attrs: {
        text: {
          text: relationship.label,
          fill: "#333",
          fontSize: 12,
          fontWeight: "bold",
        },
        rect: {
          fill: "white",
          stroke: "#333",
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
      position: 0.15, // Más cerca del extremo source, alejado de la etiqueta central
      attrs: {
        text: {
          text: relationship.sourceMultiplicity,
          fill: "#000",
          fontSize: 12,
          fontWeight: "bold",
        },
        rect: {
          fill: "white",
          stroke: "#333",
          strokeWidth: 1,
          rx: 3,
          ry: 3,
        },
      },
    });
  }

  // Agregar multiplicidad en el extremo target (destino)
  if (relationship.targetMultiplicity) {
    link.labels.push({
      position: 0.85, // Más cerca del extremo target, alejado de la etiqueta central
      attrs: {
        text: {
          text: relationship.targetMultiplicity,
          fill: "#000",
          fontSize: 12,
          fontWeight: "bold",
        },
        rect: {
          fill: "white",
          stroke: "#333",
          strokeWidth: 1,
          rx: 3,
          ry: 3,
        },
      },
    });
  }

  // Agregar roles si existen
  if (relationship.sourceRole) {
    link.labels.push({
      position: 0.25, // Posición cerca del source
      attrs: {
        text: {
          text: relationship.sourceRole,
          fill: "#666",
          fontSize: 10,
          fontStyle: "italic",
        },
      },
    });
  }

  if (relationship.targetRole) {
    link.labels.push({
      position: 0.75, // Posición cerca del target
      attrs: {
        text: {
          text: relationship.targetRole,
          fill: "#666",
          fontSize: 10,
          fontStyle: "italic",
        },
      },
    });
  }

  // Configurar el estilo de la línea según el tipo de relación
  switch (relationship.relationship) {
    case "aggregation":
      link.attrs = {
        ".connection": { stroke: "#9C27B0", strokeWidth: 2 },
        ".marker-target": {
          fill: "#9C27B0",
          stroke: "#9C27B0",
          d: "M 10 0 L 0 5 L 10 10 z",
        },
      };
      break;
    case "composition":
      link.attrs = {
        ".connection": { stroke: "#673AB7", strokeWidth: 2 },
        ".marker-target": {
          fill: "#673AB7",
          stroke: "#673AB7",
          d: "M 10 0 L 0 5 L 10 10 z",
        },
      };
      break;
    case "generalization":
      link.attrs = {
        ".connection": { stroke: "#3F51B5", strokeWidth: 2 },
        ".marker-target": {
          fill: "white",
          stroke: "#3F51B5",
          strokeWidth: 2,
          d: "M 10 0 L 0 5 L 10 10 z",
        },
      };
      break;
    case "dependency":
      link.attrs = {
        ".connection": {
          stroke: "#607D8B",
          strokeWidth: 1,
          strokeDasharray: "5,5",
        },
        ".marker-target": { fill: "#607D8B", d: "M 10 0 L 0 5 L 10 10 z" },
      };
      break;
    case "realization":
      link.attrs = {
        ".connection": {
          stroke: "#00BCD4",
          strokeWidth: 1,
          strokeDasharray: "5,5",
        },
        ".marker-target": {
          fill: "white",
          stroke: "#00BCD4",
          strokeWidth: 2,
          d: "M 10 0 L 0 5 L 10 10 z",
        },
      };
      break;
    default: // association
      link.attrs = {
        ".connection": { stroke: "#FF5722", strokeWidth: 2 },
        ".marker-target": { fill: "#FF5722", d: "M 10 0 L 0 5 L 10 10 z" },
      };
  }

  return link;
};

// Función para determinar el tipo de elemento UML basado en su contenido
export const getElementType = (element: CustomElement): string => {
  if (!element.methods || element.methods.length === 0) {
    if (!element.attributes || element.attributes.length === 0) {
      return "Paquete";
    }
    // Si tiene atributos pero no métodos, podría ser enumeración o nota
    if (
      element.attributes.some(
        (attr) => !attr.includes(":") && !attr.includes("(")
      )
    ) {
      return "Enumeración";
    }
    return "Nota";
  }
  // Si tiene métodos pero no atributos, es una interfaz
  if (!element.attributes || element.attributes.length === 0) {
    return "Interfaz";
  }
  // Si tiene ambos, es una clase
  return "Clase";
};
