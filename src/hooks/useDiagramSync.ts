import { useState, useCallback } from "react";
import type { CustomElement, UMLRelationship } from "../types";
import { Socket } from "socket.io-client";

export interface JsonPatchOperation {
  op: "add" | "remove" | "replace" | "move" | "copy" | "test";
  path: string;
  value?: unknown;
  from?: string;
  timestamp: Date;
  description: string;
}

export function useDiagramSync(socket?: Socket) {
  const [operations, setOperations] = useState<JsonPatchOperation[]>([]);

  const addOperation = useCallback(
    (operation: Omit<JsonPatchOperation, "timestamp">) => {
      const newOperation: JsonPatchOperation = {
        ...operation,
        timestamp: new Date(),
      };
      setOperations((prev) => [newOperation, ...prev.slice(0, 19)]); // Mantener últimas 20 operaciones

      // Enviar la operación al servidor si hay socket disponible
      if (socket && socket.connected) {
        socket.emit("json_patch_operation", newOperation);
      }
    },
    [socket]
  );

  const trackElementAdd = useCallback(
    (element: CustomElement) => {
      addOperation({
        op: "add",
        path: "/elements/-",
        value: element,
        description: `Elemento ${element.elementType} "${element.className}" agregado`,
      });
    },
    [addOperation]
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
    trackElementAdd,
    trackElementRemove,
    trackElementUpdate,
    trackRelationshipAdd,
    trackRelationshipRemove,
    trackRelationshipUpdate,
    clearOperations,
  };
}
