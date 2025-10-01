import { Request, Response } from "express";
import { DiagramSnapshotModel } from "../models/DiagramSnapshotModel.js";
import { DatabaseService } from "../services/DatabaseService.js";

const diagramSnapshotModel = new DiagramSnapshotModel();
const databaseService = new DatabaseService();

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

      const diagrams = await databaseService.findDiagramSnapshotsByUser(userId);
      res.json(diagrams);
    } catch (error) {
      console.error("Error getting diagrams by user:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  // Obtener un diagrama específico por diagramId
  async getDiagramById(req: Request, res: Response) {
    try {
      const { diagramId } = req.params;

      if (!diagramId) {
        return res.status(400).json({ error: "diagramId es requerido" });
      }

      const diagram = await diagramSnapshotModel.getLatestByDiagramId(
        diagramId
      );

      if (!diagram) {
        return res.status(404).json({ error: "Diagrama no encontrado" });
      }

      res.json(diagram);
    } catch (error) {
      console.error("Error getting diagram by id:", error);
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

  // Actualizar un diagrama existente
  async updateDiagram(req: Request, res: Response) {
    try {
      const { diagramId } = req.params;
      const {
        name,
        description,
        collaborators,
        state,
        isPublic,
        tags,
        thumbnail,
      } = req.body;

      if (!diagramId) {
        return res.status(400).json({
          error: "diagramId es requerido",
        });
      }

      const updatedDiagram = await diagramSnapshotModel.update(diagramId, {
        name,
        description,
        collaborators,
        state,
        isPublic,
        tags,
        thumbnail,
      });

      if (!updatedDiagram) {
        return res.status(404).json({ error: "Diagrama no encontrado" });
      }

      res.json(updatedDiagram);
    } catch (error) {
      console.error("Error updating diagram:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  // Eliminar un diagrama
  async deleteDiagram(req: Request, res: Response) {
    try {
      const { diagramId } = req.params;

      if (!diagramId) {
        return res.status(400).json({
          error: "diagramId es requerido",
        });
      }

      const deleted = await diagramSnapshotModel.delete(diagramId);

      if (!deleted) {
        return res.status(404).json({ error: "Diagrama no encontrado" });
      }

      res.json({ message: "Diagrama eliminado exitosamente" });
    } catch (error) {
      console.error("Error deleting diagram:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  // Exportar diagrama como JSON
  async exportDiagramAsJSON(req: Request, res: Response) {
    try {
      const { diagramId } = req.params;

      if (!diagramId) {
        return res.status(400).json({ error: "diagramId es requerido" });
      }

      const diagram = await diagramSnapshotModel.getLatestByDiagramId(
        diagramId
      );

      if (!diagram) {
        return res.status(404).json({ error: "Diagrama no encontrado" });
      }

      // Crear el objeto de exportación
      const exportData = {
        name: diagram.name,
        description:
          diagram.description ||
          `Diagrama UML exportado el ${new Date().toLocaleString()}`,
        state: diagram.state,
        exportedAt: new Date().toISOString(),
        version: diagram.version,
        tags: diagram.tags,
      };

      // Configurar headers para descarga
      const fileName = `${diagram.name
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}_${new Date().toISOString().split("T")[0]}.json`;

      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );

      res.json(exportData);
    } catch (error) {
      console.error("Error exporting diagram as JSON:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  // Exportar diagrama como SVG
  async exportDiagramAsSVG(req: Request, res: Response) {
    try {
      const { diagramId } = req.params;

      if (!diagramId) {
        return res.status(400).json({ error: "diagramId es requerido" });
      }

      const diagram = await diagramSnapshotModel.getLatestByDiagramId(
        diagramId
      );

      if (!diagram) {
        return res.status(404).json({ error: "Diagrama no encontrado" });
      }

      // Generar SVG básico del diagrama
      const svgContent = this.generateSVGFromDiagram(diagram);

      // Configurar headers para descarga
      const fileName = `${diagram.name
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}_${new Date().toISOString().split("T")[0]}.svg`;

      res.setHeader("Content-Type", "image/svg+xml");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );

      res.send(svgContent);
    } catch (error) {
      console.error("Error exporting diagram as SVG:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  // Generar SVG desde el diagrama
  private generateSVGFromDiagram(diagram: any): string {
    const elements = diagram.state?.elements || {};
    const relationships = diagram.state?.relationships || {};

    // Calcular dimensiones del SVG
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    Object.values(elements).forEach((element: any) => {
      minX = Math.min(minX, element.x || 0);
      minY = Math.min(minY, element.y || 0);
      maxX = Math.max(maxX, (element.x || 0) + (element.width || 200));
      maxY = Math.max(maxY, (element.y || 0) + (element.height || 120));
    });

    const padding = 50;
    const width = Math.max(800, maxX - minX + padding * 2);
    const height = Math.max(600, maxY - minY + padding * 2);

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <style>
      .element { fill: white; stroke: #333; stroke-width: 2; }
      .header { fill: #e3f2fd; stroke: #333; stroke-width: 1; }
      .text { font-family: monospace; font-size: 12px; fill: #333; }
      .relationship { stroke: #666; stroke-width: 2; fill: none; marker-end: url(#arrowhead); }
    </style>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
    </marker>
  </defs>

  <!-- Fondo -->
  <rect width="100%" height="100%" fill="#f8f9fa"/>

  <!-- Título -->
  <text x="${
    width / 2
  }" y="30" text-anchor="middle" class="text" font-size="16" font-weight="bold">${
      diagram.name
    }</text>
`;

    // Dibujar elementos
    Object.values(elements).forEach((element: any) => {
      const x = (element.x || 0) - minX + padding;
      const y = (element.y || 0) - minY + padding;
      const w = element.width || 200;
      const h = element.height || 120;

      // Rectángulo principal
      svg += `  <rect x="${x}" y="${y}" width="${w}" height="${h}" class="element" rx="8"/>
`;

      // Header del elemento
      const headerHeight = 30;
      svg += `  <rect x="${x}" y="${y}" width="${w}" height="${headerHeight}" class="header"/>
`;

      // Nombre del elemento
      let elementName = element.className || "";
      if (element.elementType === "interface") {
        elementName = `«interface» ${elementName}`;
      } else if (element.elementType === "enumeration") {
        elementName = `«enumeration» ${elementName}`;
      }

      svg += `  <text x="${x + w / 2}" y="${
        y + 20
      }" text-anchor="middle" class="text" font-weight="bold">${this.escapeXml(
        elementName
      )}</text>
`;

      // Contenido del elemento
      let contentY = y + headerHeight + 15;
      const lineHeight = 15;

      // Atributos
      if (element.attributes && element.attributes.length > 0) {
        element.attributes.forEach((attr: string) => {
          svg += `  <text x="${
            x + 10
          }" y="${contentY}" class="text">${this.escapeXml(attr)}</text>
`;
          contentY += lineHeight;
        });
      }

      // Métodos
      if (element.methods && element.methods.length > 0) {
        if (element.attributes && element.attributes.length > 0) {
          // Línea separadora
          svg += `  <line x1="${x}" y1="${contentY - 5}" x2="${x + w}" y2="${
            contentY - 5
          }" stroke="#ddd" stroke-width="1"/>
`;
        }
        element.methods.forEach((method: string) => {
          svg += `  <text x="${
            x + 10
          }" y="${contentY}" class="text">${this.escapeXml(method)}</text>
`;
          contentY += lineHeight;
        });
      }
    });

    // Dibujar relaciones (simplificado)
    Object.values(relationships).forEach((rel: any) => {
      const sourceElement = elements[rel.source];
      const targetElement = elements[rel.target];

      if (sourceElement && targetElement) {
        const sourceX =
          (sourceElement.x || 0) -
          minX +
          padding +
          (sourceElement.width || 200) / 2;
        const sourceY =
          (sourceElement.y || 0) -
          minY +
          padding +
          (sourceElement.height || 120) / 2;
        const targetX =
          (targetElement.x || 0) -
          minX +
          padding +
          (targetElement.width || 200) / 2;
        const targetY =
          (targetElement.y || 0) -
          minY +
          padding +
          (targetElement.height || 120) / 2;

        svg += `  <line x1="${sourceX}" y1="${sourceY}" x2="${targetX}" y2="${targetY}" class="relationship"/>
`;

        // Etiqueta de la relación
        if (rel.label) {
          const midX = (sourceX + targetX) / 2;
          const midY = (sourceY + targetY) / 2;
          svg += `  <text x="${midX}" y="${
            midY - 5
          }" text-anchor="middle" class="text" font-size="10">${this.escapeXml(
            rel.label
          )}</text>
`;
        }
      }
    });

    svg += `</svg>`;
    return svg;
  }

  // Función auxiliar para escapar caracteres XML
  private escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case "&":
          return "&amp;";
        case "'":
          return "&#39;";
        case '"':
          return "&quot;";
        default:
          return c;
      }
    });
  }
}
