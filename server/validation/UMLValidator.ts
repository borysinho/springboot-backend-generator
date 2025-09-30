// server/validation/UMLValidator.ts

// Interfaces del servidor (equivalentes a las del frontend)
export interface Diagram {
  id: string;
  elements: Element[];
  relationships: Relationship[];
  lastModified?: number;
  version?: number;
}

export interface Element {
  id: string;
  className: string;
  attributes: string[];
  methods: string[];
  elementType: "class" | "interface" | "enumeration" | "package" | "note";
  stereotype?: string;
  parentPackageId?: string;
  containedElements?: string[];
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Relationship {
  id: string;
  source: string;
  target: string;
  relationship:
    | "association"
    | "aggregation"
    | "composition"
    | "generalization"
    | "dependency"
    | "realization";
  label?: string;
  sourceMultiplicity?: string;
  targetMultiplicity?: string;
  sourceRole?: string;
  targetRole?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface JsonPatchOperation {
  op: "add" | "remove" | "replace" | "move" | "copy" | "test";
  path: string;
  value?: unknown;
  from?: string;
  clientId: string;
  timestamp: number;
  sequenceNumber: number;
  description: string;
}

export class UMLValidator {
  static validateOperation(
    operation: JsonPatchOperation,
    currentDiagram: Diagram
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      switch (operation.op) {
        case "add":
          this.validateAddOperation(
            operation,
            currentDiagram,
            errors,
            warnings
          );
          break;
        case "replace":
          this.validateReplaceOperation(
            operation,
            currentDiagram,
            errors,
            warnings
          );
          break;
        case "remove":
          this.validateRemoveOperation(
            operation,
            currentDiagram,
            errors,
            warnings
          );
          break;
      }

      // Validaciones adicionales
      this.validateDiagramIntegrity(currentDiagram, errors, warnings);
    } catch (error) {
      errors.push(
        `Error de validación: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  private static validateAddOperation(
    operation: JsonPatchOperation,
    diagram: Diagram,
    errors: string[],
    warnings: string[]
  ) {
    if (operation.path.startsWith("/elements/")) {
      this.validateElement(
        operation.value as Element,
        diagram,
        errors,
        warnings
      );
    } else if (operation.path.startsWith("/relationships/")) {
      this.validateRelationship(
        operation.value as Relationship,
        diagram,
        errors,
        warnings
      );
    }
  }

  private static validateReplaceOperation(
    operation: JsonPatchOperation,
    diagram: Diagram,
    errors: string[],
    warnings: string[]
  ) {
    // Para operaciones de reemplazo, validar el nuevo valor
    if (operation.path.includes("/elements/")) {
      const pathParts = operation.path.split("/");
      const elementIndex = parseInt(pathParts[2]);
      if (!isNaN(elementIndex) && diagram.elements[elementIndex]) {
        const updatedElement = { ...diagram.elements[elementIndex] };

        // Aplicar el cambio al elemento
        const propertyPath = pathParts.slice(3).join("/");
        this.setNestedProperty(updatedElement, propertyPath, operation.value);

        this.validateElement(updatedElement, diagram, errors, warnings);
      }
    } else if (operation.path.includes("/relationships/")) {
      const pathParts = operation.path.split("/");
      const relationshipIndex = parseInt(pathParts[2]);
      if (
        !isNaN(relationshipIndex) &&
        diagram.relationships[relationshipIndex]
      ) {
        const updatedRelationship = {
          ...diagram.relationships[relationshipIndex],
        };

        // Aplicar el cambio a la relación
        const propertyPath = pathParts.slice(3).join("/");
        this.setNestedProperty(
          updatedRelationship,
          propertyPath,
          operation.value
        );

        this.validateRelationship(
          updatedRelationship,
          diagram,
          errors,
          warnings
        );
      }
    }
  }

  private static validateRemoveOperation(
    operation: JsonPatchOperation,
    diagram: Diagram,
    errors: string[],
    warnings: string[]
  ) {
    // Validar que no se rompan dependencias al eliminar
    if (operation.path.startsWith("/elements/")) {
      const elementId = operation.path.split("/")[2];
      const dependentRelationships = diagram.relationships.filter(
        (rel) => rel.source === elementId || rel.target === elementId
      );

      if (dependentRelationships.length > 0) {
        warnings.push(
          `Eliminar elemento afectará ${dependentRelationships.length} relación(es)`
        );
      }
    }
  }

  private static validateElement(
    element: Element,
    diagram: Diagram,
    errors: string[],
    warnings: string[]
  ) {
    // Validar nombre único en el diagrama
    if (this.isNameTaken(element.className, element.parentPackageId, diagram)) {
      errors.push(`Nombre '${element.className}' ya existe en el paquete`);
    }

    // Validar formato de estereotipo
    if (element.stereotype && !/^<<.*>>$/.test(element.stereotype)) {
      errors.push(
        `Estereotipo '${element.stereotype}' debe tener formato <<texto>>`
      );
    }

    // Validaciones específicas por tipo
    switch (element.elementType) {
      case "class":
        this.validateClass(element, errors, warnings);
        break;
      case "interface":
        this.validateInterface(element, errors, warnings);
        break;
      case "enumeration":
        this.validateEnumeration(element, errors, warnings);
        break;
      case "package":
        this.validatePackage(element, errors, warnings);
        break;
    }
  }

  private static validateRelationship(
    relationship: Relationship,
    diagram: Diagram,
    errors: string[],
    warnings: string[]
  ) {
    // Validar que elementos existen
    const sourceExists = diagram.elements.some(
      (e) => e.id === relationship.source
    );
    const targetExists = diagram.elements.some(
      (e) => e.id === relationship.target
    );

    if (!sourceExists) {
      errors.push(`Elemento source '${relationship.source}' no existe`);
    }
    if (!targetExists) {
      errors.push(`Elemento target '${relationship.target}' no existe`);
    }

    // Validar cardinalidad
    if (
      relationship.sourceMultiplicity &&
      !this.isValidCardinality(relationship.sourceMultiplicity)
    ) {
      errors.push(
        `Cardinalidad source '${relationship.sourceMultiplicity}' no es válida`
      );
    }
    if (
      relationship.targetMultiplicity &&
      !this.isValidCardinality(relationship.targetMultiplicity)
    ) {
      errors.push(
        `Cardinalidad target '${relationship.targetMultiplicity}' no es válida`
      );
    }

    // Validar tipos de relación permitidos
    if (sourceExists && targetExists) {
      const source = diagram.elements.find((e) => e.id === relationship.source);
      const target = diagram.elements.find((e) => e.id === relationship.target);
      if (
        source &&
        target &&
        !this.isValidRelationship(relationship.relationship, source, target)
      ) {
        errors.push(
          `Relación '${relationship.relationship}' no permitida entre ${source.elementType} y ${target.elementType}`
        );
      }
    }
  }

  private static validateClass(
    element: Element,
    errors: string[],
    warnings: string[]
  ) {
    // Validar atributos
    if (element.attributes) {
      element.attributes.forEach((attr: string, index: number) => {
        if (!attr.includes(":")) {
          warnings.push(`Atributo ${index + 1} no tiene tipo especificado`);
        }
      });
    }

    // Validar métodos
    if (element.methods) {
      element.methods.forEach((method: string, index: number) => {
        if (!method.includes("(") || !method.includes(")")) {
          errors.push(`Método ${index + 1} tiene formato inválido`);
        }
      });
    }
  }

  private static validateInterface(
    element: Element,
    errors: string[],
    warnings: string[]
  ) {
    // Interfaces solo pueden tener métodos abstractos
    if (element.methods) {
      element.methods.forEach((method: string, index: number) => {
        if (!method.includes("()") || method.includes("{}")) {
          errors.push(`Interface método ${index + 1} debe ser abstracto`);
        }
      });
    }

    // Interfaces no pueden tener atributos (excepto constantes)
    if (element.attributes && element.attributes.length > 0) {
      warnings.push("Interfaces generalmente no tienen atributos de instancia");
    }
  }

  private static validateEnumeration(
    element: Element,
    errors: string[],
    _warnings: string[]
  ) {
    // Validar valores únicos
    if (element.attributes) {
      const values = element.attributes;
      const uniqueValues = new Set(values);
      if (uniqueValues.size !== values.length) {
        errors.push("Enumeración contiene valores duplicados");
      }
    } else {
      errors.push("Enumeración debe tener al menos un valor");
    }
  }

  private static validatePackage(
    _element: Element,
    _errors: string[],
    _warnings: string[]
  ) {
    // Validar que no contenga elementos que ya están en otros paquetes
    // Esta validación se hace en validateDiagramIntegrity
  }

  private static isNameTaken(
    name: string,
    packageId: string | undefined,
    diagram: Diagram
  ): boolean {
    return diagram.elements.some(
      (e) =>
        e.className === name &&
        e.parentPackageId === packageId &&
        e.elementType !== "note" // Notas pueden tener nombres duplicados
    );
  }

  private static isValidCardinality(cardinality: string): boolean {
    const patterns = [
      /^\d+$/, // Número exacto: "1"
      /^\d+\.\.\d+$/, // Rango: "1..5"
      /^\d+\.\.\*$/, // Desde: "1..*"
      /^0\.\.\d+$/, // Hasta: "0..1"
      /^\*$/, // Muchos: "*"
    ];
    return patterns.some((pattern) => pattern.test(cardinality));
  }

  private static isValidRelationship(
    type: string,
    source: Element,
    target: Element
  ): boolean {
    switch (type) {
      case "generalization":
        return (
          (source.elementType === "class" && target.elementType === "class") ||
          (source.elementType === "interface" &&
            target.elementType === "interface")
        );
      case "realization":
        return (
          source.elementType === "class" && target.elementType === "interface"
        );
      case "association":
      case "aggregation":
      case "composition":
        return (
          source.elementType !== "enumeration" &&
          target.elementType !== "enumeration"
        );
      case "dependency":
        return true; // Dependencias permitidas entre cualquier elemento
      default:
        return false;
    }
  }

  private static validateDiagramIntegrity(
    diagram: Diagram,
    errors: string[],
    warnings: string[]
  ) {
    // Validar referencias de relaciones
    diagram.relationships?.forEach((rel, index) => {
      const sourceExists = diagram.elements.some((e) => e.id === rel.source);
      const targetExists = diagram.elements.some((e) => e.id === rel.target);

      if (!sourceExists || !targetExists) {
        errors.push(`Relación ${index + 1} referencia elementos inexistentes`);
      }
    });

    // Validar integridad de paquetes
    diagram.elements?.forEach((element) => {
      if (element.elementType === "package" && element.containedElements) {
        element.containedElements.forEach((containedId) => {
          const containedElement = diagram.elements.find(
            (e) => e.id === containedId
          );
          if (!containedElement) {
            errors.push(
              `Paquete '${element.className}' referencia elemento inexistente`
            );
          } else if (containedElement.parentPackageId !== element.id) {
            warnings.push(
              `Elemento '${containedElement.className}' no está correctamente asignado al paquete`
            );
          }
        });
      }
    });

    // Validar dependencias circulares (simplificado)
    const hasCircularDeps = this.detectCircularDependencies(diagram);
    if (hasCircularDeps) {
      warnings.push("Posible dependencia circular detectada");
    }
  }

  private static detectCircularDependencies(diagram: Diagram): boolean {
    // Implementación simplificada de detección de ciclos
    // En producción, usar algoritmo de Kahn o DFS
    const inheritanceRelationships =
      diagram.relationships?.filter(
        (rel) => rel.relationship === "generalization"
      ) || [];

    // Crear grafo de herencia
    const graph: { [key: string]: string[] } = {};
    inheritanceRelationships.forEach((rel) => {
      if (!graph[rel.source]) graph[rel.source] = [];
      graph[rel.source].push(rel.target);
    });

    // Detección simple de ciclos (no completa pero funcional)
    for (const node in graph) {
      if (this.hasCycle(node, graph, new Set())) {
        return true;
      }
    }

    return false;
  }

  private static hasCycle(
    node: string,
    graph: { [key: string]: string[] },
    visited: Set<string>
  ): boolean {
    if (visited.has(node)) return true;
    visited.add(node);

    const neighbors = graph[node] || [];
    for (const neighbor of neighbors) {
      if (this.hasCycle(neighbor, graph, new Set(visited))) {
        return true;
      }
    }

    return false;
  }

  private static setNestedProperty(
    obj: Record<string, unknown>,
    path: string,
    value: unknown
  ) {
    const keys = path.split("/");
    let current: Record<string, unknown> = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]] as Record<string, unknown>;
    }

    current[keys[keys.length - 1]] = value;
  }
}
