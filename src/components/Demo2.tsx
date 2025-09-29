import {
  GraphProvider,
  Paper,
  createElements,
  createLinks,
} from "@joint/react";

// Crear elementos iniciales usando createElements
const initialElements = createElements([
  {
    id: "start",
    type: "standard.Rectangle",
    label: "Inicio",
    x: 100,
    y: 50,
    width: 120,
    height: 60,
    attrs: {
      body: {
        fill: "#e8f5e8",
        stroke: "#4caf50",
        strokeWidth: 2,
      },
      label: {
        text: "Inicio",
        fill: "#2e7d32",
        fontSize: 14,
        fontWeight: "bold",
      },
    },
  },
  {
    id: "process1",
    type: "standard.Rectangle",
    label: "Procesar Datos",
    x: 100,
    y: 150,
    width: 120,
    height: 60,
    attrs: {
      body: {
        fill: "#e3f2fd",
        stroke: "#2196f3",
        strokeWidth: 2,
      },
      label: {
        text: "Procesar Datos",
        fill: "#0d47a1",
        fontSize: 12,
      },
    },
  },
  {
    id: "decision",
    type: "standard.Polygon",
    label: "¿Es válido?",
    x: 100,
    y: 250,
    width: 120,
    height: 60,
    attrs: {
      body: {
        fill: "#fff3e0",
        stroke: "#ff9800",
        strokeWidth: 2,
        points: "60,0 120,30 60,60 0,30", // Diamond shape
      },
      label: {
        text: "¿Es válido?",
        fill: "#e65100",
        fontSize: 12,
      },
    },
  },
  {
    id: "process2",
    type: "standard.Rectangle",
    label: "Guardar",
    x: 300,
    y: 150,
    width: 120,
    height: 60,
    attrs: {
      body: {
        fill: "#e3f2fd",
        stroke: "#2196f3",
        strokeWidth: 2,
      },
      label: {
        text: "Guardar",
        fill: "#0d47a1",
        fontSize: 12,
      },
    },
  },
  {
    id: "end",
    type: "standard.Circle",
    label: "Fin",
    x: 300,
    y: 250,
    width: 80,
    height: 80,
    attrs: {
      body: {
        fill: "#ffebee",
        stroke: "#f44336",
        strokeWidth: 2,
      },
      label: {
        text: "Fin",
        fill: "#b71c1c",
        fontSize: 14,
        fontWeight: "bold",
      },
    },
  },
]);

// Crear conexiones usando createLinks
const initialLinks = createLinks([
  {
    id: "link1",
    source: { id: "start" },
    target: { id: "process1" },
    attrs: {
      line: {
        stroke: "#666",
        strokeWidth: 2,
        targetMarker: {
          type: "path",
          d: "M 10 -5 0 0 10 5 z",
          fill: "#666",
        },
      },
    },
  },
  {
    id: "link2",
    source: { id: "process1" },
    target: { id: "decision" },
    attrs: {
      line: {
        stroke: "#666",
        strokeWidth: 2,
        targetMarker: {
          type: "path",
          d: "M 10 -5 0 0 10 5 z",
          fill: "#666",
        },
      },
    },
  },
  {
    id: "link3",
    source: { id: "decision" },
    target: { id: "process2" },
    labels: [
      {
        position: 0.5,
        attrs: {
          text: {
            text: "Sí",
            fill: "#2e7d32",
            fontSize: 12,
            fontWeight: "bold",
          },
          rect: {
            fill: "white",
            stroke: "#2e7d32",
            strokeWidth: 1,
            rx: 3,
            ry: 3,
          },
        },
      },
    ],
    attrs: {
      line: {
        stroke: "#4caf50",
        strokeWidth: 2,
        targetMarker: {
          type: "path",
          d: "M 10 -5 0 0 10 5 z",
          fill: "#4caf50",
        },
      },
    },
  },
  {
    id: "link4",
    source: { id: "decision" },
    target: { id: "end" },
    labels: [
      {
        position: 0.5,
        attrs: {
          text: {
            text: "No",
            fill: "#f44336",
            fontSize: 12,
            fontWeight: "bold",
          },
          rect: {
            fill: "white",
            stroke: "#f44336",
            strokeWidth: 1,
            rx: 3,
            ry: 3,
          },
        },
      },
    ],
    attrs: {
      line: {
        stroke: "#f44336",
        strokeWidth: 2,
        targetMarker: {
          type: "path",
          d: "M 10 -5 0 0 10 5 z",
          fill: "#f44336",
        },
      },
    },
  },
  {
    id: "link5",
    source: { id: "process2" },
    target: { id: "end" },
    attrs: {
      line: {
        stroke: "#666",
        strokeWidth: 2,
        targetMarker: {
          type: "path",
          d: "M 10 -5 0 0 10 5 z",
          fill: "#666",
        },
      },
    },
  },
]);

// Componente principal del demo
function Demo2() {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header
        style={{
          padding: "16px",
          backgroundColor: "#f5f5f5",
          borderBottom: "1px solid #ddd",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <h1 style={{ margin: 0, color: "#333" }}>
          Demo 2 - Mejores Prácticas @joint/react
        </h1>
        <p style={{ margin: "8px 0 0 0", color: "#666", fontSize: "14px" }}>
          Diagrama de flujo usando elementos estándar de JointJS con attrs
          personalizados
        </p>
      </header>

      {/* Contenedor del diagrama */}
      <div style={{ flex: 1, padding: "20px" }}>
        <GraphProvider
          initialElements={initialElements}
          initialLinks={initialLinks}
        >
          <Paper
            width="100%"
            height="100%"
            gridSize={10}
            drawGrid={{
              name: "mesh",
              args: {
                color: "#ddd",
                thickness: 1,
              },
            }}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              backgroundColor: "#fafafa",
            }}
          />
        </GraphProvider>
      </div>

      {/* Footer con información */}
      <footer
        style={{
          padding: "12px 16px",
          backgroundColor: "#f5f5f5",
          borderTop: "1px solid #ddd",
          fontFamily: "Arial, sans-serif",
          fontSize: "12px",
          color: "#666",
        }}
      >
        <p style={{ margin: 0 }}>
          <strong>Mejores prácticas implementadas:</strong> GraphProvider,
          createElements con tipos estándar, createLinks con attrs, elementos
          renderizados automáticamente por JointJS
        </p>
      </footer>
    </div>
  );
}

export default Demo2;
