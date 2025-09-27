// Templates para diferentes tipos de clases UML
export const classTemplates = {
  class: {
    className: "NuevaClase",
    attributes: ["- atributo1: String"],
    methods: ["+ metodo1(): void"],
  },
  interface: {
    className: "NuevaInterfaz",
    attributes: [],
    methods: ["metodoAbstracto(): void"], // Sin visibilidad, implícitamente público
  },
  enumeration: {
    className: "Enumeracion",
    attributes: ["VALOR1", "VALOR2", "VALOR3"], // Valores literales sin tipo ni visibilidad
    methods: [],
  },
  package: {
    className: "Paquete",
    attributes: [],
    methods: [],
  },
  note: {
    className: "Nota",
    attributes: ["Esta es una nota importante sobre el diseño del sistema"], // Texto plano único
    methods: [],
  },
};

// Barra lateral de herramientas para agregar elementos
export const toolbarItems = [
  { key: "class", label: "📄 Clase", color: "#4CAF50" },
  { key: "interface", label: "🔗 Interfaz", color: "#2196F3" },
  { key: "enumeration", label: "🔢 Enumeración", color: "#795548" },
  { key: "package", label: "📦 Paquete", color: "#3F51B5" },
  { key: "note", label: "📝 Nota", color: "#FFC107" },
  { key: "association", label: "➡️ Asociación", color: "#FF5722" },
  { key: "aggregation", label: "◇ Agregación", color: "#9C27B0" },
  { key: "composition", label: "◆ Composición", color: "#673AB7" },
  { key: "generalization", label: "△ Generalización", color: "#3F51B5" },
  { key: "dependency", label: "⤸ Dependencia", color: "#607D8B" },
  { key: "realization", label: "△ Realización", color: "#00BCD4" },
];
