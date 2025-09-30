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
  private invitations: Map<string, Invitation> = new Map();

  constructor() {
    // Inicializar con algunas invitaciones de ejemplo si es necesario
  }

  // Crear una nueva invitación
  create(
    invitationData: Omit<
      Invitation,
      "id" | "createdAt" | "updatedAt" | "status"
    >
  ): Invitation {
    const id = `invitation_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const now = new Date();

    const invitation: Invitation = {
      id,
      ...invitationData,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    this.invitations.set(id, invitation);
    return invitation;
  }

  // Buscar invitación por ID
  findById(id: string): Invitation | undefined {
    return this.invitations.get(id);
  }

  // Buscar invitaciones por diagrama
  findByDiagramId(diagramId: string): Invitation[] {
    return Array.from(this.invitations.values()).filter(
      (inv) => inv.diagramId === diagramId
    );
  }

  // Buscar invitaciones por creador
  findByCreatorId(creatorId: string): Invitation[] {
    return Array.from(this.invitations.values()).filter(
      (inv) => inv.creatorId === creatorId
    );
  }

  // Buscar invitaciones por email del invitado
  findByInviteeEmail(email: string): Invitation[] {
    return Array.from(this.invitations.values()).filter(
      (inv) => inv.inviteeEmail === email
    );
  }

  // Buscar invitaciones pendientes para un email
  findPendingByEmail(email: string): Invitation[] {
    return Array.from(this.invitations.values()).filter(
      (inv) => inv.inviteeEmail === email && inv.status === "pending"
    );
  }

  // Aceptar invitación
  accept(id: string, userId: string): Invitation | undefined {
    const invitation = this.invitations.get(id);
    if (!invitation || invitation.status !== "pending") return undefined;

    const now = new Date();
    const updatedInvitation = {
      ...invitation,
      status: "accepted" as InvitationStatus,
      inviteeId: userId,
      acceptedAt: now,
      updatedAt: now,
    };

    this.invitations.set(id, updatedInvitation);
    return updatedInvitation;
  }

  // Rechazar invitación
  reject(id: string): Invitation | undefined {
    const invitation = this.invitations.get(id);
    if (!invitation || invitation.status !== "pending") return undefined;

    const now = new Date();
    const updatedInvitation = {
      ...invitation,
      status: "rejected" as InvitationStatus,
      rejectedAt: now,
      updatedAt: now,
    };

    this.invitations.set(id, updatedInvitation);
    return updatedInvitation;
  }

  // Marcar como expirada
  expire(id: string): Invitation | undefined {
    const invitation = this.invitations.get(id);
    if (!invitation || invitation.status !== "pending") return undefined;

    const updatedInvitation = {
      ...invitation,
      status: "expired" as InvitationStatus,
      updatedAt: new Date(),
    };

    this.invitations.set(id, updatedInvitation);
    return updatedInvitation;
  }

  // Actualizar invitación
  update(
    id: string,
    updates: Partial<Omit<Invitation, "id" | "createdAt">>
  ): Invitation | undefined {
    const invitation = this.invitations.get(id);
    if (!invitation) return undefined;

    const updatedInvitation = {
      ...invitation,
      ...updates,
      updatedAt: new Date(),
    };

    this.invitations.set(id, updatedInvitation);
    return updatedInvitation;
  }

  // Eliminar invitación
  delete(id: string): boolean {
    return this.invitations.delete(id);
  }

  // Obtener todas las invitaciones
  getAll(): Invitation[] {
    return Array.from(this.invitations.values());
  }

  // Limpiar invitaciones expiradas
  cleanupExpired(): number {
    const now = new Date();
    let cleaned = 0;

    for (const [id, invitation] of this.invitations) {
      if (invitation.status === "pending" && invitation.expiresAt < now) {
        this.expire(id);
        cleaned++;
      }
    }

    return cleaned;
  }
}
