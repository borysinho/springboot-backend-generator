import { PhysicalModel, PhysicalTable } from "./TransformationManager.js";
import { SpringBootCodeGenerator } from "./SpringBootCodeGenerator.js";

// Función para generar código Spring Boot completo desde un modelo físico
export function generateSpringBootProject(
  physicalModel: PhysicalModel,
  basePackage?: string,
  projectName?: string
): Record<string, string> {
  const generator = new SpringBootCodeGenerator(
    physicalModel,
    basePackage,
    projectName
  );
  return generator.generateJavaCode();
}

// Función para generar código Spring Boot incremental
export function generateIncrementalSpringBootCode(
  basePhysicalModel: PhysicalModel,
  incrementalPhysicalModel: PhysicalModel,
  basePackage?: string,
  projectName?: string
): Record<string, string> {
  // Para incrementales, generamos código solo para las nuevas tablas
  const newTables: Record<string, PhysicalTable> = {};

  for (const [tableName, table] of Object.entries(
    incrementalPhysicalModel.tables
  )) {
    if (!basePhysicalModel.tables[tableName]) {
      newTables[tableName] = table;
    }
  }

  const incrementalModel: PhysicalModel = {
    ...incrementalPhysicalModel,
    tables: { ...basePhysicalModel.tables, ...newTables },
  };

  return generateSpringBootProject(incrementalModel, basePackage, projectName);
}
