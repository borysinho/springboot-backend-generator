import {
  UMLValidator,
  Diagram,
  JsonPatchOperation,
} from "../validation/UMLValidator.js";

export interface DiagramElement {
  id: string;
  className: string;
  attributes: string[];
  methods: string[];
  elementType: "class" | "interface" | "enumeration" | "package" | "note";
  position?: { x: number; y: number };
  containedElements?: string[];
}

export interface DiagramRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  relationship:
    | "association"
    | "aggregation"
    | "composition"
    | "generalization"
    | "dependency"
    | "realization";
  sourceCardinality?: string;
  targetCardinality?: string;
  label?: string;
}

export interface DiagramState {
  elements: Record<string, DiagramElement>;
  relationships: Record<string, DiagramRelationship>;
  version: number;
  lastModified: number;
}

export interface OperationResult {
  success: boolean;
  data?: unknown;
  errors?: string[];
  newState?: DiagramState;
}

export class DiagramModel {
  private state: DiagramState;
  private observers: Set<(state: DiagramState) => void> = new Set();

  constructor() {
    this.state = {
      elements: {},
      relationships: {},
      version: 0,
      lastModified: Date.now(),
    };
  }

  /**
   * Suscribe un observador para cambios de estado
   */
  subscribe(observer: (state: DiagramState) => void): () => void {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  /**
   * Notifica a todos los observadores sobre cambios de estado
   */
  private notifyObservers(): void {
    this.observers.forEach((observer) => observer(this.state));
  }

  /**
   * Obtiene el estado actual del diagrama
   */
  getState(): DiagramState {
    return { ...this.state };
  }

  /**
   * Aplica una operación al modelo
   */
  async applyOperation(
    operation: JsonPatchOperation
  ): Promise<OperationResult> {
    try {
      // Convertir estado a formato Diagram para validación
      const diagramForValidation: Diagram = this.convertStateToDiagram();

      // Validar la operación con reglas UML
      const validationResult = UMLValidator.validateOperation(
        operation,
        diagramForValidation
      );

      if (!validationResult.valid) {
        return {
          success: false,
          errors: validationResult.errors,
        };
      }

      // Aplicar la operación al estado
      const newState = this.applyOperationToState(operation);

      // Actualizar versión y timestamp
      newState.version++;
      newState.lastModified = Date.now();

      // Actualizar estado
      this.state = newState;

      // Notificar a observadores
      this.notifyObservers();

      return {
        success: true,
        newState: this.state,
      };
    } catch (error) {
      console.error("Error aplicando operación:", error);
      return {
        success: false,
        errors: ["Error interno del servidor"],
      };
    }
  }

  /**
   * Aplica una operación específica al estado
   */
  private applyOperationToState(operation: JsonPatchOperation): DiagramState {
    const newState = { ...this.state };
    const { op, path, value } = operation;
    const pathParts = path.split("/").filter((p: string) => p !== "");

    if (pathParts.length < 2) return newState;

    const collection = pathParts[0];
    const itemId = pathParts[1];
    const attribute = pathParts[2];

    if (collection === "elements") {
      if (op === "add" && value) {
        newState.elements[itemId] = value as DiagramElement;
      } else if (op === "remove") {
        delete newState.elements[itemId];
      } else if (op === "replace" && attribute && value !== undefined) {
        if (!newState.elements[itemId])
          newState.elements[itemId] = {} as DiagramElement;
        (newState.elements[itemId] as unknown as Record<string, unknown>)[
          attribute
        ] = value;
      }
    } else if (collection === "relationships") {
      if (op === "add" && value) {
        newState.relationships[itemId] = value as DiagramRelationship;
      } else if (op === "remove") {
        delete newState.relationships[itemId];
      } else if (op === "replace" && attribute && value !== undefined) {
        if (!newState.relationships[itemId])
          newState.relationships[itemId] = {} as DiagramRelationship;
        (newState.relationships[itemId] as unknown as Record<string, unknown>)[
          attribute
        ] = value;
      }
    }

    return newState;
  }

  /**
   * Convierte el estado interno a formato Diagram para validación
   */
  private convertStateToDiagram(): Diagram {
    const elements = Object.values(this.state.elements).map((element) => ({
      id: element.id,
      className: element.className,
      attributes: element.attributes,
      methods: element.methods,
      elementType: element.elementType,
      x: element.position?.x || 0,
      y: element.position?.y || 0,
      width: 200, // valores por defecto
      height: 120,
      containedElements: element.containedElements,
    }));

    const relationships = Object.values(this.state.relationships).map(
      (rel) => ({
        id: rel.id,
        source: rel.sourceId,
        target: rel.targetId,
        relationship: rel.relationship,
        label: rel.label,
        sourceMultiplicity: rel.sourceCardinality,
        targetMultiplicity: rel.targetCardinality,
      })
    );

    return {
      id: "main-diagram",
      elements,
      relationships,
      lastModified: this.state.lastModified,
      version: this.state.version,
    };
  }

  /**
   * Obtiene estadísticas del diagrama
   */
  getStatistics(): {
    elementsCount: number;
    relationshipsCount: number;
    version: number;
  } {
    return {
      elementsCount: Object.keys(this.state.elements).length,
      relationshipsCount: Object.keys(this.state.relationships).length,
      version: this.state.version,
    };
  }
}
