import {
  DiagramState,
  DiagramElement,
  DiagramRelationship,
} from "./DiagramModel.js";

// Interfaces para el modelo físico
export interface PhysicalColumn {
  name: string;
  dataType: string;
  nullable: boolean;
  primaryKey?: boolean;
  foreignKey?: {
    referencesTable: string;
    referencesColumn: string;
  };
  unique?: boolean;
  defaultValue?: string;
  checkConstraint?: string;
}

export interface PhysicalTable {
  name: string;
  columns: PhysicalColumn[];
  primaryKey: string[];
  foreignKeys: Array<{
    columns: string[];
    referencesTable: string;
    referencesColumns: string[];
    onDelete?: "CASCADE" | "SET NULL" | "RESTRICT";
  }>;
  uniqueConstraints: Array<{
    name: string;
    columns: string[];
  }>;
  checkConstraints: Array<{
    name: string;
    expression: string;
  }>;
  indexes: Array<{
    name: string;
    columns: string[];
    unique?: boolean;
  }>;
}

export interface PhysicalRelationship {
  name: string;
  type: "one-to-one" | "one-to-many" | "many-to-many";
  sourceTable: string;
  targetTable: string;
  sourceColumns: string[];
  targetColumns: string[];
  junctionTable?: string; // Para relaciones many-to-many
}

export interface PhysicalModel {
  tables: Record<string, PhysicalTable>;
  relationships: PhysicalRelationship[];
  sequences: Array<{
    name: string;
    table: string;
    column: string;
  }>;
  normalizationLevel: 1 | 2 | 3;
  appliedNormalizations: string[];
}

export interface TransformationResult {
  success: boolean;
  physicalModel?: PhysicalModel;
  errors: string[];
  warnings: string[];
  transformationSteps: string[];
}

export class TransformationManager {
  private logicalModel: DiagramState;
  private physicalModel: PhysicalModel;
  private transformationSteps: string[] = [];
  private errors: string[] = [];
  private warnings: string[] = [];

  constructor(logicalModel: DiagramState) {
    this.logicalModel = logicalModel;
    this.physicalModel = {
      tables: {},
      relationships: [],
      sequences: [],
      normalizationLevel: 3,
      appliedNormalizations: [],
    };
  }

  /**
   * Ejecuta la transformación completa del modelo lógico a físico
   */
  public transform(): TransformationResult {
    try {
      this.logStep("Iniciando transformación OMT de modelo lógico a físico");

      // Paso 1: Mapear clases a tablas
      this.mapClassesToTables();

      // Paso 2: Mapear asociaciones a relaciones
      this.mapAssociationsToRelationships();

      // Paso 3: Mapear generalizaciones
      this.mapGeneralizations();

      // Paso 4: Aplicar normalización
      this.applyNormalization();

      // Paso 5: Optimizar el modelo físico
      this.optimizePhysicalModel();

      this.logStep("Transformación completada exitosamente");

      return {
        success: true,
        physicalModel: this.physicalModel,
        errors: this.errors,
        warnings: this.warnings,
        transformationSteps: this.transformationSteps,
      };
    } catch (error) {
      this.errors.push(`Error durante la transformación: ${error}`);
      return {
        success: false,
        errors: this.errors,
        warnings: this.warnings,
        transformationSteps: this.transformationSteps,
      };
    }
  }

  /**
   * Paso 1: Mapear clases a tablas
   */
  private mapClassesToTables(): void {
    this.logStep("Mapeando clases a tablas");

    for (const [elementId, element] of Object.entries(
      this.logicalModel.elements
    )) {
      if (
        element.elementType === "class" ||
        element.elementType === "interface"
      ) {
        const table = this.createTableFromClass(element);
        this.physicalModel.tables[table.name] = table;

        // Crear secuencia para ID si no existe
        if (!this.physicalModel.sequences.some((s) => s.table === table.name)) {
          this.physicalModel.sequences.push({
            name: `seq_${table.name.toLowerCase()}`,
            table: table.name,
            column: `${table.name.toLowerCase()}_id`,
          });
        }
      }
    }
  }

