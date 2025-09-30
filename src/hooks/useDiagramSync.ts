import { useState, useCallback, useEffect, useRef } from "react";
import type { CustomElement, UMLRelationship } from "../types";
import { Socket } from "socket.io-client";
import {
  OperationTracker,
  type JsonPatchOperation,
} from "../utils/operationTracker";

// Re-export para compatibilidad
export type { JsonPatchOperation };

export function useDiagramSync(
  socket?: Socket,
  diagramId: string = "default",
  onNotification?: (
    type: "success" | "error" | "warning" | "info",
    title: string,
    message: string
  ) => void
) {
  const [_connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("disconnected");
  const [_activeUsers, setActiveUsers] = useState<string[]>([]);
  const [operations, setOperations] = useState<JsonPatchOperation[]>([]);

  // Estado para almacenar callbacks de operaciones pendientes
  const operationCallbacks = useRef<
    Map<
      number,
      {
        onConfirmed?: (operation: JsonPatchOperation) => void;
        onRejected?: (operation: JsonPatchOperation, reason: string) => void;
      }
    >
  >(new Map());

  // Conectar al diagrama cuando el socket esté disponible
  useEffect(() => {
    if (socket && socket.connected) {
      socket.emit("diagram:join", diagramId);
      setConnectionStatus("connected");

      // Escuchar eventos del servidor
      const handleOperationConfirmed = (data: {
        operation: JsonPatchOperation;
      }) => {
        console.log("Operación confirmada:", data.operation);

        // Ejecutar callback si existe
        const callbacks = operationCallbacks.current.get(
          data.operation.sequenceNumber
        );
        if (callbacks?.onConfirmed) {
          callbacks.onConfirmed(data.operation);
          operationCallbacks.current.delete(data.operation.sequenceNumber);
        }
      };

      const handleOperationRejected = (data: {
        operation: JsonPatchOperation;
        reason: string;
      }) => {
        console.error("Operación rechazada:", data.reason);
        if (onNotification) {
          onNotification("error", "Operación Rechazada", data.reason);
        }

        // Ejecutar callback si existe
        const callbacks = operationCallbacks.current.get(
          data.operation.sequenceNumber
        );
        if (callbacks?.onRejected) {
          callbacks.onRejected(data.operation, data.reason);
          operationCallbacks.current.delete(data.operation.sequenceNumber);
        }
      };

      const handleOperationConflict = (data: {
        operation: JsonPatchOperation;
        conflicts: unknown[];
      }) => {
        console.warn("Conflicto detectado:", data.conflicts);
        if (onNotification) {
          onNotification(
            "warning",
            "Conflicto Detectado",
            "Se detectó un conflicto en la operación. Los cambios pueden no haberse aplicado correctamente."
          );
        }
      };

      const handleRemoteOperation = (data: {
        operation: JsonPatchOperation;
      }) => {
        // Aplicar operación remota al estado local
        setOperations((prev) => [data.operation, ...prev.slice(0, 19)]);
      };

      const handleUserJoined = (data: { userId: string }) => {
        setActiveUsers((prev) => [...prev, data.userId]);
      };

      const handleUserLeft = (data: { userId: string }) => {
        setActiveUsers((prev) => prev.filter((id) => id !== data.userId));
      };

      socket.on("operation:confirmed", handleOperationConfirmed);
      socket.on("operation:rejected", handleOperationRejected);
      socket.on("operation:conflict", handleOperationConflict);
      socket.on("diagram:operation", handleRemoteOperation);
      socket.on("user:joined", handleUserJoined);
      socket.on("user:left", handleUserLeft);

      return () => {
        socket.off("operation:confirmed", handleOperationConfirmed);
        socket.off("operation:rejected", handleOperationRejected);
        socket.off("operation:conflict", handleOperationConflict);
        socket.off("diagram:operation", handleRemoteOperation);
        socket.off("user:joined", handleUserJoined);
        socket.off("user:left", handleUserLeft);
      };
    } else {
      setConnectionStatus("disconnected");
    }
  }, [socket, diagramId, onNotification]);

  const addOperation = useCallback(
    (
      operation: Omit<
        JsonPatchOperation,
        "clientId" | "timestamp" | "sequenceNumber"
      >
    ) => {
      const newOperation = OperationTracker.createOperation(
        operation.op,
        operation.path,
        operation.value,
        operation.from,
        operation.description
      );
      setOperations((prev) => [newOperation, ...prev.slice(0, 19)]); // Mantener últimas 20 operaciones

      // Enviar la operación al servidor si hay socket disponible
      if (socket && socket.connected) {
        socket.emit("diagram:operation", newOperation);
      }
    },
    [socket]
  );

  const addOperationWithCallbacks = useCallback(
    (
      operation: Omit<
        JsonPatchOperation,
        "clientId" | "timestamp" | "sequenceNumber"
      >,
      onConfirmed?: (operation: JsonPatchOperation) => void,
      onRejected?: (operation: JsonPatchOperation, reason: string) => void
    ) => {
      const newOperation = OperationTracker.createOperation(
        operation.op,
        operation.path,
        operation.value,
        operation.from,
        operation.description
      );
      setOperations((prev) => [newOperation, ...prev.slice(0, 19)]); // Mantener últimas 20 operaciones

      // Almacenar callbacks para esta operación
      if (onConfirmed || onRejected) {
        operationCallbacks.current.set(newOperation.sequenceNumber, {
          onConfirmed,
          onRejected,
        });
      }

      // Enviar la operación al servidor si hay socket disponible
      if (socket && socket.connected) {
        socket.emit("diagram:operation", newOperation);
      }

      return newOperation;
    },
    [socket]
  );

  const trackElementAddWithCallbacks = useCallback(
    (
      element: CustomElement,
      onConfirmed?: (operation: JsonPatchOperation) => void,
      onRejected?: (operation: JsonPatchOperation, reason: string) => void
    ) => {
      addOperationWithCallbacks(
        {
          op: "add",
          path: "/elements/-",
          value: element,
          description: `Elemento ${element.elementType} "${element.className}" agregado`,
        },
        onConfirmed,
        onRejected
      );
    },
    [addOperationWithCallbacks]
  );

  const trackElementRemove = useCallback(
    (elementId: string, elementName: string) => {
      addOperation({
        op: "remove",
        path: `/elements/${elementId}`,
        description: `Elemento "${elementName}" eliminado`,
      });
    },
    [addOperation]
  );

  const trackElementUpdate = useCallback(
    (
      elementId: string,
      elementName: string,
      changes: Partial<CustomElement>
    ) => {
      // Para updates complejos, registramos el cambio más significativo
      if (changes.className) {
        addOperation({
          op: "replace",
          path: `/elements/${elementId}/className`,
          value: changes.className,
          description: `Nombre de "${elementName}" cambiado a "${changes.className}"`,
        });
      }
      if (changes.x !== undefined || changes.y !== undefined) {
        addOperation({
          op: "replace",
          path: `/elements/${elementId}/position`,
          value: { x: changes.x, y: changes.y },
          description: `Elemento "${elementName}" movido`,
        });
      }
      if (changes.attributes) {
        addOperation({
          op: "replace",
          path: `/elements/${elementId}/attributes`,
          value: changes.attributes,
          description: `Atributos de "${elementName}" modificados`,
        });
      }
      if (changes.methods) {
        addOperation({
          op: "replace",
          path: `/elements/${elementId}/methods`,
          value: changes.methods,
          description: `Métodos de "${elementName}" modificados`,
        });
      }
      if (changes.parentPackageId !== undefined) {
        const packageAction = changes.parentPackageId
          ? `asignado al paquete "${changes.parentPackageId}"`
          : "removido del paquete";
        addOperation({
          op: "replace",
          path: `/elements/${elementId}/parentPackageId`,
          value: changes.parentPackageId,
          description: `Elemento "${elementName}" ${packageAction}`,
        });
      }
      if (changes.stereotype !== undefined) {
        const stereotypeAction = changes.stereotype
          ? `cambiado a "${changes.stereotype}"`
          : "removido";
        addOperation({
          op: "replace",
          path: `/elements/${elementId}/stereotype`,
          value: changes.stereotype,
          description: `Estereotipo de "${elementName}" ${stereotypeAction}`,
        });
      }
      if (changes.containedElements) {
        addOperation({
          op: "replace",
          path: `/elements/${elementId}/containedElements`,
          value: changes.containedElements,
          description: `Elementos contenidos de "${elementName}" modificados`,
        });
      }
      if (changes.width !== undefined || changes.height !== undefined) {
        addOperation({
          op: "replace",
          path: `/elements/${elementId}/dimensions`,
          value: { width: changes.width, height: changes.height },
          description: `Dimensiones de "${elementName}" modificadas`,
        });
      }
    },
    [addOperation]
  );

  const trackRelationshipAdd = useCallback(
    (relationship: UMLRelationship) => {
      addOperation({
        op: "add",
        path: "/relationships/-",
        value: relationship,
        description: `Relación ${relationship.relationship} creada`,
      });
    },
    [addOperation]
  );

  const trackRelationshipRemove = useCallback(
    (relationshipId: string) => {
      addOperation({
        op: "remove",
        path: `/relationships/${relationshipId}`,
        description: `Relación eliminada`,
      });
    },
    [addOperation]
  );

  const trackRelationshipUpdate = useCallback(
    (relationshipId: string, changes: Partial<UMLRelationship>) => {
      // Para updates de relaciones, registramos el cambio más significativo
      if (changes.relationship) {
        addOperation({
          op: "replace",
          path: `/relationships/${relationshipId}/relationship`,
          value: changes.relationship,
          description: `Tipo de relación cambiado a "${changes.relationship}"`,
        });
      }
    },
    [addOperation]
  );

  const clearOperations = useCallback(() => {
    setOperations([]);
  }, []);

  return {
    operations,
    trackElementAddWithCallbacks,
    trackElementRemove,
    trackElementUpdate,
    trackRelationshipAdd,
    trackRelationshipRemove,
    trackRelationshipUpdate,
    clearOperations,
  };
}
