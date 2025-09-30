// src/utils/operationTracker.ts
export class OperationTracker {
  private static clientId = Math.random().toString(36).substr(2, 9);
  private static sequenceNumber = 0;

  static createOperation(
    op: "add" | "remove" | "replace" | "move" | "copy" | "test",
    path: string,
    value?: unknown,
    from?: string,
    description?: string
  ): JsonPatchOperation {
    return {
      op,
      path,
      value,
      from,
      description: description || "",
      clientId: this.clientId,
      timestamp: Date.now(),
      sequenceNumber: ++this.sequenceNumber,
    };
  }

  static getClientId(): string {
    return this.clientId;
  }
}

// Re-export para compatibilidad
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