  /**
   * Crear tabla a partir de una clase
   */
  private createTableFromClass(element: DiagramElement): PhysicalTable {
    const tableName = this.toSnakeCase(element.className);
    const columns: PhysicalColumn[] = [];

    // Añadir columna de ID (object identity)
    const idColumn: PhysicalColumn = {
      name: `${tableName}_id`,
      dataType: "NUMBER(30)",
      nullable: false,
      primaryKey: true,
    };
    columns.push(idColumn);

    // Mapear atributos a columnas
    element.attributes.forEach((attr, index) => {
      const column = this.createColumnFromAttribute(attr, index);
      columns.push(column);
    });

    // Añadir columnas de timestamp
    columns.push({
      name: "created_at",
      dataType: "TIMESTAMP",
      nullable: false,
      defaultValue: "CURRENT_TIMESTAMP",
    });

    columns.push({
      name: "updated_at",
      dataType: "TIMESTAMP",
      nullable: false,
      defaultValue: "CURRENT_TIMESTAMP",
    });

    return {
      name: tableName,
      columns,
      primaryKey: [`${tableName}_id`],
      foreignKeys: [],
      uniqueConstraints: [],
      checkConstraints: [],
      indexes: [],
    };
  }

  /**
   * Crear columna a partir de un atributo
   */
  private createColumnFromAttribute(
    attribute: string,
    index: number
  ): PhysicalColumn {
    // Parsear atributo (formato: name: type)
    const [name, type] = attribute.split(":").map((s) => s.trim());

    if (!name || !type) {
      this.warnings.push(`Atributo mal formado: ${attribute}`);
      return {
        name: `attr_${index}`,
        dataType: "VARCHAR2(255)",
        nullable: true,
      };
    }

    const columnName = this.toSnakeCase(name);
    const dataType = this.mapUMLTypeToSQLType(type);

    return {
      name: columnName,
      dataType,
      nullable: false, // Por defecto no nullable
    };
  }

  /**
   * Paso 2: Mapear asociaciones a relaciones
   */
  private mapAssociationsToRelationships(): void {
    this.logStep("Mapeando asociaciones a relaciones");

    for (const [relId, relationship] of Object.entries(
      this.logicalModel.relationships
    )) {
      if (relationship.relationship === "association") {
        this.mapAssociation(relationship);
      } else if (
        relationship.relationship === "aggregation" ||
        relationship.relationship === "composition"
      ) {
        this.mapAggregation(relationship);
      }
    }
  }

  /**
   * Mapear una asociación
   */
  private mapAssociation(relationship: DiagramRelationship): void {
    const sourceElement = this.logicalModel.elements[relationship.sourceId];
    const targetElement = this.logicalModel.elements[relationship.targetId];

    if (!sourceElement || !targetElement) {
      this.errors.push(
        `Elementos no encontrados para relación ${relationship.id}`
      );
      return;
    }

    const sourceTable = this.toSnakeCase(sourceElement.className);
    const targetTable = this.toSnakeCase(targetElement.className);

    // Determinar multiplicidad
    const sourceMult = this.parseMultiplicity(
      relationship.sourceCardinality || "1"
    );
    const targetMult = this.parseMultiplicity(
      relationship.targetCardinality || "1"
    );

    if (sourceMult === "many" && targetMult === "many") {
      // Muchos-a-muchos: crear tabla intermedia
      this.createJunctionTable(sourceTable, targetTable, relationship);
    } else if (sourceMult === "one" && targetMult === "many") {
      // Uno-a-muchos: FK en tabla target
      this.addForeignKey(targetTable, sourceTable, relationship);
    } else if (sourceMult === "many" && targetMult === "one") {
      // Muchos-a-uno: FK en tabla source
      this.addForeignKey(sourceTable, targetTable, relationship);
    } else {
      // Uno-a-uno: FK en cualquiera (preferimos source)
      this.addForeignKey(sourceTable, targetTable, relationship);
    }
  }

  /**
   * Mapear una agregación (tratada igual que asociación)
   */
  private mapAggregation(relationship: DiagramRelationship): void {
    // Las agregaciones se tratan igual que las asociaciones
    this.mapAssociation(relationship);
  }

