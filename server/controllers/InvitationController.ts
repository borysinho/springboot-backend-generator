import { Request, Response } from "express";
import { InvitationModel } from "../models/InvitationModel.js";
import { emailService } from "../services/EmailService.js";
import { databaseService } from "../services/DatabaseService.js";

const invitationModel = new InvitationModel();

export class InvitationController {
  // Crear una nueva invitación
  async createInvitation(req: Request, res: Response) {
    try {
      const { diagramId, creatorId, inviteeEmail, message, expiresAt } =
        req.body;

      if (!diagramId || !creatorId || !inviteeEmail || !expiresAt) {
        return res.status(400).json({
          error:
            "Faltan campos requeridos: diagramId, creatorId, inviteeEmail, expiresAt",
        });
      }

      const invitation = await invitationModel.create({
        diagramId,
        creatorId,
        inviteeEmail,
        message,
        expiresAt: new Date(expiresAt),
      });

      // Obtener información del creador y diagrama para el correo
      const creator = await databaseService.findUserById(creatorId);
      const diagrams = await databaseService.findDiagramSnapshotByDiagramId(
        diagramId
      );
      const diagram = diagrams.length > 0 ? diagrams[0] : null;

      console.log("Creator encontrado:", creator ? creator.name : "null");
      console.log("Diagram encontrado:", diagram ? diagram.name : "null");

      if (creator && diagram) {
        console.log("Enviando email de invitación...");
        // Enviar correo de invitación de forma asíncrona
        emailService
          .sendInvitationEmail(invitation.inviteeEmail, {
            creatorName: creator.name,
            diagramName: diagram.name,
            invitationId: invitation.id,
            expiresAt: invitation.expiresAt,
            message: invitation.message,
          })
          .catch((error) => {
            console.error("Error al enviar correo de invitación:", error);
          });
      }

      res.status(201).json(invitation);
    } catch (error) {
      console.error("Error creating invitation:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  // Obtener invitaciones por usuario
  async getInvitationsByUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({ error: "userId es requerido" });
      }

      const invitations = await invitationModel.findByCreatorId(userId);
      res.json(invitations);
    } catch (error) {
      console.error("Error getting invitations by user:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  // Obtener invitación por ID
  async getInvitationById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const invitation = await invitationModel.findById(id);
      if (!invitation) {
        return res.status(404).json({ error: "Invitación no encontrada" });
      }

      res.json(invitation);
    } catch (error) {
      console.error("Error getting invitation by id:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  // Aceptar invitación
  async acceptInvitation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "userId es requerido" });
      }

      const invitation = await invitationModel.accept(id, userId);
      if (!invitation) {
        return res
          .status(404)
          .json({ error: "Invitación no encontrada o no se puede aceptar" });
      }

      // Enviar correo de confirmación al creador
      const creator = await databaseService.findUserById(invitation.creatorId);
      const invitee = await databaseService.findUserById(userId);
      const diagrams = await databaseService.findDiagramSnapshotByDiagramId(
        invitation.diagramId
      );
      const diagram = diagrams.length > 0 ? diagrams[0] : null;

      console.log(
        "Enviando email de aceptación - Creator:",
        creator ? creator.name : "null"
      );
      console.log(
        "Enviando email de aceptación - Invitee:",
        invitee ? invitee.name : "null"
      );
      console.log(
        "Enviando email de aceptación - Diagram:",
        diagram ? diagram.name : "null"
      );

      if (creator && invitee && diagram) {
        console.log("Enviando email de confirmación de aceptación...");
        emailService
          .sendInvitationAcceptedEmail(creator.email, {
            inviteeName: invitee.name,
            diagramName: diagram.name,
          })
          .catch((error) => {
            console.error("Error al enviar correo de aceptación:", error);
          });
      }

      res.json(invitation);
    } catch (error) {
      console.error("Error accepting invitation:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  // Rechazar invitación
  async rejectInvitation(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const invitation = await invitationModel.reject(id);
      if (!invitation) {
        return res
          .status(404)
          .json({ error: "Invitación no encontrada o no se puede rechazar" });
      }

      // Enviar correo de confirmación al creador
      const creator = await databaseService.findUserById(invitation.creatorId);
      const diagrams = await databaseService.findDiagramSnapshotByDiagramId(
        invitation.diagramId
      );
      const diagram = diagrams.length > 0 ? diagrams[0] : null;

      console.log(
        "Enviando email de rechazo - Creator:",
        creator ? creator.name : "null"
      );
      console.log(
        "Enviando email de rechazo - Diagram:",
        diagram ? diagram.name : "null"
      );

      if (creator && diagram) {
        console.log("Enviando email de notificación de rechazo...");
        emailService
          .sendInvitationRejectedEmail(creator.email, {
            inviteeName: invitation.inviteeEmail.split("@")[0], // Nombre aproximado del email
            diagramName: diagram.name,
          })
          .catch((error) => {
            console.error("Error al enviar correo de rechazo:", error);
          });
      }

      res.json(invitation);
    } catch (error) {
      console.error("Error rejecting invitation:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  // Eliminar invitación
  async deleteInvitation(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const success = await invitationModel.delete(id);
      if (!success) {
        return res.status(404).json({ error: "Invitación no encontrada" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting invitation:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  // Obtener todas las invitaciones (para admin/debugging)
  async getAllInvitations(req: Request, res: Response) {
    try {
      const invitations = await invitationModel.getAll();
      res.json(invitations);
    } catch (error) {
      console.error("Error getting all invitations:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
}
