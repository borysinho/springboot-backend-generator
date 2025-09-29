import { GraphProvider, Paper } from "@joint/react";

// Definir elementos y links para las relaciones UML
const elements = [
  // Elemento 1: Clase A
  {
    id: "class-a",
    type: "standard.Rectangle",
    position: { x: 50, y: 100 },
    size: { width: 120, height: 60 },
    attrs: {
      body: {
        fill: "#E3F2FD",
        stroke: "#1976D2",
        strokeWidth: 2,
      },
      label: {
        text: "Clase A",
        fill: "#1976D2",
        fontSize: 14,
        fontWeight: "bold",
      },
    },
  },
  // Elemento 2: Clase B
  {
    id: "class-b",
    type: "standard.Rectangle",
    position: { x: 250, y: 100 },
    size: { width: 120, height: 60 },
    attrs: {
      body: {
        fill: "#F3E5F5",
        stroke: "#7B1FA2",
        strokeWidth: 2,
      },
      label: {
        text: "Clase B",
        fill: "#7B1FA2",
        fontSize: 14,
        fontWeight: "bold",
      },
    },
  },
  // Elemento 3: Clase C
  {
    id: "class-c",
    type: "standard.Rectangle",
    position: { x: 450, y: 100 },
    size: { width: 120, height: 60 },
    attrs: {
      body: {
        fill: "#E8F5E8",
        stroke: "#388E3C",
        strokeWidth: 2,
      },
      label: {
        text: "Clase C",
        fill: "#388E3C",
        fontSize: 14,
        fontWeight: "bold",
      },
    },
  },
  // Elemento 4: Clase D
  {
    id: "class-d",
    type: "standard.Rectangle",
    position: { x: 150, y: 250 },
    size: { width: 120, height: 60 },
    attrs: {
      body: {
        fill: "#FFF3E0",
        stroke: "#F57C00",
        strokeWidth: 2,
      },
      label: {
        text: "Clase D",
        fill: "#F57C00",
        fontSize: 14,
        fontWeight: "bold",
      },
    },
  },
  // Elemento 5: Clase E
  {
    id: "class-e",
    type: "standard.Rectangle",
    position: { x: 350, y: 250 },
    size: { width: 120, height: 60 },
    attrs: {
      body: {
        fill: "#FCE4EC",
        stroke: "#C2185B",
        strokeWidth: 2,
      },
      label: {
        text: "Clase E",
        fill: "#C2185B",
        fontSize: 14,
        fontWeight: "bold",
      },
    },
  },
  // Elemento 6: Clase F
  {
    id: "class-f",
    type: "standard.Rectangle",
    position: { x: 250, y: 400 },
    size: { width: 120, height: 60 },
    attrs: {
      body: {
        fill: "#E0F2F1",
        stroke: "#00695C",
        strokeWidth: 2,
      },
      label: {
        text: "Clase F",
        fill: "#00695C",
        fontSize: 14,
        fontWeight: "bold",
      },
    },
  },
];

