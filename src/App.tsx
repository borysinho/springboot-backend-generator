import { useCallback, useState } from "react";
import {
  GraphProvider,
  Paper,
  createElements,
  createLinks,
} from "@joint/react";
import type { InferElement } from "@joint/react";
import "./App.css";

// Definir elementos UML (clases)
const initialElements = createElements([
  {
    id: "1",
    className: "Persona",
    attributes: ["- nombre: String", "- edad: int", "- dni: String"],
    methods: [
      "+ getNombre(): String",
      "+ setNombre(nombre: String): void",
      "+ calcularEdad(): int",
    ],
    x: 50,
    y: 50,
    width: 200,
    height: 120,
  },
  {
    id: "2",
    className: "Estudiante",
    attributes: ["- matricula: String", "- carrera: String", "- semestre: int"],
    methods: [
      "+ inscribirMateria(materia: String): void",
      "+ obtenerPromedio(): double",
    ],
    x: 300,
    y: 50,
    width: 200,
    height: 120,
  },
  {
    id: "3",
    className: "Profesor",
    attributes: [
      "- especialidad: String",
      "- añosExperiencia: int",
      "- titulo: String",
    ],
    methods: [
      "+ dictarClase(materia: String): void",
      "+ calificarEstudiante(estudiante: Estudiante): void",
    ],
    x: 550,
    y: 50,
    width: 200,
    height: 120,
  },
  {
    id: "4",
    className: "Materia",
    attributes: ["- nombre: String", "- codigo: String", "- creditos: int"],
    methods: [
      "+ obtenerNombre(): String",
      "+ asignarProfesor(profesor: Profesor): void",
    ],
    x: 200,
    y: 250,
    width: 200,
    height: 120,
  },
]);

// Definir conexiones UML con diferentes tipos de relaciones
const initialLinks = createLinks([
  {
    id: "link1",
    source: "1", // Persona
    target: "2", // Estudiante
    relationship: "inheritance",
    label: "hereda",
  },
  {
    id: "link2",
    source: "1", // Persona
    target: "3", // Profesor
    relationship: "inheritance",
    label: "hereda",
  },
  {
    id: "link3",
    source: "2", // Estudiante
    target: "4", // Materia
    relationship: "association",
    label: "cursa",
  },
  {
    id: "link4",
    source: "3", // Profesor
    target: "4", // Materia
    relationship: "association",
    label: "dicta",
  },
]);

type CustomElement = InferElement<typeof initialElements>;

// Templates para diferentes tipos de clases UML
const classTemplates = {
  class: {
    className: "NuevaClase",
    attributes: ["- atributo1: String"],
    methods: ["+ metodo1(): void"],
  },
  interface: {
    className: "NuevaInterfaz",
    attributes: [],
    methods: ["+ metodoAbstracto(): void"],
  },
  abstract: {
    className: "ClaseAbstracta",
    attributes: ["- atributo: String"],
    methods: ["+ metodoConcreto(): void", "# metodoAbstracto(): void"],
  },
  entity: {
    className: "Entidad",
    attributes: ["- id: int", "- nombre: String", "- fechaCreacion: Date"],
    methods: ["+ getId(): int", "+ setNombre(nombre: String): void"],
  },
  controller: {
    className: "Controlador",
    attributes: ["- servicio: Servicio"],
    methods: ["+ procesarSolicitud(): Response", "+ validarDatos(): boolean"],
  },
  enumeration: {
    className: "Enumeracion",
    attributes: ["VALOR1", "VALOR2", "VALOR3"],
    methods: [],
  },
  package: {
    className: "Paquete",
    attributes: [],
    methods: [],
  },
  note: {
    className: "Nota",
    attributes: ["Esta es una nota importante", "sobre el diseño del sistema"],
    methods: [],
  },
  utility: {
    className: "Utilidad",
    attributes: [],
    methods: ["+ metodoEstatico(): void", "+ helper(): String"],
  },
  service: {
    className: "Servicio",
    attributes: ["- repositorio: Repositorio"],
    methods: ["+ ejecutar(): void", "+ validar(): boolean"],
  },
  repository: {
    className: "Repositorio",
    attributes: ["- conexion: Connection"],
    methods: ["+ guardar(objeto: Object): void", "+ buscar(id: int): Object"],
  },
  dto: {
    className: "DTO",
    attributes: ["- campo1: String", "- campo2: int"],
    methods: ["+ getCampo1(): String", "+ setCampo1(campo1: String): void"],
  },
  exception: {
    className: "Excepcion",
    attributes: ["- mensaje: String", "- causa: Throwable"],
    methods: ["+ getMensaje(): String", "+ getCausa(): Throwable"],
  },
};