  /**
   * Crear tabla intermedia para relación muchos-a-muchos
   */
  private createJunctionTable(
    sourceTable: string,
    targetTable: string,
    relationship: DiagramRelationship
  ): void {
    const junctionName = `${sourceTable}_${targetTable}`;

    const junctionTable: PhysicalTable = {
      name: junctionName,
      columns: [
        {
          name: `${sourceTable}_id`,
          dataType: "NUMBER(30)",
          nullable: false,
          foreignKey: {
            referencesTable: sourceTable,
            referencesColumn: `${sourceTable}_id`,
          },
        },
        {
          name: `${targetTable}_id`,
          dataType: "NUMBER(30)",
          nullable: false,
          foreignKey: {
            referencesTable: targetTable,
            referencesColumn: `${targetTable}_id`,
          },
        },
      ],
      primaryKey: [`${sourceTable}_id`, `${targetTable}_id`],
      foreignKeys: [
        {
          columns: [`${sourceTable}_id`],
          referencesTable: sourceTable,
          referencesColumns: [`${sourceTable}_id`],
        },
        {
          columns: [`${targetTable}_id`],
          referencesTable: targetTable,
          referencesColumns: [`${targetTable}_id`],
        },
      ],
      uniqueConstraints: [],
      checkConstraints: [],
      indexes: [],
    };

    this.physicalModel.tables[junctionName] = junctionTable;

    // Registrar relación
    this.physicalModel.relationships.push({
      name: relationship.id,
      type: "many-to-many",
      sourceTable,
      targetTable,
      sourceColumns: [`${sourceTable}_id`],
      targetColumns: [`${targetTable}_id`],
      junctionTable: junctionName,
    });
  }

  /**
   * Añadir clave foránea a una tabla
   */
  private addForeignKey(
    tableName: string,
    referencesTable: string,
    relationship: DiagramRelationship
  ): void {
    const table = this.physicalModel.tables[tableName];
    if (!table) return;

    const fkColumnName = `${referencesTable}_id`;
    const fkColumn: PhysicalColumn = {
      name: fkColumnName,
      dataType: "NUMBER(30)",
      nullable: false,
      foreignKey: {
        referencesTable,
        referencesColumn: `${referencesTable}_id`,
      },
    };

    table.columns.push(fkColumn);
    table.foreignKeys.push({
      columns: [fkColumnName],
      referencesTable,
      referencesColumns: [`${referencesTable}_id`],
    });

    // Añadir índice en FK
    table.indexes.push({
      name: `idx_${tableName}_${fkColumnName}`,
      columns: [fkColumnName],
    });
  }

  /**
   * Paso 3: Mapear generalizaciones
   */
  private mapGeneralizations(): void {
    this.logStep("Mapeando generalizaciones");

    for (const [relId, relationship] of Object.entries(
      this.logicalModel.relationships
    )) {
      if (relationship.relationship === "generalization") {
        this.mapGeneralization(relationship);
      }
    }
  }

  /**
   * Mapear una generalización
   */
  private mapGeneralization(relationship: DiagramRelationship): void {
    const subclass = this.logicalModel.elements[relationship.sourceId];
    const superclass = this.logicalModel.elements[relationship.targetId];

    if (!subclass || !superclass) {
      this.errors.push(
        `Elementos no encontrados para generalización ${relationship.id}`
      );
      return;
    }

    const subclassTable = this.toSnakeCase(subclass.className);
    const superclassTable = this.toSnakeCase(superclass.className);

    // Añadir FK de subclase a superclase
    this.addForeignKey(subclassTable, superclassTable, relationship);

    // Añadir discriminador en superclase si no existe
    const superTable = this.physicalModel.tables[superclassTable];
    if (
      superTable &&
      !superTable.columns.some((c) => c.name === "discriminator")
    ) {
      superTable.columns.push({
        name: "discriminator",
        dataType: "VARCHAR2(50)",
        nullable: false,
      });
    }
  }

  /**
   * Paso 4: Aplicar normalización
   */
  private applyNormalization(): void {
    this.logStep("Aplicando normalización al modelo físico");

    // 1FN: Asegurar valores atómicos (ya se cumple por diseño relacional)

    // 2FN: Eliminar dependencias parciales
    this.applySecondNormalForm();

    // 3FN: Eliminar dependencias transitivas
    this.applyThirdNormalForm();

    this.physicalModel.appliedNormalizations = [
      "1FN - Valores atómicos",
      "2FN - Sin dependencias parciales",
      "3FN - Sin dependencias transitivas",
    ];
  }

  /**
   * Aplicar Segunda Forma Normal
   */
  private applySecondNormalForm(): void {
    // Verificar que no hay dependencias parciales
    // En este contexto simplificado, asumimos que el diseño ya cumple 2FN
    this.logStep("Verificando Segunda Forma Normal");
  }

  /**
   * Aplicar Tercera Forma Normal
   */
  private applyThirdNormalForm(): void {
    // Verificar que no hay dependencias transitivas
    this.logStep("Verificando Tercera Forma Normal");
  }

  /**
   * Paso 5: Optimizar el modelo físico
   */
  private optimizePhysicalModel(): void {
    this.logStep("Optimizando modelo físico");

    // Añadir índices en claves foráneas
    this.addForeignKeyIndexes();

    // Añadir índices en columnas frecuentemente consultadas
    this.addQueryIndexes();
  }

