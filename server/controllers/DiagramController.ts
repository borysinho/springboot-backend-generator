import { Socket } from "socket.io";

export interface JsonPatchOperation {
  op: "add" | "remove" | "replace" | "move" | "copy" | "test";
  path: string;
  value?: unknown;
  from?: string;
  timestamp: Date;
  description: string;
}

export class DiagramController {
  constructor(private io: any) {
    this.setupSocketHandlers();
  }

  private setupSocketHandlers(): void {
    this.io.on("connection", (socket: Socket) => {
      console.log(`🔗 Nueva conexión en controlador: ${socket.id}`);

      // Handler para operaciones JSON Patch
      socket.on("json_patch_operation", (operation: JsonPatchOperation) => {
        console.log(`📝 Operación JSON Patch recibida:`);
        console.log(`   Operación: ${operation.op}`);
        console.log(`   Ruta: ${operation.path}`);
        console.log(`   Descripción: ${operation.description}`);
        console.log(`   Timestamp: ${operation.timestamp}`);
        if (operation.value !== undefined) {
          console.log(`   Valor:`, operation.value);
        }
        if (operation.from) {
          console.log(`   Desde: ${operation.from}`);
        }
        console.log(`   ──────────────────────────────────`);
      });
    });
  }
}