const links = [
  // 1. Association: Línea sólida + flecha
  {
    id: "association",
    type: "standard.Link",
    source: { id: "class-a" },
    target: { id: "class-b" },
    attrs: {
      line: {
        stroke: "#FF5722",
        strokeWidth: 2,
        targetMarker: {
          type: "path",
          d: "M 10 0 L 0 5 L 10 10 z",
          fill: "#FF5722",
        },
      },
    },
    labels: [
      {
        attrs: {
          text: {
            text: "association",
          },
        },
      },
    ],
  },
  // 2. Aggregation: Línea sólida + rombo vacío
  {
    id: "aggregation",
    type: "standard.Link",
    source: { id: "class-b" },
    target: { id: "class-c" },
    attrs: {
      line: {
        stroke: "#9C27B0",
        strokeWidth: 2,
        sourceMarker: {
          type: "path",
          d: "M 15 0 L 7.5 -7.5 L 0 0 L 7.5 7.5 z",
          fill: "white",
          stroke: "#9C27B0",
          strokeWidth: 2,
        },
      },
    },
    labels: [
      {
        attrs: {
          text: {
            text: "aggregation",
          },
        },
      },
    ],
  },
  // 3. Composition: Línea sólida + rombo relleno
  {
    id: "composition",
    type: "standard.Link",
    source: { id: "class-c" },
    target: { id: "class-d" },
    attrs: {
      line: {
        stroke: "#673AB7",
        strokeWidth: 2,
        sourceMarker: {
          type: "path",
          d: "M 15 0 L 7.5 -7.5 L 0 0 L 7.5 7.5 z",
          fill: "#673AB7",
        },
      },
    },
    labels: [
      {
        attrs: {
          text: {
            text: "composition",
          },
        },
      },
    ],
  },
  // 4. Generalization: Línea sólida + flecha blanca
  {
    id: "generalization",
    type: "standard.Link",
    source: { id: "class-d" },
    target: { id: "class-e" },
    attrs: {
      line: {
        stroke: "#3F51B5",
        strokeWidth: 2,
        targetMarker: {
          type: "path",
          d: "M 10 0 L 0 5 L 10 10 z",
          fill: "white",
          stroke: "#3F51B5",
          strokeWidth: 2,
        },
      },
    },
    labels: [
      {
        attrs: {
          text: {
            text: "generalization",
          },
        },
      },
    ],
  },
  // 5. Dependency: Línea punteada + flecha
  {
    id: "dependency",
    type: "standard.Link",
    source: { id: "class-e" },
    target: { id: "class-f" },
    attrs: {
      line: {
        stroke: "#607D8B",
        strokeWidth: 2,
        strokeDasharray: "5,5",
        targetMarker: {
          type: "path",
          d: "M 10 0 L 0 5 L 10 10 z",
          fill: "#607D8B",
        },
      },
    },
    labels: [
      {
        attrs: {
          text: {
            text: "dependency",
          },
        },
      },
    ],
  },
  // 6. Realization: Línea punteada + flecha blanca
  {
    id: "realization",
    type: "standard.Link",
    source: { id: "class-f" },
    target: { id: "class-a" },
    attrs: {
      line: {
        stroke: "#00BCD4",
        strokeWidth: 2,
        strokeDasharray: "5,5",
        targetMarker: {
          type: "path",
          d: "M 10 0 L 0 5 L 10 10 z",
          fill: "white",
          stroke: "#00BCD4",
          strokeWidth: 2,
        },
      },
    },
    labels: [
      {
        attrs: {
          text: {
            text: {
              text: "realization",
            },
          },
        },
      },
    ],
  },
];

