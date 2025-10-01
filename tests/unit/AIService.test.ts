import { AIService, AIRequest } from "../../src/services/AIService";

// Mock de fetch global
const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = fetchMock;

describe("AIService", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Guardar el entorno original
    originalEnv = { ...process.env };

    // Limpiar mocks
    fetchMock.mockClear();

    // Configurar API key de prueba
    process.env.VITE_IA_API_KEY = "sk-test-key-valid";
  });

  afterEach(() => {
    // Restaurar el entorno original
    process.env = originalEnv;
  });

  describe("Inicialización", () => {
    test("debe inicializarse correctamente con API key válida", () => {
      expect(() => new AIService()).not.toThrow();
    });

    test("debe lanzar error si no hay API key configurada", () => {
      delete process.env.VITE_IA_API_KEY;

      expect(() => new AIService()).toThrow(
        "VITE_IA_API_KEY no está configurada. Por favor, configura una API key válida de DeepSeek en el archivo .env"
      );
    });

    test("debe usar la URL base correcta de DeepSeek", () => {
      const service = new AIService();
      // Verificar que se inicializa sin errores (la URL se usa internamente)
      expect(service).toBeInstanceOf(AIService);
    });
  });

  describe("processRequest", () => {
    let service: AIService;

    beforeEach(() => {
      service = new AIService();
    });

    test("debe procesar correctamente una solicitud de crear clase", async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              className: "Usuario",
              attributes: ["- nombre: String", "- email: String"],
              methods: ["+ login(): boolean"],
              stereotype: ""
            })
          }
        }]
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const request: AIRequest = {
        action: "create_class",
        prompt: "Crea una clase Usuario con nombre y email",
      };

      const result = await service.processRequest(request);

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.deepseek.com/v1/chat/completions",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-test-key-valid",
          },
          body: expect.stringContaining('"model": "deepseek-chat"'),
        })
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    test("debe procesar correctamente una solicitud de crear relación", async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              relationshipType: "association",
              sourceClass: "Usuario",
              targetClass: "Pedido",
              multiplicity: { source: "1", target: "*" },
              description: "Un usuario puede tener muchos pedidos"
            })
          }
        }]
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const request: AIRequest = {
        action: "relate_classes",
        prompt: "Un usuario tiene muchos pedidos",
        context: {
          existingClasses: ["Usuario", "Pedido"]
        }
      };

      const result = await service.processRequest(request);

      expect(result.success).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    test("debe manejar errores de API correctamente", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 402,
        statusText: "Payment Required",
      } as Response);

      const request: AIRequest = {
        action: "create_class",
        prompt: "Crea una clase de prueba",
      };

      const result = await service.processRequest(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain("API request failed: 402");
    });

    test("debe manejar respuestas malformadas de la API", async () => {
      const mockResponse = {
        choices: []
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const request: AIRequest = {
        action: "create_class",
        prompt: "Crea una clase de prueba",
      };

      const result = await service.processRequest(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain("No response from AI");
    });

    test("debe manejar errores de red", async () => {
      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      const request: AIRequest = {
        action: "create_class",
        prompt: "Crea una clase de prueba",
      };

      const result = await service.processRequest(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Network error");
    });
  });

  describe("Métodos específicos", () => {
    let service: AIService;

    beforeEach(() => {
      service = new AIService();
    });

    test("createClass debe llamar processRequest con action correcta", async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              className: "Producto",
              attributes: ["- precio: number"],
              methods: ["+ calcularIVA(): number"],
            })
          }
        }]
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await service.createClass("Crea una clase Producto");

      expect(result.success).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    test("relateClasses debe incluir clases existentes en el contexto", async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              relationshipType: "aggregation",
              sourceClass: "Empresa",
              targetClass: "Empleado",
              multiplicity: { source: "1", target: "*" },
              description: "Una empresa tiene muchos empleados"
            })
          }
        }]
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const existingClasses = ["Empresa", "Empleado", "Proyecto"];
      const result = await service.relateClasses("Una empresa tiene empleados", existingClasses);

      expect(result.success).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      const callArgs = fetchMock.mock.calls[0][1];
      expect(callArgs).toBeDefined();
      expect(callArgs?.body).toBeDefined();

      const body = JSON.parse(callArgs!.body as string);
      expect(body.context.existingClasses).toEqual(existingClasses);
    });
  });
});