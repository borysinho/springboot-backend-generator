# Modelos de Datos

Este directorio contiene los modelos de datos para la aplicación de diagramas UML colaborativos.

## Modelos Implementados

### 1. UserModel (`UserModel.ts`)

Modelo para gestionar usuarios del sistema.

**Campos:**

- `id`: Identificador único del usuario
- `name`: Nombre del usuario
- `email`: Correo electrónico (único)
- `password`: Contraseña (debería estar hasheada en producción)
- `createdAt`: Fecha de creación
- `updatedAt`: Fecha de última actualización

**Métodos principales:**

- `create(userData)`: Crear nuevo usuario
- `findById(id)`: Buscar por ID
- `findByEmail(email)`: Buscar por email
- `validateCredentials(email, password)`: Validar credenciales para login
- `update(id, updates)`: Actualizar usuario
- `delete(id)`: Eliminar usuario

### 2. InvitationModel (`InvitationModel.ts`)

Modelo para gestionar invitaciones a diagramas colaborativos.

**Campos:**

- `id`: Identificador único de la invitación
- `diagramId`: ID del diagrama al que se invita
- `creatorId`: ID del usuario que crea la invitación
- `inviteeEmail`: Email del usuario invitado
- `inviteeId`: ID del usuario invitado (opcional, si ya existe en el sistema)
- `status`: Estado ('pending', 'accepted', 'rejected', 'expired')
- `message`: Mensaje opcional del creador
- `createdAt`: Fecha de creación
- `updatedAt`: Fecha de actualización
- `expiresAt`: Fecha de expiración
- `acceptedAt`: Fecha de aceptación (opcional)
- `rejectedAt`: Fecha de rechazo (opcional)

**Métodos principales:**

- `create(invitationData)`: Crear nueva invitación
- `findById(id)`: Buscar por ID
- `findByDiagramId(diagramId)`: Buscar invitaciones de un diagrama
- `findByCreatorId(creatorId)`: Buscar invitaciones creadas por un usuario
- `findPendingByEmail(email)`: Buscar invitaciones pendientes para un email
- `accept(id, userId)`: Aceptar invitación
- `reject(id)`: Rechazar invitación
- `expire(id)`: Marcar como expirada

### 3. DiagramSnapshotModel (`DiagramSnapshotModel.ts`)

Modelo para almacenar snapshots del estado de los diagramas.

**Campos:**

- `id`: Identificador único del snapshot
- `diagramId`: ID único del diagrama
- `name`: Nombre del diagrama
- `description`: Descripción opcional
- `creatorId`: ID del usuario creador
- `collaborators`: Array de IDs de colaboradores
- `state`: Estado completo del diagrama (DiagramState)
- `version`: Número de versión del snapshot
- `isPublic`: Si el diagrama es público
- `tags`: Array de tags para categorización
- `createdAt`: Fecha de creación
- `updatedAt`: Fecha de actualización
- `lastActivityAt`: Fecha de última actividad
- `thumbnail`: URL o data de miniatura (opcional)

**Métodos principales:**

- `create(snapshotData)`: Crear nuevo diagrama
- `createVersion(diagramId, state)`: Crear nueva versión de diagrama existente
- `getLatestByDiagramId(diagramId)`: Obtener último snapshot de un diagrama
- `findByCreatorId(creatorId)`: Buscar diagramas por creador
- `findByCollaboratorId(collaboratorId)`: Buscar diagramas donde el usuario colabora
- `findPublic()`: Buscar diagramas públicos
- `addCollaborator(diagramId, collaboratorId)`: Agregar colaborador
- `removeCollaborator(diagramId, collaboratorId)`: Remover colaborador
- `updateLastActivity(diagramId)`: Actualizar última actividad

### 4. DiagramOperationLogModel (`DiagramOperationLogModel.ts`)

Modelo para almacenar el historial completo de operaciones JSON Patch aplicadas a cada diagrama.

**Campos principales:**

- `id`: Identificador único de la operación
- `diagramId`: ID del diagrama
- `operation`: Operación JSON Patch completa
- `userId`: Usuario que realizó la operación
- `timestamp`: Fecha y hora de la operación
- `sequenceNumber`: Número de secuencia dentro del diagrama
- `diagramVersion`: Versión del diagrama después de aplicar la operación
- `clientId`: ID del cliente que originó la operación
- `metadata`: Información adicional (IP, user agent, etc.)

**Funcionalidades:**

- **Historial completo**: Todas las operaciones aplicadas a un diagrama
- **Versionado**: Seguimiento de versiones del diagrama
- **Auditoría**: Quién, cuándo y qué cambios realizó
- **Rollback**: Capacidad de revertir operaciones
- **Sincronización**: Obtener operaciones desde una versión específica
- **Batching**: Agrupar operaciones relacionadas
- **Búsqueda avanzada**: Filtrar por usuario, tipo, fecha, etc.

### 5. DiagramModel (`DiagramModel.ts`)

Modelo existente para manejar el estado en tiempo real de un diagrama.

**Campos principales:**

- `DiagramState`: Estado del diagrama con elementos y relaciones
- `DiagramElement`: Elementos del diagrama (clases, interfaces, etc.)
- `DiagramRelationship`: Relaciones entre elementos

## Uso Básico

```typescript
import {
  UserModel,
  InvitationModel,
  DiagramSnapshotModel,
  DiagramModel,
} from "./models/index.js";

// Crear instancias de los modelos
const userModel = new UserModel();
const invitationModel = new InvitationModel();
const snapshotModel = new DiagramSnapshotModel();

// Crear un usuario
const user = userModel.create({
  name: "Juan Pérez",
  email: "juan@example.com",
  password: "hashed_password",
});

// Crear un diagrama
const diagram = snapshotModel.create({
  diagramId: "diagram_123",
  name: "Mi Diagrama UML",
  description: "Diagrama de clases del sistema",
  creatorId: user.id,
  collaborators: [],
  state: initialDiagramState,
  isPublic: false,
  tags: ["uml", "clases"],
});

// Crear una invitación
const invitation = invitationModel.create({
  diagramId: "diagram_123",
  creatorId: user.id,
  inviteeEmail: "invitado@example.com",
  message: "Te invito a colaborar en este diagrama",
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
});

// Registrar una operación JSON Patch
const operationLog = new DiagramOperationLogModel();
operationLog.addOperation({
  diagramId: "diagram_123",
  operation: {
    op: "add",
    path: "/elements/0",
    value: { id: "class_1", type: "uml.Class", name: "NuevaClase" },
  },
  userId: user.id,
  clientId: "client_abc123",
  metadata: { ip: "192.168.1.1", userAgent: "Chrome/91.0" },
});

// Obtener operaciones desde una versión específica para sincronización
const operations = operationLog.getOperationsSinceVersion("diagram_123", 5);

// Crear operación de rollback para una operación específica
const reverseOp = operationLog.createReverseOperation("operation_id_123");

// Buscar operaciones por usuario y fecha
const userOperations = operationLog.searchOperations({
  diagramId: "diagram_123",
  userId: user.id,
  fromDate: new Date("2024-01-01"),
  toDate: new Date("2024-12-31"),
});
```

## Notas de Implementación

- Actualmente todos los modelos almacenan datos en memoria (Map)
- En producción, estos modelos deberían conectarse a una base de datos real
- Las contraseñas deberían estar hasheadas (bcrypt, argon2, etc.)
- Se recomienda agregar validaciones de entrada más robustas
- Los modelos incluyen índices para búsquedas eficientes