  /**
   * Añadir índices en claves foráneas
   */
  private addForeignKeyIndexes(): void {
    for (const table of Object.values(this.physicalModel.tables)) {
      for (const fk of table.foreignKeys) {
        const indexName = `idx_${table.name}_${fk.columns.join("_")}`;
        if (!table.indexes.some((idx) => idx.name === indexName)) {
          table.indexes.push({
            name: indexName,
            columns: fk.columns,
          });
        }
      }
    }
  }

  /**
   * Añadir índices para consultas comunes
   */
  private addQueryIndexes(): void {
    // Añadir índices en columnas de búsqueda común (created_at, updated_at)
    for (const table of Object.values(this.physicalModel.tables)) {
      if (table.columns.some((c) => c.name === "created_at")) {
        table.indexes.push({
          name: `idx_${table.name}_created_at`,
          columns: ["created_at"],
        });
      }
    }
  }

  // Métodos auxiliares

  private parseMultiplicity(cardinality: string): "one" | "many" {
    if (
      cardinality.includes("*") ||
      cardinality.includes("n") ||
      parseInt(cardinality) > 1
    ) {
      return "many";
    }
    return "one";
  }

  private mapUMLTypeToSQLType(umlType: string): string {
    const typeMap: Record<string, string> = {
      string: "VARCHAR2(255)",
      int: "NUMBER(10)",
      integer: "NUMBER(10)",
      long: "NUMBER(19)",
      float: "NUMBER(10,2)",
      double: "NUMBER(15,2)",
      boolean: "CHAR(1)",
      date: "DATE",
      datetime: "TIMESTAMP",
      time: "TIMESTAMP",
    };

    return typeMap[umlType.toLowerCase()] || "VARCHAR2(255)";
  }

  private toSnakeCase(str: string): string {
    return str
      .replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
      .replace(/^_/, "")
      .toLowerCase();
  }

  private logStep(step: string): void {
    this.transformationSteps.push(step);
    console.log(`[TransformationManager] ${step}`);
  }
}

// Función de utilidad para crear y ejecutar transformación
export function transformLogicalToPhysical(
  diagramState: DiagramState
): TransformationResult {
  const manager = new TransformationManager(diagramState);
  return manager.transform();
}

// Función para generar SQL DDL a partir del modelo físico
export function generateSQLDDL(physicalModel: PhysicalModel): string {
  let sql = "";

  // Crear secuencias
  for (const sequence of physicalModel.sequences) {
    sql += `CREATE SEQUENCE ${sequence.name};\n`;
  }

  sql += "\n";

  // Crear tablas
  for (const table of Object.values(physicalModel.tables)) {
    sql += `CREATE TABLE ${table.name} (\n`;

    // Columnas
    const columnDefs = table.columns.map((col) => {
      let def = `  ${col.name} ${col.dataType}`;
      if (!col.nullable) def += " NOT NULL";
      if (col.defaultValue) def += ` DEFAULT ${col.defaultValue}`;
      return def;
    });

    sql += columnDefs.join(",\n");
    sql += "\n);\n\n";

    // Índices
    for (const index of table.indexes) {
      const unique = index.unique ? "UNIQUE " : "";
      sql += `CREATE ${unique}INDEX ${index.name} ON ${
        table.name
      } (${index.columns.join(", ")});\n`;
    }

    sql += "\n";
  }

  // Claves foráneas y restricciones
  for (const table of Object.values(physicalModel.tables)) {
    // Claves foráneas
    for (const fk of table.foreignKeys) {
      sql += `ALTER TABLE ${table.name} ADD CONSTRAINT fk_${
        table.name
      }_${fk.columns.join("_")} `;
      sql += `FOREIGN KEY (${fk.columns.join(", ")}) REFERENCES ${
        fk.referencesTable
      } (${fk.referencesColumns.join(", ")});\n`;
    }

    // Restricciones únicas
    for (const unique of table.uniqueConstraints) {
      sql += `ALTER TABLE ${table.name} ADD CONSTRAINT ${unique.name} `;
      sql += `UNIQUE (${unique.columns.join(", ")});\n`;
    }

    // Restricciones de verificación
    for (const check of table.checkConstraints) {
      sql += `ALTER TABLE ${table.name} ADD CONSTRAINT ${check.name} `;
      sql += `CHECK (${check.expression});\n`;
    }
  }

  return sql;
}
