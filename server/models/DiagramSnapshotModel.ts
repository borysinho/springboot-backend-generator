import { DiagramState } from "./DiagramModel.js";

export interface DiagramSnapshot {
  id: string;
  diagramId: string; // ID único del diagrama
  name: string; // Nombre del diagrama
  description?: string; // Descripción opcional
  creatorId: string; // ID del usuario creador
  collaborators: string[]; // IDs de usuarios colaboradores
  state: DiagramState; // Estado completo del diagrama en JSON
  version: number; // Versión del snapshot
  isPublic: boolean; // Si el diagrama es público
  tags: string[]; // Tags para categorización
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date; // Última actividad en el diagrama
  thumbnail?: string; // URL o data de miniatura (opcional)
}

export class DiagramSnapshotModel {
  private snapshots: Map<string, DiagramSnapshot> = new Map();
  private snapshotsByDiagram: Map<string, DiagramSnapshot[]> = new Map();

  constructor() {
    // Inicializar con algunos snapshots de ejemplo si es necesario
  }

  // Crear un nuevo snapshot
  create(
    snapshotData: Omit<
      DiagramSnapshot,
      "id" | "version" | "createdAt" | "updatedAt" | "lastActivityAt"
    >
  ): DiagramSnapshot {
    const id = `snapshot_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const now = new Date();

    const snapshot: DiagramSnapshot = {
      id,
      ...snapshotData,
      version: 1,
      createdAt: now,
      updatedAt: now,
      lastActivityAt: now,
    };

    this.snapshots.set(id, snapshot);

    // Indexar por diagramId
    if (!this.snapshotsByDiagram.has(snapshotData.diagramId)) {
      this.snapshotsByDiagram.set(snapshotData.diagramId, []);
    }
    this.snapshotsByDiagram.get(snapshotData.diagramId)!.push(snapshot);

    return snapshot;
  }

  // Crear nueva versión de un diagrama existente
  createVersion(
    diagramId: string,
    state: DiagramState
  ): DiagramSnapshot | undefined {
    const latestSnapshot = this.getLatestByDiagramId(diagramId);
    if (!latestSnapshot) return undefined;

    const newVersion = latestSnapshot.version + 1;
    const now = new Date();

    const updatedSnapshot: DiagramSnapshot = {
      ...latestSnapshot,
      state,
      version: newVersion,
      updatedAt: now,
      lastActivityAt: now,
    };

    // Actualizar el snapshot existente
    this.snapshots.set(latestSnapshot.id, updatedSnapshot);

    // Actualizar el índice
    const diagramSnapshots = this.snapshotsByDiagram.get(diagramId) || [];
    const index = diagramSnapshots.findIndex((s) => s.id === latestSnapshot.id);
    if (index !== -1) {
      diagramSnapshots[index] = updatedSnapshot;
    }

    return updatedSnapshot;
  }

  // Buscar snapshot por ID
  findById(id: string): DiagramSnapshot | undefined {
    return this.snapshots.get(id);
  }

  // Obtener el snapshot más reciente de un diagrama
  getLatestByDiagramId(diagramId: string): DiagramSnapshot | undefined {
    const snapshots = this.snapshotsByDiagram.get(diagramId);
    if (!snapshots || snapshots.length === 0) return undefined;

    return snapshots.reduce((latest, current) =>
      current.version > latest.version ? current : latest
    );
  }

  // Obtener todos los snapshots de un diagrama
  getAllByDiagramId(diagramId: string): DiagramSnapshot[] {
    return this.snapshotsByDiagram.get(diagramId) || [];
  }

  // Buscar diagramas por creador
  findByCreatorId(creatorId: string): DiagramSnapshot[] {
    return Array.from(this.snapshots.values()).filter(
      (snapshot) => snapshot.creatorId === creatorId
    );
  }

  // Buscar diagramas donde el usuario es colaborador
  findByCollaboratorId(collaboratorId: string): DiagramSnapshot[] {
    return Array.from(this.snapshots.values()).filter((snapshot) =>
      snapshot.collaborators.includes(collaboratorId)
    );
  }

  // Buscar diagramas públicos
  findPublic(): DiagramSnapshot[] {
    return Array.from(this.snapshots.values()).filter(
      (snapshot) => snapshot.isPublic
    );
  }

  // Buscar por tags
  findByTag(tag: string): DiagramSnapshot[] {
    return Array.from(this.snapshots.values()).filter((snapshot) =>
      snapshot.tags.includes(tag)
    );
  }

  // Buscar por nombre (búsqueda parcial)
  searchByName(name: string): DiagramSnapshot[] {
    const searchTerm = name.toLowerCase();
    return Array.from(this.snapshots.values()).filter((snapshot) =>
      snapshot.name.toLowerCase().includes(searchTerm)
    );
  }

  // Actualizar metadatos del diagrama
  updateMetadata(
    id: string,
    updates: Partial<
      Omit<
        DiagramSnapshot,
        "id" | "diagramId" | "state" | "version" | "createdAt" | "updatedAt"
      >
    >
  ): DiagramSnapshot | undefined {
    const snapshot = this.snapshots.get(id);
    if (!snapshot) return undefined;

    const updatedSnapshot = {
      ...snapshot,
      ...updates,
      updatedAt: new Date(),
    };

    this.snapshots.set(id, updatedSnapshot);
    return updatedSnapshot;
  }

  // Agregar colaborador
  addCollaborator(diagramId: string, collaboratorId: string): boolean {
    const latestSnapshot = this.getLatestByDiagramId(diagramId);
    if (!latestSnapshot) return false;

    if (!latestSnapshot.collaborators.includes(collaboratorId)) {
      latestSnapshot.collaborators.push(collaboratorId);
      latestSnapshot.updatedAt = new Date();
      this.snapshots.set(latestSnapshot.id, latestSnapshot);
      return true;
    }

    return false;
  }

  // Remover colaborador
  removeCollaborator(diagramId: string, collaboratorId: string): boolean {
    const latestSnapshot = this.getLatestByDiagramId(diagramId);
    if (!latestSnapshot) return false;

    const index = latestSnapshot.collaborators.indexOf(collaboratorId);
    if (index !== -1) {
      latestSnapshot.collaborators.splice(index, 1);
      latestSnapshot.updatedAt = new Date();
      this.snapshots.set(latestSnapshot.id, latestSnapshot);
      return true;
    }

    return false;
  }

  // Actualizar última actividad
  updateLastActivity(diagramId: string): boolean {
    const latestSnapshot = this.getLatestByDiagramId(diagramId);
    if (!latestSnapshot) return false;

    latestSnapshot.lastActivityAt = new Date();
    this.snapshots.set(latestSnapshot.id, latestSnapshot);
    return true;
  }

  // Eliminar diagrama
  delete(diagramId: string): boolean {
    const snapshots = this.snapshotsByDiagram.get(diagramId);
    if (!snapshots) return false;

    // Eliminar todos los snapshots del diagrama
    snapshots.forEach((snapshot) => {
      this.snapshots.delete(snapshot.id);
    });

    this.snapshotsByDiagram.delete(diagramId);
    return true;
  }

  // Obtener estadísticas
  getStats() {
    const totalDiagrams = this.snapshotsByDiagram.size;
    const totalSnapshots = this.snapshots.size;
    const publicDiagrams = Array.from(this.snapshots.values()).filter(
      (s) => s.isPublic
    ).length;

    return {
      totalDiagrams,
      totalSnapshots,
      publicDiagrams,
      averageVersionsPerDiagram:
        totalDiagrams > 0 ? totalSnapshots / totalDiagrams : 0,
    };
  }

  // Obtener todos los snapshots
  getAll(): DiagramSnapshot[] {
    return Array.from(this.snapshots.values());
  }
}
