# Sincronización en Tiempo Real del Editor de Diagramas

Este documento explica cómo implementar la sincronización en tiempo real de las instrucciones del editor de diagramas usando Socket.IO.

## 📋 Arquitectura General

```
Cliente A                    Servidor                    Cliente B
   │                           │                           │
   │  1. Usuario arrastra      │                           │
   │     elemento al diagrama  │                           │
   │                           │                           │
   │  2. handleAddElement()    │                           │
   │     actualiza estado local│                           │
   │                           │                           │
   │  3. addElement() envía    │                           │
   │     operación al servidor │                           │
   │──────────────────────────►│                           │
   │                           │  4. Servidor recibe      │
   │                           │     'diagram_operation'   │
   │                           │                           │
   │                           │  5. Broadcast a todos     │
   │                           │     los demás clientes    │
   │                           │──────────────────────────►│
   │                           │  6. Cliente B recibe      │
   │                           │     'diagram_operation'   │
   │                           │                           │
   │                           │  7. onRemoteOperation()   │
   │                           │     actualiza estado      │
   │                           │     local en Cliente B    │
```

## 🔧 Componentes Implementados

### 1. Hook `useDiagramSync`

**Ubicación:** `src/hooks/useDiagramSync.ts`

```typescript
const { addElement, updateElementPosition, deleteElement, addRelationship, deleteRelationship } = useDiagramSync({
  currentUserId: currentUser?.id || 'anonymous',
  currentUserName: currentUser?.name || 'Usuario Anónimo',
  onRemoteOperation: (operation) => {
    // Manejar operaciones remotas aquí
    switch (operation.type) {
      case 'add_element':
        // Agregar elemento al estado local
        break;
      case 'update_position':
        // Actualizar posición
        break;
      // ... más casos
    }
  },
});
```

### 2. Servidor Socket.IO Actualizado

**Ubicación:** `server/index.ts`

Agregado manejo de operaciones del diagrama:

```typescript
socket.on("diagram_operation", (operation) => {
  console.log(`📝 Operación del diagrama: ${operation.type} por ${operation.userName}`);
  // Broadcast a todos los demás clientes
  socket.broadcast.emit("diagram_operation", operation);
});
```

### 3. Integración en Componentes

**Ubicación:** `src/App.tsx`

Las funciones existentes ahora envían operaciones al servidor:

```typescript
const handleAddElement = useCallback((template, x, y, containerWidth, containerHeight) => {
  // ... lógica existente ...

  // Actualizar estado local
  setDynamicElements(prev => [...prev, newElement]);

  // ✅ NUEVO: Enviar al servidor para sincronización
  addElement(newElement);
}, [addElement]);

const handleUpdateElementPosition = useCallback((elementId, x, y) => {
  // ... lógica existente ...

  // ✅ NUEVO: Enviar al servidor para sincronización
  updateElementPosition(elementId, x, y);
}, [updateElementPosition]);
```

## 🎯 Operaciones Soportadas

| Operación | Descripción | Datos |
|-----------|-------------|-------|
| `add_element` | Agregar nuevo elemento | `CustomElement` |
| `update_position` | Mover elemento | `{x: number, y: number}` |
| `delete_element` | Eliminar elemento | `{}` |
| `add_relationship` | Agregar relación UML | `UMLRelationship` |
| `delete_relationship` | Eliminar relación | `{}` |

## 🚀 Cómo Funciona

### 1. **Conexión Inicial**
- Cliente se conecta al servidor Socket.IO
- Recibe información del usuario (`userId`, `userName`)
- Hook `useDiagramSync` se inicializa con datos del usuario

### 2. **Envío de Operaciones**
```typescript
// Cuando un usuario agrega un elemento
handleAddElement('class', 100, 200);
// 1. Actualiza estado local inmediatamente
// 2. Envía operación al servidor vía addElement()
// 3. Servidor hace broadcast a otros clientes
```

### 3. **Recepción de Operaciones**
```typescript
// En onRemoteOperation callback
switch (operation.type) {
  case 'add_element':
    // Agregar elemento remoto al estado local
    setDynamicElements(prev => [...prev, operation.data]);
    break;
  // ... otros casos
}
```

## 🔄 Flujo de Sincronización

1. **Usuario A** realiza una acción (agregar elemento, mover, etc.)
2. **Estado local** se actualiza inmediatamente para responsividad
3. **Operación** se envía al servidor con metadatos (usuario, timestamp)
4. **Servidor** recibe la operación y la retransmite a todos los demás clientes
5. **Usuario B** recibe la operación y actualiza su estado local
6. **UI** se actualiza automáticamente mostrando los cambios

## 🎨 Beneficios

- ✅ **Tiempo real**: Cambios se propagan instantáneamente
- ✅ **Sin conflictos**: Cada operación tiene ID único y timestamp
- ✅ **Responsivo**: Estado local se actualiza inmediatamente
- ✅ **Escalable**: Fácil agregar nuevas operaciones
- ✅ **Type-safe**: Interfaces TypeScript para todas las operaciones

## 🚀 Próximos Pasos

Para completar la implementación, puedes:

1. **Agregar más operaciones**: eliminar elementos, editar propiedades, etc.
2. **Implementar undo/redo**: almacenar historial de operaciones
3. **Agregar indicadores visuales**: mostrar qué usuario hizo qué cambio
4. **Implementar locks**: prevenir conflictos en edición simultánea
5. **Agregar persistencia**: guardar diagramas en base de datos

## 🧪 Cómo Probar

1. Abre dos navegadores en `http://localhost:5173`
2. Agrega elementos en uno de ellos
3. Verifica que aparezcan automáticamente en el otro
4. Mueve elementos y observa la sincronización
5. Revisa la consola para ver las operaciones enviadas/recibidas</content>
<parameter name="filePath">/home/bquiroga/Documents/dev/sw1/examen/joint-js/SYNC_README.md