// Barra lateral de herramientas para agregar elementos
function Toolbar() {
  const handleDragStart = (
    e: React.DragEvent,
    template: keyof typeof classTemplates
  ) => {
    e.dataTransfer.setData("text/plain", template);
    e.dataTransfer.effectAllowed = "copy";
  };

  const toolbarItems = [
    { key: "class", label: "📄 Clase", color: "#4CAF50" },
    { key: "interface", label: "🔗 Interfaz", color: "#2196F3" },
    { key: "abstract", label: "🎭 Abstracta", color: "#FF9800" },
    { key: "entity", label: "🗃️ Entidad", color: "#9C27B0" },
    { key: "controller", label: "🎮 Controlador", color: "#607D8B" },
    { key: "enumeration", label: "🔢 Enumeración", color: "#795548" },
    { key: "package", label: "📦 Paquete", color: "#3F51B5" },
    { key: "note", label: "📝 Nota", color: "#FFC107" },
    { key: "utility", label: "🔧 Utilidad", color: "#009688" },
    { key: "service", label: "⚙️ Servicio", color: "#E91E63" },
    { key: "repository", label: "💾 Repositorio", color: "#673AB7" },
    { key: "dto", label: "📊 DTO", color: "#00BCD4" },
    { key: "exception", label: "⚠️ Excepción", color: "#F44336" },
  ];

  return (
    <div
      style={{
        width: "200px",
        minHeight: "600px",
        background: "#f8f9fa",
        border: "1px solid #dee2e6",
        borderRadius: "8px",
        padding: "15px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
      }}
    >
      <h3
        style={{
          margin: "0 0 15px 0",
          fontSize: "16px",
          color: "#495057",
          textAlign: "center",
          borderBottom: "1px solid #dee2e6",
          paddingBottom: "10px",
        }}
      >
        🛠️ Elementos UML
      </h3>

      {toolbarItems.map((item) => (
        <div
          key={item.key}
          draggable
          onDragStart={(e) =>
            handleDragStart(e, item.key as keyof typeof classTemplates)
          }
          style={{
            padding: "10px 12px",
            background: item.color,
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "grab",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            userSelect: "none",
            transition: "transform 0.2s, box-shadow 0.2s",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "scale(0.95)";
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "scale(1)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "scale(1)";
          }}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}

// Componente para renderizar una clase UML
function UMLClass({ element }: { element: CustomElement }) {
  // Determinar el tipo de elemento basado en su contenido
  const getElementType = () => {
    if (!element.methods || element.methods.length === 0) {
      if (!element.attributes || element.attributes.length === 0) {
        return "package";
      }
      // Si tiene atributos pero no métodos, podría ser enumeración o nota
      if (
        element.attributes.some(
          (attr) => !attr.includes(":") && !attr.includes("(")
        )
      ) {
        return "enumeration";
      }
      return "note";
    }
    return "class";
  };

  const elementType = getElementType();

  const getElementStyle = () => {
    switch (elementType) {
      case "enumeration":
        return {
          border: "2px solid #795548",
          background: "#efebe9",
        };
      case "package":
        return {
          border: "2px solid #3F51B5",
          background: "#e8eaf6",
        };
      case "note":
        return {
          border: "2px solid #FFC107",
          background: "#fffde7",
          fontFamily: "Arial, sans-serif",
        };
      default:
        return {
          border: "2px solid #333",
          background: "white",
        };
    }
  };

  const getHeaderStyle = () => {
    switch (elementType) {
      case "enumeration":
        return { background: "#d7ccc8" };
      case "package":
        return { background: "#c5cae9" };
      case "note":
        return { background: "#fff9c4" };
      default:
        return { background: "#e3f2fd" };
    }
  };

  const style = getElementStyle();
  const headerStyle = getHeaderStyle();

  return (
    <div
      style={{
        ...style,
        borderRadius: "8px",
        fontFamily: elementType === "note" ? "Arial, sans-serif" : "monospace",
        fontSize: "12px",
        overflow: "hidden",
        boxShadow: "2px 2px 5px rgba(0,0,0,0.1)",
        minWidth: "150px",
      }}
    >
      {/* Nombre del elemento */}
      <div
        style={{
          ...headerStyle,
          padding: "8px",
          fontWeight: "bold",
          textAlign: "center",
          borderBottom: "1px solid #333",
          fontStyle: elementType === "enumeration" ? "italic" : "normal",
        }}
      >
        {elementType === "enumeration" && "«enumeration»"}
        {elementType === "package" && "📦"}
        {element.className}
      </div>

      {/* Contenido basado en el tipo */}
      {elementType === "enumeration" && (
        <div style={{ padding: "8px" }}>
          {element.attributes?.map((value, index) => (
            <div key={index} style={{ margin: "4px 0", textAlign: "center" }}>
              {value}
            </div>
          ))}
        </div>
      )}

      {elementType === "note" && (
        <div style={{ padding: "8px", fontSize: "11px", lineHeight: "1.4" }}>
          {element.attributes?.map((line, index) => (
            <div key={index} style={{ margin: "2px 0" }}>
              {line}
            </div>
          ))}
        </div>
      )}

      {elementType === "package" && (
        <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
          Paquete vacío
        </div>
      )}

      {elementType === "class" && (
        <>
          {/* Atributos */}
          <div
            style={{
              padding: "4px 8px",
              borderBottom:
                element.methods && element.methods.length > 0
                  ? "1px solid #ddd"
                  : "none",
              minHeight: "20px",
            }}
          >
            {element.attributes?.map((attr, index) => (
              <div key={index} style={{ margin: "2px 0" }}>
                {attr}
              </div>
            ))}
          </div>

          {/* Métodos */}
          {element.methods && element.methods.length > 0 && (
            <div style={{ padding: "4px 8px" }}>
              {element.methods.map((method, index) => (
                <div key={index} style={{ margin: "2px 0" }}>
                  {method}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Componente principal del diagrama UML
function UMLDiagram({
  onAddElement,
}: {
  onAddElement: (
    template: keyof typeof classTemplates,
    x?: number,
    y?: number
  ) => void;
}) {
  const renderElement = useCallback((element: CustomElement) => {
    return <UMLClass element={element} />;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const template = e.dataTransfer.getData(
        "text/plain"
      ) as keyof typeof classTemplates;

      console.log("Drop event on diagram:", template, classTemplates[template]);

      if (template && classTemplates[template]) {
        // Calcular la posición relativa al diagrama
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        console.log("Drop position:", x, y);
        onAddElement(template, x, y);
      }
    },
    [onAddElement]
  );

  return (
    <div
      style={{
        height: "600px",
        border: "2px dashed #ccc",
        background: "#f9f9f9",
        position: "relative",
        borderRadius: "8px",
        overflow: "hidden",
      }}
      data-diagram
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          background: "rgba(255, 255, 255, 0.9)",
          padding: "5px 10px",
          borderRadius: "4px",
          fontSize: "12px",
          color: "#666",
          pointerEvents: "none",
          zIndex: 10,
        }}
      >
        Arrastra elementos desde la barra lateral para agregarlos
      </div>
      <Paper
        initialElements={initialElements}
        initialLinks={initialLinks}
        width="100%"
        height="100%"
        renderElement={renderElement}
        useHTMLOverlay
      />
    </div>
  );
}

function App() {
  const [dynamicElements, setDynamicElements] = useState<CustomElement[]>([]);
  const [elementCounter, setElementCounter] = useState(5);

  const handleAddElement = useCallback(
    (template: keyof typeof classTemplates, x?: number, y?: number) => {
      console.log("Adding element:", template, x, y);
      const templateData = classTemplates[template];

      // Usar posición proporcionada o calcular automáticamente
      let newX: number, newY: number;

      if (x !== undefined && y !== undefined) {
        // Posición específica del drop
        newX = Math.max(0, x - 100); // Centrar el elemento en la posición del drop
        newY = Math.max(0, y - 60);
      } else {
        // Posición automática
        const existingElements = [...initialElements, ...dynamicElements];
        const maxX = Math.max(...existingElements.map((el) => el.x || 0), 0);
        const maxY = Math.max(...existingElements.map((el) => el.y || 0), 0);

        newX = maxX + 250;
        newY = maxY > 200 ? 50 : maxY + 170;
      }

      const newElement = {
        id: elementCounter.toString(),
        className: templateData.className,
        attributes: [...templateData.attributes],
        methods: [...templateData.methods],
        x: newX,
        y: newY,
        width: 200,
        height: 120,
      };

      setDynamicElements((prev) => [...prev, newElement]);
      setElementCounter((prev) => prev + 1);
      console.log("Element added:", newElement);
    },
    [dynamicElements, elementCounter]
  );

  // Combinar elementos iniciales con dinámicos
  const allElements = [...initialElements, ...dynamicElements];

  console.log(
    "All elements:",
    allElements.length,
    "dynamic:",
    dynamicElements.length
  );

  return (
    <div
      style={{
        padding: "20px",
        display: "flex",
        gap: "20px",
        alignItems: "flex-start",
      }}
    >
      <Toolbar />

      <div style={{ flex: 1 }}>
        <h1>Editor de Clases UML con @joint/react</h1>
        <p>
          Diagrama UML interactivo que muestra clases con atributos, métodos y
          relaciones. Arrastra elementos desde la barra lateral para agregarlos
          al diagrama.
        </p>

        <GraphProvider
          initialElements={allElements}
          initialLinks={initialLinks}
        >
          <UMLDiagram onAddElement={handleAddElement} />
        </GraphProvider>
      </div>
    </div>
  );
}

export default App;
