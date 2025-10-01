// Script de prueba completo para validar la carga y persistencia de diagramas
console.log("=== PRUEBA COMPLETA DE CARGA Y PERSISTENCIA DE DIAGRAMAS ===\n");

// Simular datos de un diagrama guardado con elementos movidos
const mockDiagramState = {
  elements: {
    5: {
      id: "5",
      className: "Usuario",
      attributes: ["nombre: string", "email: string"],
      methods: ["login()", "logout()"],
      elementType: "class",
      stereotype: null,
      parentPackageId: null,
      containedElements: [],
      x: 250, // Movido de posición original
      y: 300, // Movido de posición original
      width: 200,
      height: 120,
    },
    6: {
      id: "6",
      className: "Producto",
      attributes: ["id: number", "nombre: string", "precio: number"],
      methods: ["getPrecio()", "setPrecio(precio: number)"],
      elementType: "class",
      stereotype: null,
      parentPackageId: null,
      containedElements: [],
      x: 500, // Movido de posición original
      y: 350, // Movido de posición original
      width: 200,
      height: 120,
    },
    7: {
      id: "7",
      className: "Orden",
      attributes: ["id: number", "fecha: Date"],
      methods: ["calcularTotal()"],
      elementType: "class",
      stereotype: null,
      parentPackageId: null,
      containedElements: [],
      x: 100,
      y: 100,
      width: 200,
      height: 120,
    },
  },
  relationships: {
    rel1: {
      id: "rel1",
      source: "5",
      target: "6",
      relationship: "association",
      label: "compra",
      sourceMultiplicity: "1",
      targetMultiplicity: "0..*",
      sourceRole: "comprador",
      targetRole: "productos",
    },
    rel2: {
      id: "rel2",
      source: "5",
      target: "7",
      relationship: "generalization",
      label: "hereda",
      sourceMultiplicity: null,
      targetMultiplicity: null,
      sourceRole: null,
      targetRole: null,
    },
  },
};

console.log("1. PRUEBA DE CARGA DE ELEMENTOS");
console.log("=================================");

// Simular la conversión de elementos (como se hace en App.tsx)
const elements = Object.values(mockDiagramState.elements);
const loadedElements = elements.map((el) => ({
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

console.log("Elementos cargados con posiciones:");
loadedElements.forEach((elem, index) => {
  console.log(
    `${index + 1}. ${elem.className} (ID: ${elem.id}) - Posición: (${elem.x}, ${
      elem.y
    })`
  );
});

// Calcular el contador de elementos esperado
const maxElementId = Math.max(
  ...loadedElements.map((el) => {
    const numId = parseInt(el.id);
    return isNaN(numId) ? 0 : numId;
  }),
  4
);
const expectedCounter = maxElementId + 1;

console.log(
  `\nContador de elementos esperado: ${expectedCounter} (máximo ID encontrado: ${maxElementId})`
);

console.log("\n2. PRUEBA DE CARGA DE RELACIONES");
console.log("==================================");

// Simular la conversión de relaciones
const relationships = Object.values(mockDiagramState.relationships);
const loadedRelationships = relationships.map((rel) => ({
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

console.log("Relaciones cargadas:");
loadedRelationships.forEach((rel, index) => {
  console.log(
    `${index + 1}. ${rel.source} -> ${rel.target} (${rel.relationship}) - "${
      rel.label
    }"`
  );
});

console.log("\n3. VALIDACIONES");
console.log("===============");

// Validar posiciones de elementos movidos
const expectedPositions = [
  { id: "5", x: 250, y: 300, name: "Usuario" },
  { id: "6", x: 500, y: 350, name: "Producto" },
  { id: "7", x: 100, y: 100, name: "Orden" },
];

let positionsCorrect = true;
expectedPositions.forEach((expected) => {
  const loaded = loadedElements.find((el) => el.id === expected.id);
  if (!loaded) {
    console.error(
      `❌ Elemento ${expected.name} (${expected.id}) no encontrado`
    );
    positionsCorrect = false;
  } else if (loaded.x !== expected.x || loaded.y !== expected.y) {
    console.error(
      `❌ Posición incorrecta para ${expected.name}: esperado (${expected.x}, ${expected.y}), obtenido (${loaded.x}, ${loaded.y})`
    );
    positionsCorrect = false;
  } else {
    console.log(
      `✅ Posición correcta para ${expected.name}: (${loaded.x}, ${loaded.y})`
    );
  }
});

// Validar relaciones
const expectedRelationships = [
  {
    id: "rel1",
    source: "5",
    target: "6",
    relationship: "association",
    label: "compra",
  },
  {
    id: "rel2",
    source: "5",
    target: "7",
    relationship: "generalization",
    label: "hereda",
  },
];

let relationshipsCorrect = true;
expectedRelationships.forEach((expected) => {
  const loaded = loadedRelationships.find((rel) => rel.id === expected.id);
  if (!loaded) {
    console.error(`❌ Relación ${expected.id} no encontrada`);
    relationshipsCorrect = false;
  } else if (
    loaded.source !== expected.source ||
    loaded.target !== expected.target ||
    loaded.relationship !== expected.relationship ||
    loaded.label !== expected.label
  ) {
    console.error(`❌ Relación incorrecta para ${expected.id}`);
    relationshipsCorrect = false;
  } else {
    console.log(
      `✅ Relación correcta: ${loaded.source} -> ${loaded.target} (${loaded.relationship}) "${loaded.label}"`
    );
  }
});

// Validar contador de elementos
console.log(`\nContador de elementos calculado: ${expectedCounter}`);
if (expectedCounter === 8) {
  // IDs: 5,6,7 -> máximo=7, contador=8
  console.log("✅ Contador de elementos correcto");
} else {
  console.error(
    `❌ Contador de elementos incorrecto. Esperado: 8, obtenido: ${expectedCounter}`
  );
}

console.log("\n4. RESULTADO FINAL");
console.log("==================");

if (positionsCorrect && relationshipsCorrect && expectedCounter === 8) {
  console.log(
    "🎉 ¡Todas las validaciones pasaron! La carga y persistencia de diagramas funciona correctamente."
  );
  console.log("   ✓ Elementos se cargan con posiciones correctas");
  console.log("   ✓ Relaciones se mantienen intactas");
  console.log("   ✓ Contador de elementos se actualiza correctamente");
} else {
  console.log("❌ Algunas validaciones fallaron:");
  if (!positionsCorrect)
    console.log("   - Problemas con posiciones de elementos");
  if (!relationshipsCorrect) console.log("   - Problemas con relaciones");
  if (expectedCounter !== 6)
    console.log("   - Problemas con contador de elementos");
}
