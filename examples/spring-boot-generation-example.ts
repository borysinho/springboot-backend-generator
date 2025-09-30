/**
 * Ejemplo simplificado de uso del generador de código Spring Boot
 */
async function exampleSpringBootGeneration() {
  console.log(
    "🚀 Iniciando ejemplo simplificado de generación de código Spring Boot\n"
  );

  // Crear un diagrama de ejemplo simple
  const diagramState = {
    elements: {
      user: {
        id: "user",
        className: "Usuario",
        attributes: ["id: Long", "nombre: String", "email: String"],
        methods: ["getNombre(): String", "setNombre(String): void"],
        elementType: "class" as const,
        position: { x: 100, y: 100 },
      },
      product: {
        id: "product",
        className: "Producto",
        attributes: ["id: Long", "nombre: String", "precio: Double"],
        methods: ["getPrecio(): Double", "setPrecio(Double): void"],
        elementType: "class" as const,
        position: { x: 200, y: 100 },
      },
    },
    relationships: {
      "user-product": {
        id: "user-product",
        sourceId: "user",
        targetId: "product",
        relationship: "association" as const,
        sourceCardinality: "1",
        targetCardinality: "*",
      },
    },
    version: 1,
    lastModified: Date.now(),
  };

  console.log("🏗️  Generando código Spring Boot completo...");

  // Importar dinámicamente para evitar problemas de compilación
  const { transformLogicalToPhysical } = await import(
    "../server/models/TransformationManager.js"
  );
  const { generateSpringBootProject } = await import(
    "../server/models/CodeGenerationUtils.js"
  );

  // Transformar a modelo físico
  const transformationResult = transformLogicalToPhysical(diagramState);

  if (!transformationResult.success) {
    console.error(
      "❌ Error en la transformación:",
      transformationResult.errors
    );
    return;
  }

  // Generar código Spring Boot
  const springBootCode = generateSpringBootProject(
    transformationResult.physicalModel!,
    "com.example.shop",
    "ecommerce-app"
  );

  console.log(
    `✅ Generado ${
      Object.keys(springBootCode).length
    } archivos de código Spring Boot`
  );

  // Mostrar algunos archivos generados
  console.log("\n📁 Archivos generados:");
  Object.keys(springBootCode)
    .slice(0, 10)
    .forEach((file) => {
      console.log(`  - ${file}`);
    });

  if (Object.keys(springBootCode).length > 10) {
    console.log(
      `  ... y ${Object.keys(springBootCode).length - 10} archivos más`
    );
  }

  // Mostrar contenido de un archivo de ejemplo
  const entityFile = Object.keys(springBootCode).find((f) =>
    f.includes("Usuario.java")
  );
  if (entityFile) {
    console.log(`\n📄 Contenido de ${entityFile}:`);
    console.log(springBootCode[entityFile].substring(0, 500) + "...");
  }

  console.log("\n🎉 ¡Ejemplo completado exitosamente!");
}

// Ejecutar el ejemplo
exampleSpringBootGeneration().catch(console.error);