export default function UMLRelationshipsDemo() {
  // Función para renderizar elementos (requerida por Paper)
  const renderElement = (element: any) => {
    return (
      <div
        style={{
          width: element.size.width,
          height: element.size.height,
          backgroundColor: element.attrs.body.fill,
          border: `${element.attrs.body.strokeWidth}px solid ${element.attrs.body.stroke}`,
          borderRadius: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: element.attrs.label.fontSize,
          fontWeight: element.attrs.label.fontWeight,
          color: element.attrs.label.fill,
          position: "relative",
        }}
      >
        {element.attrs.label.text}
      </div>
    );
  };

  // Crear elementos básicos para las relaciones
  return (
    <div style={{ width: "100vw", height: "100vh", padding: "20px" }}>
      <h1 style={{ textAlign: "center", marginBottom: "20px", color: "#333" }}>
        @joint/react - Tipos de Relaciones UML
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 2fr 1fr",
          gap: "20px",
          height: "calc(100vh - 100px)",
        }}
      >
        {/* Panel izquierdo - Leyenda */}
        <div
          style={{
            backgroundColor: "#f8f9fa",
            padding: "20px",
            borderRadius: "8px",
            border: "2px solid #dee2e6",
          }}
        >
          <h3 style={{ marginTop: 0, color: "#495057" }}>
            Tipos de Relaciones
          </h3>

          <div style={{ marginBottom: "15px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  width: "20px",
                  height: "3px",
                  backgroundColor: "#FF5722",
                  marginRight: "10px",
                }}
              ></div>
              <strong>Association:</strong> Línea sólida + flecha
            </div>
            <div
              style={{ fontSize: "12px", color: "#6c757d", marginLeft: "30px" }}
            >
              Relación bidireccional
            </div>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  width: "20px",
                  height: "3px",
                  backgroundColor: "#9C27B0",
                  marginRight: "10px",
                }}
              ></div>
              <strong>Aggregation:</strong> Línea sólida + rombo vacío
            </div>
            <div
              style={{ fontSize: "12px", color: "#6c757d", marginLeft: "30px" }}
            >
              "Tiene un" - parte independiente
            </div>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  width: "20px",
                  height: "3px",
                  backgroundColor: "#673AB7",
                  marginRight: "10px",
                }}
              ></div>
              <strong>Composition:</strong> Línea sólida + rombo relleno
            </div>
            <div
              style={{ fontSize: "12px", color: "#6c757d", marginLeft: "30px" }}
            >
              "Contiene" - parte dependiente
            </div>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  width: "20px",
                  height: "3px",
                  backgroundColor: "#3F51B5",
                  marginRight: "10px",
                }}
              ></div>
              <strong>Generalization:</strong> Línea sólida + flecha blanca
            </div>
            <div
              style={{ fontSize: "12px", color: "#6c757d", marginLeft: "30px" }}
            >
              Herencia ("es un")
            </div>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  width: "20px",
                  height: "3px",
                  backgroundColor: "#607D8B",
                  backgroundImage:
                    "repeating-linear-gradient(90deg, #607D8B, #607D8B 3px, transparent 3px, transparent 6px)",
                  marginRight: "10px",
                }}
              ></div>
              <strong>Dependency:</strong> Línea punteada + flecha
            </div>
            <div
              style={{ fontSize: "12px", color: "#6c757d", marginLeft: "30px" }}
            >
              Uso temporal
            </div>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  width: "20px",
                  height: "3px",
                  backgroundColor: "#00BCD4",
                  backgroundImage:
                    "repeating-linear-gradient(90deg, #00BCD4, #00BCD4 3px, transparent 3px, transparent 6px)",
                  marginRight: "10px",
                }}
              ></div>
              <strong>Realization:</strong> Línea punteada + flecha blanca
            </div>
            <div
              style={{ fontSize: "12px", color: "#6c757d", marginLeft: "30px" }}
            >
              Implementación de interfaz
            </div>
          </div>
        </div>

        {/* Panel central - Diagrama */}
        <div
          style={{
            border: "2px solid #dee2e6",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <GraphProvider initialElements={elements} initialLinks={links}>
            <Paper
              renderElement={renderElement}
              style={{ width: "100%", height: "100%" }}
            />
          </GraphProvider>
        </div>

        {/* Panel derecho - Información técnica */}
        <div
          style={{
            backgroundColor: "#f8f9fa",
            padding: "20px",
            borderRadius: "8px",
            border: "2px solid #dee2e6",
          }}
        >
          <h3 style={{ marginTop: 0, color: "#495057" }}>
            Información Técnica
          </h3>

          <h4>Atributos CSS</h4>
          <ul style={{ fontSize: "12px", color: "#495057" }}>
            <li>
              <code>.connection</code> - Línea principal
            </li>
            <li>
              <code>.marker-target</code> - Marcador final
            </li>
            <li>
              <code>.marker-source</code> - Marcador inicial
            </li>
          </ul>

          <h4>Propiedades SVG</h4>
          <ul style={{ fontSize: "12px", color: "#495057" }}>
            <li>
              <code>stroke</code> - Color de línea
            </li>
            <li>
              <code>strokeWidth</code> - Grosor
            </li>
            <li>
              <code>strokeDasharray</code> - Patrón punteado
            </li>
            <li>
              <code>fill</code> - Color de relleno
            </li>
            <li>
              <code>d</code> - Path del marcador
            </li>
          </ul>

          <h4>Marcadores SVG</h4>
          <div
            style={{
              fontSize: "11px",
              color: "#6c757d",
              fontFamily: "monospace",
            }}
          >
            <div>Flecha: "M 10 0 L 0 5 L 10 10 z"</div>
            <div>Rombo: "M 15 0 L 7.5 -7.5 L 0 0 L 7.5 7.5 z"</div>
          </div>

          <div
            style={{
              marginTop: "20px",
              padding: "10px",
              backgroundColor: "#e9ecef",
              borderRadius: "4px",
            }}
          >
            <strong>Nota:</strong> Esta es una demostración estática usando
            únicamente @joint/react v1.0.0-alpha.5
          </div>
        </div>
      </div>
    </div>
  );
}
