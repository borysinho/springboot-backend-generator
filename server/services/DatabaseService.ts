import { PrismaClient } from "../../src/generated/prisma/index.js";
import { Prisma } from "../../src/generated/prisma/index.js";
import { User } from "../models/UserModel";
import { DiagramSnapshot } from "../models/DiagramSnapshotModel";
import { Invitation, InvitationStatus } from "../models/InvitationModel";
import { DiagramState } from "../models/DiagramModel";

export class DatabaseService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      log: ["query", "info", "warn", "error"],
    });
  }

  async checkDiagramNameExists(
    name: string,
    creatorId: string,
    excludeDiagramId?: string
  ): Promise<boolean> {
    const whereCondition: any = { name, creatorId };
    if (excludeDiagramId) whereCondition.diagramId = { not: excludeDiagramId };

    const existing = await this.prisma.diagramSnapshot.findFirst({
      where: whereCondition,
    });
    return existing !== null;
  }

  async createInvitation(data: any): Promise<any> {
    return await this.prisma.invitation.create({ data });
  }

  async findInvitationsByUser(userId: string): Promise<any[]> {
    return await this.prisma.invitation.findMany({
      where: { OR: [{ creatorId: userId }, { inviteeId: userId }] },
    });
  }

  async updateInvitationStatus(
    id: string,
    status: string,
    userId: string
  ): Promise<any> {
    const updateData: any = { status, updatedAt: new Date() };
    if (status === "accepted") {
      updateData.acceptedAt = new Date();
      updateData.inviteeId = userId;
    } else if (status === "rejected") {
      updateData.rejectedAt = new Date();
    }
    return await this.prisma.invitation.update({
      where: { id },
      data: updateData,
    });
  }

  async findInvitationById(id: string): Promise<any | null> {
    return await this.prisma.invitation.findUnique({ where: { id } });
  }

  async findInvitationsByDiagram(diagramId: string): Promise<any[]> {
    return await this.prisma.invitation.findMany({ where: { diagramId } });
  }

  async findInvitationsByEmail(email: string): Promise<any[]> {
    return await this.prisma.invitation.findMany({
      where: { inviteeEmail: email },
    });
  }

  async updateInvitation(id: string, updates: any): Promise<any> {
    return await this.prisma.invitation.update({
      where: { id },
      data: updates,
    });
  }

  async getAllInvitations(): Promise<any[]> {
    return await this.prisma.invitation.findMany();
  }

  async createDiagramSnapshot(data: any): Promise<any> {
    return await this.prisma.diagramSnapshot.create({ data });
  }

  async findDiagramSnapshotById(id: string): Promise<any | null> {
    return await this.prisma.diagramSnapshot.findUnique({ where: { id } });
  }

  async findDiagramSnapshotByDiagramId(diagramId: string): Promise<any[]> {
    return await this.prisma.diagramSnapshot.findMany({ where: { diagramId } });
  }

  async deleteInvitation(id: string): Promise<boolean> {
    try {
      await this.prisma.invitation.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async createUser(data: any): Promise<any> {
    return await this.prisma.user.create({ data });
  }

  async findUserById(id: string): Promise<any | null> {
    return await this.prisma.user.findUnique({ where: { id } });
  }

  async findUserByEmail(email: string): Promise<any | null> {
    return await this.prisma.user.findUnique({ where: { email } });
  }

  async updateUser(id: string, updates: any): Promise<any> {
    return await this.prisma.user.update({ where: { id }, data: updates });
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      await this.prisma.user.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}

export const databaseService = new DatabaseService();
