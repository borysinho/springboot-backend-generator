# Modelo de Gestión de la Transformación

## Descripción General

El `TransformationManager` es un modelo que implementa la **gestión completa de la transformación** de modelos lógicos de base de datos a modelos físicos, siguiendo la metodología OMT (Object Modeling Technique) de James Rumbaugh.

## Funcionalidades Principales

### 1. Mapeo Lógico a Físico

- **Transformación automática**: Convierte diagramas UML lógicos en esquemas físicos de base de datos
- **Aplicación de reglas OMT**: Implementa todas las reglas de transformación documentadas
- **Manejo de tipos**: Mapea tipos UML a tipos SQL apropiados

### 2. Normalización del Diseño Físico

- **Verificación de 1FN**: Asegura valores atómicos
- **Verificación de 2FN**: Elimina dependencias parciales
- **Verificación de 3FN**: Elimina dependencias transitivas
- **Optimización automática**: Añade índices y restricciones necesarias

## Arquitectura del Modelo

### Interfaces Principales

#### PhysicalModel

```typescript
interface PhysicalModel {
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
```

#### TransformationResult

```typescript
interface TransformationResult {
  success: boolean;
  physicalModel?: PhysicalModel;
  errors: string[];
  warnings: string[];
  transformationSteps: string[];
}
```

## Proceso de Transformación

### Paso 1: Mapeo de Clases a Tablas

```typescript
// Clase lógica: Customer
class Customer {
  - customerID: int
  - name: string
  - email: string
}

// Se transforma en tabla física:
CREATE TABLE customer (
  customer_id NUMBER(30) PRIMARY KEY,
  name VARCHAR2(255) NOT NULL,
  email VARCHAR2(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Paso 2: Mapeo de Asociaciones

- **Uno-a-Muchos**: Clave foránea en tabla "muchos"
- **Muchos-a-Muchos**: Tabla intermedia
- **Uno-a-Uno**: Clave foránea en cualquiera

### Paso 3: Mapeo de Generalizaciones

- **Herencia simple**: Tabla por subclase con FK a superclase
- **Añade discriminador**: Para identificar tipo de subclase

### Paso 4: Normalización

- Verifica formas normales 1FN, 2FN, 3FN
- Registra normalizaciones aplicadas

### Paso 5: Optimización

- Añade índices en claves foráneas
- Crea índices en columnas de consulta frecuente
- Genera secuencias para IDs

## Uso del Modelo

### Ejemplo Básico

```typescript
import { transformLogicalToPhysical, generateSQLDDL } from "./models";

// Obtener estado del diagrama del DiagramModel
const diagramState = diagramModel.getState();

// Ejecutar transformación
const result = transformLogicalToPhysical(diagramState);

if (result.success) {
  console.log("Transformación exitosa!");
  console.log("Tablas creadas:", Object.keys(result.physicalModel!.tables));

  // Generar SQL DDL
  const sql = generateSQLDDL(result.physicalModel!);
  console.log("SQL generado:", sql);
} else {
  console.log("Errores:", result.errors);
  console.log("Advertencias:", result.warnings);
}
```

### Seguimiento del Proceso

```typescript
// Los pasos de transformación se registran automáticamente
result.transformationSteps.forEach((step) => {
  console.log(`[TRANSFORM] ${step}`);
});

// Ejemplo de salida:
// [TRANSFORM] Iniciando transformación OMT de modelo lógico a físico
// [TRANSFORM] Mapeando clases a tablas
// [TRANSFORM] Mapeando asociaciones a relaciones
// [TRANSFORM] Aplicando normalización al modelo físico
// [TRANSFORM] Transformación completada exitosamente
```

## Reglas de Transformación Implementadas

### Mapeo de Tipos UML a SQL

```typescript
const typeMapping = {
  string: "VARCHAR2(255)",
  int: "NUMBER(10)",
  integer: "NUMBER(10)",
  long: "NUMBER(19)",
  float: "NUMBER(10,2)",
  double: "NUMBER(15,2)",
  boolean: "CHAR(1)",
  date: "DATE",
  datetime: "TIMESTAMP",
};
```

### Convención de Nombres

- **Clases → Tablas**: `Customer` → `customer`
- **Atributos → Columnas**: `customerID` → `customer_id`
- **IDs artificiales**: `{tableName}_id`

### Índices Automáticos

- Índices en todas las claves foráneas
- Índices en columnas `created_at` para consultas temporales

## Validación y Manejo de Errores

### Tipos de Errores Detectados

- Elementos no encontrados en relaciones
- Atributos mal formateados
- Referencias circulares
- Violaciones de normalización

### Sistema de Advertencias

- Atributos con tipos no reconocidos
- Relaciones sin multiplicidad especificada
- Optimizaciones sugeridas

## Generación de SQL DDL

### Funcionalidades

- **Crear tablas**: Con todas las columnas y restricciones
- **Crear índices**: Para optimización de consultas
- **Crear secuencias**: Para generación de IDs
- **Crear restricciones**: Claves foráneas, únicas, de verificación

### Ejemplo de SQL Generado

```sql
-- Secuencias
CREATE SEQUENCE seq_customer;

-- Tabla
CREATE TABLE customer (
  customer_id NUMBER(30) NOT NULL,
  name VARCHAR2(255) NOT NULL,
  email VARCHAR2(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_customer_created_at ON customer (created_at);

-- Restricciones
ALTER TABLE customer ADD CONSTRAINT pk_customer PRIMARY KEY (customer_id);
```

## Integración con el Sistema

### Dependencias

- **DiagramModel**: Proporciona el estado lógico a transformar
- **UMLValidator**: Valida la estructura del diagrama
- **Documentación OMT**: Reglas de transformación basadas en Rumbaugh

### Casos de Uso

1. **Desarrollo de BD**: Transformar modelos UML en esquemas físicos
2. **Migración de datos**: Generar DDL para nuevas implementaciones
3. **Documentación**: Mantener sincronizados modelos lógicos y físicos
4. **Validación**: Verificar consistencia entre diseño y implementación

## Limitaciones y Consideraciones

### Limitaciones Actuales

- Soporte limitado para herencia múltiple
- Normalización básica (se puede extender)
- Tipos SQL enfocados en Oracle (configurable)

### Mejoras Futuras

- Soporte para otros SGBD (PostgreSQL, MySQL, SQL Server)
- Normalización más avanzada
- Optimización automática de consultas
- Generación de triggers y procedimientos almacenados

## Conclusión

El `TransformationManager` proporciona una implementación completa y automatizada de la transformación de modelos lógicos a físicos siguiendo la metodología OMT, facilitando el desarrollo de bases de datos a partir de modelos UML y asegurando la calidad y normalización del diseño resultante.</content>
<parameter name="filePath">/home/bquiroga/Documents/dev/sw1/examen/joint-js/docs/modelo-gestion-transformacion.md
