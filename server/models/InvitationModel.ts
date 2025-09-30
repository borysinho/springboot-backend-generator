import { databaseService } from "../services/DatabaseService.js";

export type InvitationStatus = "pending" | "accepted" | "rejected" | "expired";

export interface Invitation {
  id: string;
  diagramId: string;
  creatorId: string; // Usuario que crea la invitación
  inviteeEmail: string; // Email del usuario invitado
  inviteeId?: string; // ID del usuario invitado (si existe en el sistema)
  status: InvitationStatus;
  message?: string; // Mensaje opcional del creador
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date; // Fecha de expiración de la invitación
  acceptedAt?: Date; // Fecha cuando fue aceptada
  rejectedAt?: Date; // Fecha cuando fue rechazada
}

export class InvitationModel {
  constructor() {
    // El servicio de base de datos maneja la persistencia
  }

  // Crear una nueva invitación
  async create(
    invitationData: Omit<
      Invitation,
      "id" | "createdAt" | "updatedAt" | "status"
    >
  ): Promise<Invitation> {
    return await databaseService.createInvitation(invitationData);
  }

  // Buscar invitación por ID
  async findById(id: string): Promise<Invitation | null> {
    return await databaseService.findInvitationById(id);
  }

  // Buscar invitaciones por diagrama
  async findByDiagramId(diagramId: string): Promise<Invitation[]> {
    return await databaseService.findInvitationsByDiagram(diagramId);
  }

  // Buscar invitaciones por creador
  async findByCreatorId(creatorId: string): Promise<Invitation[]> {
    const allInvitations = await databaseService.findInvitationsByUser(
      creatorId
    );
    return allInvitations.filter((inv) => inv.creatorId === creatorId);
  }

  // Buscar invitaciones por email del invitado
  async findByInviteeEmail(email: string): Promise<Invitation[]> {
    return await databaseService.findInvitationsByEmail(email);
  }

  // Buscar invitaciones pendientes para un email
  async findPendingByEmail(email: string): Promise<Invitation[]> {
    const allInvitations = await databaseService.findInvitationsByEmail(email);
    return allInvitations.filter((inv) => inv.status === "pending");
  }

  // Aceptar invitación
  async accept(id: string, userId: string): Promise<Invitation | null> {
    const invitation = await databaseService.findInvitationById(id);
    if (!invitation || invitation.status !== "pending") return null;

    return await databaseService.updateInvitationStatus(id, "accepted", userId);
  }

  // Rechazar invitación
  async reject(id: string): Promise<Invitation | null> {
    const invitation = await databaseService.findInvitationById(id);
    if (!invitation || invitation.status !== "pending") return null;

    return await databaseService.updateInvitationStatus(
      id,
      "rejected",
      undefined,
      new Date()
    );
  }

  // Marcar como expirada
  async expire(id: string): Promise<Invitation | null> {
    const invitation = await databaseService.findInvitationById(id);
    if (!invitation || invitation.status !== "pending") return null;

    return await databaseService.updateInvitationStatus(id, "expired");
  }

  // Actualizar invitación
  async update(
    id: string,
    updates: Partial<Omit<Invitation, "id" | "createdAt">>
  ): Promise<Invitation | null> {
    return await databaseService.updateInvitation(id, updates);
  }

  // Eliminar invitación
  async delete(id: string): Promise<boolean> {
    return await databaseService.deleteInvitation(id);
  }

  // Obtener todas las invitaciones
  async getAll(): Promise<Invitation[]> {
    return await databaseService.getAllInvitations();
  }

  // Limpiar invitaciones expiradas
  async cleanupExpired(): Promise<number> {
    const allInvitations = await databaseService.getAllInvitations();
    const now = new Date();
    let cleaned = 0;

    for (const invitation of allInvitations) {
      if (invitation.status === "pending" && invitation.expiresAt < now) {
        await this.expire(invitation.id);
        cleaned++;
      }
    }

    return cleaned;
  }
}
