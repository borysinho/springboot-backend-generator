import { Request, Response } from "express";
import { DiagramSnapshotModel } from "../models/DiagramSnapshotModel.js";

const diagramSnapshotModel = new DiagramSnapshotModel();

export class DiagramSnapshotController {
  // Verificar si un nombre de diagrama ya existe para un usuario
  async checkDiagramNameExists(req: Request, res: Response) {
    try {
      const { name, creatorId, excludeDiagramId } = req.query;

      if (!name || !creatorId) {
        return res.status(400).json({
          error: "Faltan campos requeridos: name, creatorId",
        });
      }

      const exists = await diagramSnapshotModel.checkNameExistsForUser(
        name as string,
        creatorId as string,
        excludeDiagramId as string
      );

      res.json({ exists });
    } catch (error) {
      console.error("Error checking diagram name:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  // Obtener diagramas por usuario
  async getDiagramsByUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({ error: "userId es requerido" });
      }

      const diagrams = await diagramSnapshotModel.findByCreatorId(userId);
      res.json(diagrams);
    } catch (error) {
      console.error("Error getting diagrams by user:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  // Crear un nuevo diagrama
  async createDiagram(req: Request, res: Response) {
    try {
      const {
        diagramId,
        name,
        description,
        creatorId,
        collaborators,
        state,
        isPublic,
        tags,
        thumbnail,
      } = req.body;

      if (!diagramId || !name || !creatorId || !state) {
        return res.status(400).json({
          error: "Faltan campos requeridos: diagramId, name, creatorId, state",
        });
      }

      // Verificar que el nombre no exista para este usuario
      const nameExists = await diagramSnapshotModel.checkNameExistsForUser(
        name,
        creatorId
      );

      if (nameExists) {
        return res.status(409).json({
          error: "Ya existe un diagrama con este nombre para este usuario",
        });
      }

      const diagram = await diagramSnapshotModel.create({
        diagramId,
        name,
        description,
        creatorId,
        collaborators: collaborators || [],
        state,
        isPublic: isPublic || false,
        tags: tags || [],
        thumbnail,
      });

      res.status(201).json(diagram);
    } catch (error) {
      console.error("Error creating diagram:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
}
