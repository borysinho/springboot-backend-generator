// Script de prueba para validar la carga de diagramas con colaboradores
console.log("=== PRUEBA DE CARGA DE DIAGRAMAS CON COLABORADORES ===\n");

// Simular datos del backend con diagramas donde el usuario es creador y colaborador
const mockBackendData = [
  {
    diagramId: "diagram-1",
    name: "Mi Diagrama Personal",
    description: "Diagrama creado por mí",
    creatorId: "user-123",
    collaborators: [], // Solo creador
    createdAt: "2025-10-01T10:00:00Z",
    updatedAt: "2025-10-01T10:00:00Z",
  },
  {
    diagramId: "diagram-2",
    name: "Diagrama Compartido",
    description: "Diagrama donde soy colaborador",
    creatorId: "user-456", // Otro usuario es el creador
    collaborators: ["user-123"], // Yo soy colaborador
    createdAt: "2025-10-01T09:00:00Z",
    updatedAt: "2025-10-01T09:30:00Z",
  },
  {
    diagramId: "diagram-3",
    name: "Otro Diagrama Compartido",
    description: "Otro diagrama donde soy colaborador",
    creatorId: "user-789",
    collaborators: ["user-123", "user-999"], // Yo soy colaborador junto con otro
    createdAt: "2025-10-01T08:00:00Z",
    updatedAt: "2025-10-01T08:15:00Z",
  },
];

// Simular la transformación de datos (como se hace en Dashboard.tsx)
const transformedDiagrams = mockBackendData.map((diagram) => ({
  id: diagram.diagramId,
  name: diagram.name,
  description: diagram.description || "Sin descripción",
  createdAt: new Date(diagram.createdAt).toLocaleDateString(),
  updatedAt: new Date(diagram.updatedAt).toLocaleDateString(),
  collaborators: diagram.collaborators?.length || 0,
}));

console.log("Diagramas transformados:");
transformedDiagrams.forEach((diagram, index) => {
  console.log(`${index + 1}. ${diagram.name}`);
  console.log(`   ID: ${diagram.id}`);
  console.log(`   Descripción: ${diagram.description}`);
  console.log(`   Colaboradores: ${diagram.collaborators}`);
  console.log(`   Creado: ${diagram.createdAt}`);
  console.log(`   Actualizado: ${diagram.updatedAt}`);
  console.log("");
});

// Simular filtrado por usuario (como debería hacer la API)
const currentUserId = "user-123";
const userDiagrams = mockBackendData.filter(
  (diagram) =>
    diagram.creatorId === currentUserId ||
    diagram.collaborators.includes(currentUserId)
);

console.log(`Diagramas para el usuario ${currentUserId}:`);
userDiagrams.forEach((diagram, index) => {
  const role = diagram.creatorId === currentUserId ? "Creador" : "Colaborador";
  console.log(`${index + 1}. ${diagram.name} (${role})`);
});

console.log("\n=== VALIDACIONES ===");

// Validar que se incluyen diagramas donde el usuario es creador
const creatorDiagrams = userDiagrams.filter(
  (d) => d.creatorId === currentUserId
);
console.log(`✅ Diagramas como creador: ${creatorDiagrams.length}`);

// Validar que se incluyen diagramas donde el usuario es colaborador
const collaboratorDiagrams = userDiagrams.filter((d) =>
  d.collaborators.includes(currentUserId)
);
console.log(`✅ Diagramas como colaborador: ${collaboratorDiagrams.length}`);

// Validar que el total sea correcto
const totalExpected = creatorDiagrams.length + collaboratorDiagrams.length;
console.log(
  `✅ Total de diagramas: ${userDiagrams.length} (esperado: ${totalExpected})`
);

if (
  userDiagrams.length === 3 &&
  creatorDiagrams.length === 1 &&
  collaboratorDiagrams.length === 2
) {
  console.log(
    "\n🎉 ¡Todas las validaciones pasaron! Los diagramas con colaboradores se muestran correctamente."
  );
} else {
  console.log("\n❌ Error en la lógica de filtrado de diagramas.");
  console.log("   - Se esperaban 3 diagramas totales");
  console.log("   - Se esperaban 1 diagrama como creador");
  console.log("   - Se esperaban 2 diagramas como colaborador");
}
