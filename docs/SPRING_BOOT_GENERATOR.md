# Generador de Código Spring Boot

Este documento describe cómo usar el sistema de generación de código Spring Boot que crea backends completos basados en diagramas UML.

## Arquitectura Generada

El generador crea un backend Spring Boot completo con la siguiente estructura:

### 📁 Estructura del Proyecto Generado

```
src/
├── main/
│   ├── java/
│   │   └── com/example/{project}/
│   │       ├── controller/
│   │       │   └── {Entity}Controller.java
│   │       ├── entity/
│   │       │   └── {Entity}.java
│   │       ├── repository/
│   │       │   └── {Entity}Repository.java
│   │       ├── service/
│   │       │   └── {Entity}Service.java
│   │       ├── dto/
│   │       │   └── {Entity}DTO.java
│   │       └── mapper/
│   │           └── {Entity}Mapper.java
│   └── resources/
│       ├── application.properties
│       └── data.sql
└── pom.xml
```

### 🏗️ Componentes Generados

#### 1. **Entidades JPA** (`entity/`)

- Anotaciones JPA completas (`@Entity`, `@Table`, `@Id`, `@Column`, etc.)
- Relaciones JPA (`@OneToOne`, `@OneToMany`, `@ManyToOne`, `@ManyToMany`)
- Lombok para reducir código boilerplate (`@Data`, `@NoArgsConstructor`, `@AllArgsConstructor`)

#### 2. **Repositories** (`repository/`)

- Interfaces que extienden `JpaRepository`
- Métodos CRUD básicos incluidos
- Listos para consultas personalizadas

#### 3. **Services** (`service/`)

- Lógica de negocio básica
- Inyección de dependencias con `@Autowired`
- Métodos CRUD completos

#### 4. **Controllers REST** (`controller/`)

- Endpoints RESTful completos
- `@RestController` con mapeos HTTP
- Manejo de respuestas HTTP apropiadas
- Integración con DTOs y Mappers

#### 5. **DTOs** (`dto/`)

- Objetos de transferencia de datos
- Lombok para getters/setters
- Separación clara entre entidades y API

#### 6. **Mappers** (`mapper/`)

- Conversión entre entidades y DTOs
- Métodos estáticos para mapeo
- Soporte para listas

#### 7. **Configuración**

- `application.properties` con configuración H2 y JPA
- `pom.xml` con todas las dependencias necesarias
- `data.sql` con datos de ejemplo

## 🚀 Uso del Generador

### Generación Básica

```typescript
import {
  transformLogicalToPhysical,
  generateSpringBootProject,
} from "./server/models/index.js";

// 1. Crear estado del diagrama
const diagramState = {
  elements: {
    /* tus elementos UML */
  },
  relationships: {
    /* tus relaciones */
  },
  version: 1,
  lastModified: Date.now(),
};

// 2. Transformar a modelo físico
const transformation = transformLogicalToPhysical(diagramState);

// 3. Generar código Spring Boot
const springBootCode = generateSpringBootProject(
  transformation.physicalModel!,
  "com.example.myapp", // package base
  "my-app" // nombre del proyecto
);

// 4. Los archivos están en springBootCode como un Record<string, string>
console.log(Object.keys(springBootCode)); // Lista de archivos generados
```

### Generación por Versiones

```typescript
import { DiagramOperationLogModel } from "./server/models/index.js";

const operationLog = new DiagramOperationLogModel();

// Generar código para una versión específica
const versionCode = await operationLog.generateSpringBootCodeForVersion(
  "diagram-id",
  2, // versión
  "com.example.myapp",
  "my-app-v2"
);
```

### Generación Incremental

```typescript
// Generar código incremental entre versiones
const incrementalCode = await operationLog.generateIncrementalSpringBootCode(
  "diagram-id",
  1, // versión base
  3, // versión target
  "com.example.myapp",
  "my-app-incremental"
);
```

## 📋 Características Soportadas

### Tipos de Datos UML → Java

- `String` → `String`
- `int/integer` → `Integer`
- `long` → `Long`
- `float` → `BigDecimal`
- `double` → `BigDecimal`
- `boolean` → `Boolean`
- `date` → `LocalDate`
- `datetime` → `LocalDateTime`

### Relaciones UML → JPA

- **Asociación**: `@ManyToOne` / `@OneToMany`
- **Agregación**: Tratada como asociación
- **Composición**: Tratada como asociación
- **Generalización**: Herencia con discriminador
- **Many-to-Many**: Tabla intermedia con `@ManyToMany`

### Normalización

- Primera Forma Normal (1FN)
- Segunda Forma Normal (2FN)
- Tercera Forma Normal (3FN)
- Índices automáticos en claves foráneas

## 🗃️ Base de Datos

### Configuración por Defecto

- **Base de datos**: H2 (en memoria)
- **JPA**: Hibernate con DDL auto=none
- **Consola H2**: Disponible en `/h2-console`

### Estrategia Database-First

1. El DDL generado se ejecuta primero para crear las tablas
2. Luego se generan las entidades JPA basadas en las tablas existentes
3. Las entidades se mapean exactamente a la estructura de la base de datos

## 📊 Manejo de Versiones

### Versionado Automático

- Cada operación en el diagrama incrementa la versión
- Las versiones se rastrean por diagrama
- Historial completo de cambios disponible

### Generación Incremental

- Genera solo código para cambios entre versiones
- Útil para actualizaciones continuas del backend
- Mantiene consistencia con versiones anteriores

## 🧪 Datos de Ejemplo

### Inserción Automática

- Se generan 3 registros por tabla
- Datos realistas basados en tipos de campos
- Foreign keys resueltas automáticamente

### Archivo `data.sql`

```sql
-- Sample Data
INSERT INTO usuario (id, nombre, email) VALUES (1, 'Sample String 1', 'Sample String 1');
INSERT INTO producto (id, nombre, precio) VALUES (1, 'Sample String 1', 10.5);
-- ... más datos de ejemplo
```

## 🔧 Personalización

### Cambiar Package Base

```typescript
generateSpringBootProject(
  physicalModel,
  "com.mycompany.myproject", // tu package
  "my-project-name"
);
```

### Configuración de Base de Datos

Editar `application.properties` generado:

```properties
# Cambiar a PostgreSQL
spring.datasource.url=jdbc:postgresql://localhost:5432/myapp
spring.datasource.driver-class-name=org.postgresql.Driver
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
```

## 📝 Ejemplo Completo

Ver `examples/spring-boot-generation-example.ts` para un ejemplo completo de uso.

## 🎯 Próximos Pasos

- [ ] Soporte para más tipos de relaciones JPA
- [ ] Validaciones Bean personalizables
- [ ] Generación de tests unitarios
- [ ] Soporte para diferentes estrategias de herencia JPA
- [ ] Integración con Spring Security
- [ ] Generación de documentación OpenAPI/Swagger</content>
      <parameter name="filePath">/home/bquiroga/Documents/dev/sw1/examen/joint-js/docs/SPRING_BOOT_GENERATOR.md
