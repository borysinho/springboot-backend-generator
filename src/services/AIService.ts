import { GoogleGenAI } from "@google/genai";

export interface AIRequest {
  action: "create_class" | "relate_classes" | "generate_diagram";
  prompt: string;
  context?: {
    existingClasses?: string[];
    diagramElements?: Record<string, unknown>[];
  };
}

export interface AIResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export class AIService {
  private genAI: GoogleGenAI;

  constructor() {
    const apiKey = import.meta.env.VITE_IA_API_KEY;
    if (!apiKey) {
      throw new Error(
        "VITE_IA_API_KEY no está configurada. Por favor, configura una API key válida de Google AI en el archivo .env"
      );
    }

    this.genAI = new GoogleGenAI({ apiKey });
  }

  async processRequest(request: AIRequest): Promise<AIResponse> {
    try {
      let systemPrompt = "";
      const userPrompt = request.prompt;

      switch (request.action) {
        case "create_class":
          systemPrompt = `Eres un experto en modelado UML. Tu tarea es crear una clase UML basada en la descripción del usuario.
          Debes responder con un JSON que contenga:
          {
            "className": "NombreDeLaClase",
            "attributes": ["atributo1: Tipo", "atributo2: Tipo"],
            "methods": ["metodo1(): TipoRetorno", "metodo2(param: Tipo): TipoRetorno"],
            "stereotype": "opcional" // como <<entity>>, <<control>>, etc.
          }
          Asegúrate de que los nombres sigan las convenciones de camelCase para atributos y métodos.`;
          break;

        case "relate_classes":
          systemPrompt = `Eres un experto en modelado UML. Tu tarea es determinar la relación entre dos clases.
          Basándote en la descripción del usuario, debes responder con un JSON que contenga:
          {
            "relationshipType": "association|aggregation|composition|generalization|dependency|realization",
            "sourceClass": "NombreClaseOrigen",
            "targetClass": "NombreClaseDestino",
            "multiplicity": {"source": "1", "target": "1..*"},
            "description": "Descripción"
          }
          Crea un modelo coherente y bien estructurado.`;
          break;

        case "generate_diagram":
          systemPrompt = `Eres un experto en modelado UML. Tu tarea es crear un diagrama UML completo basado en la descripción del usuario.
          Debes responder con un JSON que contenga:
          {
            "classes": [
              {
                "className": "NombreDeLaClase",
                "attributes": ["atributo1: Tipo"],
                "methods": ["metodo1(): TipoRetorno"],
                "stereotype": "opcional"
              }
            ],
            "relationships": [
              {
                "relationshipType": "association",
                "sourceClass": "ClaseOrigen",
                "targetClass": "ClaseDestino",
                "multiplicity": {"source": "1", "target": "1..*"},
                "description": "Descripción"
              }
            ]
          }
          Crea un modelo coherente y bien estructurado.`;
          break;
      }

      // Usar Google Gemini API
      const result = await this.genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${systemPrompt}\n\n${userPrompt}`,
              },
            ],
          },
        ],
      });

      const aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!aiResponse) {
        throw new Error("No response from AI");
      }

      // Extract JSON from the response (Gemini might return additional text)
      let jsonString = aiResponse.trim();

      // Try to find JSON block in markdown code blocks first
      const jsonCodeBlockMatch = jsonString.match(
        /```(?:json)?\s*(\{[\s\S]*?\})\s*```/
      );
      if (jsonCodeBlockMatch) {
        jsonString = jsonCodeBlockMatch[1];
      } else {
        // Try to find JSON object directly
        const jsonObjectMatch = jsonString.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          jsonString = jsonObjectMatch[0];
        }
      }

      // Parse the JSON response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(jsonString);
      } catch (parseError) {
        console.error("Failed to parse AI response as JSON:", jsonString);
        throw new Error(
          `Invalid JSON response from AI: ${
            parseError instanceof Error
              ? parseError.message
              : "Unknown parse error"
          }`
        );
      }

      return {
        success: true,
        data: parsedResponse,
      };
    } catch (error) {
      console.error("AI Service Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }

  async createClass(prompt: string): Promise<AIResponse> {
    return this.processRequest({ action: "create_class", prompt });
  }

  async relateClasses(
    prompt: string,
    existingClasses: string[]
  ): Promise<AIResponse> {
    return this.processRequest({
      action: "relate_classes",
      prompt,
      context: { existingClasses },
    });
  }

  async generateDiagram(prompt: string): Promise<AIResponse> {
    return this.processRequest({ action: "generate_diagram", prompt });
  }
}

export const aiService = new AIService();
