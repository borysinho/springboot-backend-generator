# Diagramas de Arquitectura y Modelos

Esta carpeta contiene la documentación visual de la arquitectura del sistema de diagramas UML colaborativos.

## 📋 Diagramas Disponibles

### 1. **Relaciones de Modelos** (`modelos-relaciones.md`)

Diagrama ER completo mostrando las relaciones entre todos los modelos del sistema:

- **UserModel**: Gestión de usuarios
- **InvitationModel**: Sistema de invitaciones
- **DiagramSnapshotModel**: Snapshots versionados de diagramas
- **DiagramModel**: Estado en tiempo real

**Formatos disponibles:**

- `modelos-relaciones.md`: Diagrama Mermaid con explicaciones detalladas
- `modelos-relaciones.puml`: Diagrama PlantUML para herramientas especializadas

### 2. **Flujo de Colaboración** (`flujo-colaboracion.md`)

Diagramas de secuencia y estados mostrando los procesos de negocio:

- **Secuencia de invitaciones**: Creación → envío → aceptación → colaboración
- **Estados de invitaciones**: pending → accepted/rejected/expired
- **Estados de diagramas**: privado/público con colaboradores

## 🏗️ Arquitectura General

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │
│   (React)       │◄──►│   (Node.js)    │
│                 │    │                 │
│ • UMLDiagram    │    │ • Controllers   │
│ • ConnectionBar │    │ • Models        │
│ • Notifications │    │ • WebSockets    │
└─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   User Actions  │    │   Data Models   │
│                 │    │                 │
│ • Create Class  │    │ • UserModel     │
│ • Invite Users  │    │ • InvitationModel│
│ • Edit Diagram  │    │ • DiagramSnapshot│
│ • Collaborate   │    │ • DiagramModel  │
└─────────────────┘    └─────────────────┘
```

## 🔄 Flujos Principales

### Creación de Diagrama

1. Usuario crea diagrama → `DiagramSnapshotModel.create()`
2. Se inicializa estado → `DiagramModel` con estado vacío
3. Se guarda snapshot inicial → Base de datos en memoria

### Invitación de Colaboradores

1. Usuario envía invitación → `InvitationModel.create()`
2. Invitado recibe notificación → Email/sistema de notificaciones
3. Invitado acepta → `InvitationModel.accept()` + `DiagramSnapshotModel.addCollaborator()`
4. Acceso concedido → Usuario puede editar el diagrama

### Colaboración en Tiempo Real

1. Usuario edita diagrama → Operaciones JSON Patch
2. `DiagramModel.applyOperation()` valida y aplica cambios
3. WebSocket emite cambios → Todos los colaboradores reciben actualización
4. `DiagramSnapshotModel.updateLastActivity()` registra actividad

## 📊 Modelos de Datos

### UserModel

- **Propósito**: Gestión de usuarios y autenticación
- **Campos clave**: id, name, email, password
- **Relaciones**: Crea invitaciones, crea diagramas, colabora en diagramas

### InvitationModel

- **Propósito**: Sistema de invitaciones para colaboración
- **Campos clave**: diagramId, creatorId, inviteeEmail, status, expiresAt
- **Estados**: pending, accepted, rejected, expired

### DiagramSnapshotModel

- **Propósito**: Persistencia y versionado de diagramas
- **Campos clave**: diagramId, state, version, collaborators, isPublic
- **Funciones**: Versionado automático, control de acceso, metadatos

### DiagramModel

- **Propósito**: Estado en tiempo real del diagrama
- **Campos clave**: state (DiagramState), observers
- **Funciones**: Aplicar operaciones, validar cambios, notificar observadores

## 🛠️ Herramientas para Visualizar

### Mermaid (Recomendado)

- **Ubicación**: Archivos `.md` en esta carpeta
- **Visualización**: GitHub, VS Code con extensiones, mermaid.live
- **Ventajas**: Integración directa en documentación

### PlantUML

- **Ubicación**: Archivos `.puml` en esta carpeta
- **Visualización**: IntelliJ IDEA, VS Code con extensiones, plantuml.com
- **Ventajas**: Más opciones de formato y exportación

## 📝 Convenciones

- **Colores**: Azul para entidades principales, verde para estados exitosos, rojo para errores
- **Flechas**: `||--||` relación 1:1, `||--o{` relación 1:N, `}o--o{` relación N:M
- **Notas**: Explicaciones contextuales para procesos complejos
- **Estados**: Diagramas de estado para flujos de negocio importantes

## 🔄 Actualización

Los diagramas deben actualizarse cuando:

- Se agregan nuevos modelos o relaciones
- Cambian los flujos de negocio
- Se modifica la arquitectura del sistema
- Se agregan nuevas funcionalidades

**Última actualización**: Septiembre 2025
