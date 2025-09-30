# Diagrama de Flujo de Datos - Sistema de Colaboración UML

Este diagrama muestra el flujo completo de datos en el sistema de colaboración híbrido, desde que una operación nace en un cliente hasta que se distribuye a todos los participantes conectados.

```mermaid
sequenceDiagram
    participant C1 as Cliente 1
    participant C2 as Cliente 2
    participant CN as Cliente N
    participant S as Servidor
    participant UV as UMLValidator
    participant CR as ConflictResolver

    Note over C1,CN: Usuario realiza una acción en el diagrama (agregar elemento, modificar relación, etc.)

    C1->>S: JsonPatchOperation<br/>{op: "add|replace|remove", path: "/elements/0", value: {...},<br/>clientId: "user-123", timestamp: 1234567890,<br/>sequenceNumber: 5}

    Note over S: Servidor recibe la operación y comienza validación

    S->>UV: ValidationRequest<br/>{operation: JsonPatchOperation,<br/>currentDiagram: Diagram}

    UV-->>S: ValidationResult<br/>{valid: true|false,<br/>errors: ["mensaje error"],<br/>warnings: ["mensaje warning"]}

    alt Validación Exitosa
        Note over S: Operación válida, proceder con aplicación

        S->>CR: ConflictCheck<br/>{operation: JsonPatchOperation,<br/>pendingOperations: [JsonPatchOperation[]]}

        CR-->>S: ConflictResolution<br/>{type: "auto|manual",<br/>winner: JsonPatchOperation,<br/>loser: JsonPatchOperation,<br/>explanation: "razón"}

        alt Sin Conflictos
            S->>S: ApplyOperation<br/>{operation: JsonPatchOperation,<br/>diagram: Diagram}

            S->>S: UpdateDiagramState<br/>{newDiagram: Diagram,<br/>lastOperation: JsonPatchOperation}

            S->>C1: OperationAccepted<br/>{operation: JsonPatchOperation,<br/>newState: Diagram,<br/>timestamp: 1234567890}

            S->>C2: StateUpdate<br/>{diagram: Diagram,<br/>sourceClientId: "user-123",<br/>operation: JsonPatchOperation}

            S->>CN: StateUpdate<br/>{diagram: Diagram,<br/>sourceClientId: "user-123",<br/>operation: JsonPatchOperation}

            Note over C2,CN: Clientes actualizan su estado local con el nuevo diagrama

        else Hay Conflictos
            S->>C1: ConflictDetected<br/>{conflict: ComplexConflict,<br/>operations: [JsonPatchOperation[]],<br/>path: "/elements/0/name"}

            Note over C1: Cliente muestra diálogo de resolución manual

            C1->>S: ConflictResolution<br/>{selectedOperation: 0,<br/>conflictId: "conflict-456"}

            S->>S: ApplyResolvedOperation<br/>{winner: JsonPatchOperation,<br/>diagram: Diagram}

            S->>C1: ResolutionAccepted<br/>{resolvedOperation: JsonPatchOperation,<br/>newState: Diagram}

            S->>C2: StateUpdate<br/>{diagram: Diagram,<br/>conflictResolved: true,<br/>resolution: ConflictResolution}

            S->>CN: StateUpdate<br/>{diagram: Diagram,<br/>conflictResolved: true,<br/>resolution: ConflictResolution}
        end

    else Validación Fallida
        S->>C1: ValidationError<br/>{operation: JsonPatchOperation,<br/>errors: ["Nombre duplicado en paquete"],<br/>warnings: ["Atributo sin tipo"]}

        Note over C1: Cliente muestra errores y revierte cambios optimistas
    end

    Note over C1,CN: Estado final: Todos los clientes tienen el diagrama consistente y validado
```

## Leyenda de Tipos de Datos

### Operaciones JSON Patch

```json
{
  "op": "add|replace|remove|move|copy|test",
  "path": "/elements/0/name",
  "value": "NuevoNombre",
  "from": "/elements/1",
  "clientId": "user-123",
  "timestamp": 1234567890,
  "sequenceNumber": 5
}
```

### Estado del Diagrama

```json
{
  "id": "diagram-456",
  "elements": [
    {
      "id": "element-1",
      "type": "class",
      "name": "MiClase",
      "package": "com.example",
      "attributes": ["-atributo: String"],
      "methods": ["+metodo(): void"]
    }
  ],
  "relationships": [
    {
      "id": "rel-1",
      "type": "association",
      "source": "element-1",
      "target": "element-2",
      "sourceCardinality": "1",
      "targetCardinality": "0..*"
    }
  ],
  "lastModified": 1234567890,
  "version": 42
}
```

### Resultados de Validación

```json
{
  "valid": false,
  "errors": [
    "Nombre 'MiClase' ya existe en el paquete 'com.example'",
    "Cardinalidad '1..2..*' no es válida"
  ],
  "warnings": ["Atributo 'atributo' no tiene tipo especificado"]
}
```

### Información de Conflictos

```json
{
  "id": "conflict-789",
  "operations": [
    {
      "clientId": "user-123",
      "timestamp": 1234567890,
      "op": "replace",
      "path": "/elements/0/name",
      "value": "NombreA"
    },
    {
      "clientId": "user-456",
      "timestamp": 1234567891,
      "op": "replace",
      "path": "/elements/0/name",
      "value": "NombreB"
    }
  ],
  "path": "/elements/0/name",
  "resolution": "manual"
}
```

## Flujo Principal Resumido

1. **Inicio**: Usuario edita diagrama → `JsonPatchOperation`
2. **Validación UML**: Servidor valida reglas UML (nombres únicos, cardinalidad, tipos de relación, etc.) → `ValidationResult`
3. **Detección de Conflictos**: Servidor detecta operaciones simultáneas → `ConflictResolution`
4. **Aplicación**: Servidor aplica cambios válidos → `Diagram` actualizado
5. **Distribución**: Broadcast a todos los clientes → `StateUpdate`
6. **Consistencia**: Todos los clientes sincronizados con diagrama validado

## Puntos Críticos

- **Validación Centralizada**: Solo el servidor puede modificar el estado oficial del diagrama
- **Reglas UML Estrictas**: Nombres únicos, cardinalidad válida, relaciones permitidas
- **Atomicidad**: Cada operación es tratada como una transacción completa
- **Consistencia Eventual**: Todos los clientes convergen al mismo estado validado
- **Resolución de Conflictos**: Auto-resolución para casos simples, manual para complejos
- **Tolerancia a Fallos**: Operaciones inválidas son rechazadas sin afectar el estado global
