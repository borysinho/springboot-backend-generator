import { createElements } from "../src/constants/templates.js";

// Simular la carga de un diagrama con elementos y relaciones
console.log("Testing diagram loading functionality:");

// Simular datos de un diagrama guardado
const mockDiagramState = {
  elements: {
    elem1: {
      id: "elem1",
      className: "Usuario",
      attributes: ["nombre: string", "email: string"],
      methods: ["login()", "logout()"],
      elementType: "class",
      stereotype: null,
      parentPackageId: null,
      containedElements: [],
      x: 100,
      y: 150,
      width: 200,
      height: 120,
    },
    elem2: {
      id: "elem2",
      className: "Producto",
      attributes: ["id: number", "nombre: string", "precio: number"],
      methods: ["getPrecio()", "setPrecio(precio: number)"],
      elementType: "class",
      stereotype: null,
      parentPackageId: null,
      containedElements: [],
      x: 350,
      y: 200,
      width: 200,
      height: 120,
    },
  },
  relationships: {
    rel1: {
      id: "rel1",
      source: "elem1",
      target: "elem2",
      relationship: "association",
      label: "compra",
      sourceMultiplicity: "1",
      targetMultiplicity: "0..*",
      sourceRole: "comprador",
      targetRole: "productos",
    },
  },
};

// Simular la conversión de elementos (como se hace en App.tsx)
const elements = Object.values(mockDiagramState.elements);
const loadedElements = elements.map((el: any) => ({
  id: el.id,
  className: el.className,
  attributes: el.attributes,
  methods: el.methods,
  elementType: el.elementType,
  stereotype: el.stereotype,
  parentPackageId: el.parentPackageId,
  containedElements: el.containedElements,
  x: el.x || 0,
  y: el.y || 0,
  width: el.width || 200,
  height: el.height || 120,
}));

// Simular la conversión de relaciones
const relationships = Object.values(mockDiagramState.relationships);
const loadedRelationships = relationships.map((rel: any) => ({
  id: rel.id,
  source: rel.source,
  target: rel.target,
  relationship: rel.relationship,
  label: rel.label,
  sourceMultiplicity: rel.sourceMultiplicity,
  targetMultiplicity: rel.targetMultiplicity,
  sourceRole: rel.sourceRole,
  targetRole: rel.targetRole,
}));

console.log("Elementos cargados:");
loadedElements.forEach((elem, index) => {
  console.log(
    `${index + 1}. ${elem.className} - Posición: (${elem.x}, ${elem.y})`
  );
});

console.log("\nRelaciones cargadas:");
loadedRelationships.forEach((rel, index) => {
  console.log(
    `${index + 1}. ${rel.source} -> ${rel.target} (${
      rel.relationship
    }) - Label: ${rel.label}`
  );
});

// Validar que las coordenadas sean correctas
const expectedPositions = [
  { id: "elem1", x: 100, y: 150 },
  { id: "elem2", x: 350, y: 200 },
];

let allPositionsCorrect = true;
expectedPositions.forEach((expected) => {
  const loaded = loadedElements.find((el) => el.id === expected.id);
  if (!loaded) {
    console.error(`❌ Elemento ${expected.id} no encontrado`);
    allPositionsCorrect = false;
  } else if (loaded.x !== expected.x || loaded.y !== expected.y) {
    console.error(
      `❌ Posición incorrecta para ${expected.id}: esperado (${expected.x}, ${expected.y}), obtenido (${loaded.x}, ${loaded.y})`
    );
    allPositionsCorrect = false;
  } else {
    console.log(
      `✅ Posición correcta para ${expected.id}: (${loaded.x}, ${loaded.y})`
    );
  }
});

// Validar que las relaciones se carguen correctamente
const expectedRelationships = [
  {
    id: "rel1",
    source: "elem1",
    target: "elem2",
    relationship: "association",
    label: "compra",
  },
];

let allRelationshipsCorrect = true;
expectedRelationships.forEach((expected) => {
  const loaded = loadedRelationships.find((rel) => rel.id === expected.id);
  if (!loaded) {
    console.error(`❌ Relación ${expected.id} no encontrada`);
    allRelationshipsCorrect = false;
  } else if (
    loaded.source !== expected.source ||
    loaded.target !== expected.target ||
    loaded.relationship !== expected.relationship ||
    loaded.label !== expected.label
  ) {
    console.error(`❌ Relación incorrecta para ${expected.id}`);
    allRelationshipsCorrect = false;
  } else {
    console.log(
      `✅ Relación correcta para ${expected.id}: ${loaded.source} -> ${loaded.target} (${loaded.relationship})`
    );
  }
});

if (allPositionsCorrect && allRelationshipsCorrect) {
  console.log(
    "\n🎉 ¡Todas las validaciones pasaron! La carga de diagramas funciona correctamente."
  );
} else {
  console.log(
    "\n❌ Algunas validaciones fallaron. Revisar la implementación de carga de diagramas."
  );
}
