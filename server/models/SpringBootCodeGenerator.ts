import {
  PhysicalModel,
  PhysicalTable,
  PhysicalColumn,
} from "./TransformationManager.js";

// Interfaces para el código generado
export interface SpringBootEntity {
  className: string;
  packageName: string;
  tableName: string;
  fields: SpringBootField[];
  imports: string[];
  annotations: string[];
}

export interface SpringBootField {
  name: string;
  type: string;
  columnName: string;
  annotations: string[];
  nullable: boolean;
  primaryKey?: boolean;
  foreignKey?: {
    referencedEntity: string;
    referencedField: string;
    relationship: "OneToOne" | "OneToMany" | "ManyToOne" | "ManyToMany";
  };
}

export interface SpringBootRepository {
  className: string;
  packageName: string;
  entityClass: string;
  methods: string[];
}

export interface SpringBootService {
  className: string;
  packageName: string;
  entityClass: string;
  repositoryClass: string;
  methods: string[];
}

export interface SpringBootController {
  className: string;
  packageName: string;
  entityClass: string;
  serviceClass: string;
  dtoClass: string;
  mapperClass: string;
  endpoints: SpringBootEndpoint[];
}

export interface SpringBootEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  methodName: string;
  parameters: string[];
  returnType: string;
}

export interface SpringBootDTO {
  className: string;
  packageName: string;
  fields: SpringBootField[];
  imports: string[];
}

export interface SpringBootMapper {
  className: string;
  packageName: string;
  entityClass: string;
  dtoClass: string;
  methods: string[];
}

export interface SpringBootGeneratedCode {
  entities: SpringBootEntity[];
  repositories: SpringBootRepository[];
  services: SpringBootService[];
  controllers: SpringBootController[];
  dtos: SpringBootDTO[];
  mappers: SpringBootMapper[];
  applicationProperties: string;
  pomXml: string;
  sampleData: string;
}

export class SpringBootCodeGenerator {
  private physicalModel: PhysicalModel;
  private basePackage: string;
  private projectName: string;

  constructor(
    physicalModel: PhysicalModel,
    basePackage: string = "com.example.demo",
    projectName: string = "demo"
  ) {
    this.physicalModel = physicalModel;
    this.basePackage = basePackage;
    this.projectName = projectName;
  }

  /**
   * Genera todo el código Spring Boot
   */
  public generateCode(): SpringBootGeneratedCode {
    const entities = this.generateEntities();
    const dtos = this.generateDTOs(entities);
    const mappers = this.generateMappers(entities, dtos);
    const repositories = this.generateRepositories(entities);
    const services = this.generateServices(entities, repositories);
    const controllers = this.generateControllers(
      entities,
      services,
      dtos,
      mappers
    );

    return {
      entities,
      repositories,
      services,
      controllers,
      dtos,
      mappers,
      applicationProperties: this.generateApplicationProperties(),
      pomXml: this.generatePomXml(),
      sampleData: this.generateSampleData(entities),
    };
  }

  /**
   * Genera entidades JPA
   */
  private generateEntities(): SpringBootEntity[] {
    const entities: SpringBootEntity[] = [];

    for (const [tableName, table] of Object.entries(
      this.physicalModel.tables
    )) {
      const entity = this.generateEntity(tableName, table);
      entities.push(entity);
    }

    return entities;
  }

  /**
   * Genera una entidad JPA
   */
  private generateEntity(
    tableName: string,
    table: PhysicalTable
  ): SpringBootEntity {
    const className = this.toPascalCase(tableName);
    const fields: SpringBootField[] = [];
    const imports = new Set<string>();
    const annotations: string[] = [];

    // Anotaciones de clase
    annotations.push("@Entity");
    annotations.push(`@Table(name = "${tableName}")`);
    imports.add("jakarta.persistence.Entity");
    imports.add("jakarta.persistence.Table");
    imports.add("java.time.LocalDateTime");

    // Procesar columnas
    for (const column of table.columns) {
      const field = this.generateField(column, table);
      fields.push(field);

      // Agregar imports necesarios
      field.annotations.forEach((ann) => {
        if (ann.includes("@Id")) imports.add("jakarta.persistence.Id");
        if (ann.includes("@GeneratedValue")) {
          imports.add("jakarta.persistence.GeneratedValue");
          imports.add("jakarta.persistence.GenerationType");
        }
        if (ann.includes("@Column")) imports.add("jakarta.persistence.Column");
        if (ann.includes("@OneToOne"))
          imports.add("jakarta.persistence.OneToOne");
        if (ann.includes("@OneToMany"))
          imports.add("jakarta.persistence.OneToMany");
        if (ann.includes("@ManyToOne"))
          imports.add("jakarta.persistence.ManyToOne");
        if (ann.includes("@ManyToMany"))
          imports.add("jakarta.persistence.ManyToMany");
        if (ann.includes("@JoinColumn"))
          imports.add("jakarta.persistence.JoinColumn");
        if (ann.includes("@JoinTable"))
          imports.add("jakarta.persistence.JoinTable");
      });
    }

    return {
      className,
      packageName: `${this.basePackage}.entity`,
      tableName,
      fields,
      imports: Array.from(imports),
      annotations,
    };
  }

  /**
   * Genera un campo de entidad
   */
  private generateField(
    column: PhysicalColumn,
    table: PhysicalTable
  ): SpringBootField {
    const fieldName = this.toCamelCase(column.name);
    const fieldType = this.mapSQLTypeToJavaType(column.dataType);
    const annotations: string[] = [];

    // Anotación @Column
    let columnAnnotation = `@Column(name = "${column.name}"`;
    if (!column.nullable) columnAnnotation += ", nullable = false";
    columnAnnotation += ")";
    annotations.push(columnAnnotation);

    // Anotaciones de clave primaria
    let primaryKey = false;
    if (table.primaryKey.includes(column.name)) {
      annotations.unshift("@Id");
      annotations.push("@GeneratedValue(strategy = GenerationType.IDENTITY)");
      primaryKey = true;
    }

    // Anotaciones de clave foránea
    let foreignKey: SpringBootField["foreignKey"];
    const fk = table.foreignKeys.find((fk) => fk.columns.includes(column.name));
    if (fk) {
      const referencedEntity = this.toPascalCase(fk.referencesTable);
      const referencedField = this.toCamelCase(fk.referencesColumns[0]);

      // Determinar tipo de relación basado en la multiplicidad
      const relationship = this.determineRelationshipType();

      if (relationship === "ManyToOne") {
        annotations.push(`@ManyToOne(fetch = FetchType.LAZY)`);
        annotations.push(`@JoinColumn(name = "${column.name}")`);
        foreignKey = {
          referencedEntity,
          referencedField,
          relationship: "ManyToOne",
        };
      }
    }

    return {
      name: fieldName,
      type: fieldType,
      columnName: column.name,
      annotations,
      nullable: column.nullable,
      primaryKey,
      foreignKey,
    };
  }

  /**
   * Genera DTOs
   */
  private generateDTOs(entities: SpringBootEntity[]): SpringBootDTO[] {
    return entities.map((entity) => ({
      className: `${entity.className}DTO`,
      packageName: `${this.basePackage}.dto`,
      fields: entity.fields.map((field) => ({
        ...field,
        annotations: [], // DTOs no tienen anotaciones JPA
      })),
      imports: ["lombok.Data"],
    }));
  }

  /**
   * Genera Mappers
   */
  private generateMappers(
    entities: SpringBootEntity[],
    dtos: SpringBootDTO[]
  ): SpringBootMapper[] {
    return entities.map((entity, index) => {
      const dto = dtos[index];
      return {
        className: `${entity.className}Mapper`,
        packageName: `${this.basePackage}.mapper`,
        entityClass: entity.className,
        dtoClass: dto.className,
        methods: [
          `public static ${dto.className} toDTO(${entity.className} entity)`,
          `public static ${entity.className} toEntity(${dto.className} dto)`,
          `public static List<${dto.className}> toDTOList(List<${entity.className}> entities)`,
          `public static List<${entity.className}> toEntityList(List<${dto.className}> dtos)`,
        ],
      };
    });
  }

  /**
   * Genera Repositories
   */
  private generateRepositories(
    entities: SpringBootEntity[]
  ): SpringBootRepository[] {
    return entities.map((entity) => ({
      className: `${entity.className}Repository`,
      packageName: `${this.basePackage}.repository`,
      entityClass: entity.className,
      methods: [
        `Optional<${entity.className}> findById(Long id)`,
        `List<${entity.className}> findAll()`,
        `<S extends ${entity.className}> S save(S entity)`,
        `void deleteById(Long id)`,
        `boolean existsById(Long id)`,
      ],
    }));
  }

  /**
   * Genera Services
   */
  private generateServices(
    entities: SpringBootEntity[],
    repositories: SpringBootRepository[]
  ): SpringBootService[] {
    return entities.map((entity, index) => {
      const repository = repositories[index];
      return {
        className: `${entity.className}Service`,
        packageName: `${this.basePackage}.service`,
        entityClass: entity.className,
        repositoryClass: repository.className,
        methods: [
          `public List<${entity.className}> findAll()`,
          `public Optional<${entity.className}> findById(Long id)`,
          `public ${entity.className} save(${entity.className} entity)`,
          `public void deleteById(Long id)`,
        ],
      };
    });
  }

  /**
   * Genera Controllers
   */
  private generateControllers(
    entities: SpringBootEntity[],
    services: SpringBootService[],
    dtos: SpringBootDTO[],
    mappers: SpringBootMapper[]
  ): SpringBootController[] {
    return entities.map((entity, index) => {
      const service = services[index];
      const dto = dtos[index];
      const mapper = mappers[index];

      const endpoints: SpringBootEndpoint[] = [
        {
          method: "GET",
          path: `/${this.toKebabCase(entity.className)}`,
          methodName: "findAll",
          parameters: [],
          returnType: `List<${dto.className}>`,
        },
        {
          method: "GET",
          path: `/${this.toKebabCase(entity.className)}/{id}`,
          methodName: "findById",
          parameters: ["@PathVariable Long id"],
          returnType: `ResponseEntity<${dto.className}>`,
        },
        {
          method: "POST",
          path: `/${this.toKebabCase(entity.className)}`,
          methodName: "create",
          parameters: [`@RequestBody ${dto.className} dto`],
          returnType: `ResponseEntity<${dto.className}>`,
        },
        {
          method: "PUT",
          path: `/${this.toKebabCase(entity.className)}/{id}`,
          methodName: "update",
          parameters: [
            "@PathVariable Long id",
            `@RequestBody ${dto.className} dto`,
          ],
          returnType: `ResponseEntity<${dto.className}>`,
        },
        {
          method: "DELETE",
          path: `/${this.toKebabCase(entity.className)}/{id}`,
          methodName: "delete",
          parameters: ["@PathVariable Long id"],
          returnType: "ResponseEntity<Void>",
        },
      ];

      return {
        className: `${entity.className}Controller`,
        packageName: `${this.basePackage}.controller`,
        entityClass: entity.className,
        serviceClass: service.className,
        dtoClass: dto.className,
        mapperClass: mapper.className,
        endpoints,
      };
    });
  }

  /**
   * Genera application.properties
   */
  private generateApplicationProperties(): string {
    return `# Database Configuration
spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=

# JPA Configuration
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.jpa.hibernate.ddl-auto=none
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

# H2 Console
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console

# Server Configuration
server.port=8080

# Logging
logging.level.com.example=DEBUG
logging.level.org.springframework.web=DEBUG
`;
  }

  /**
   * Genera pom.xml
   */
  private generatePomXml(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
        <relativePath/>
    </parent>
    <groupId>${this.basePackage.replace(/\./g, "-")}</groupId>
    <artifactId>${this.projectName}</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>${this.projectName}</name>
    <description>Spring Boot JPA Application</description>
    <properties>
        <java.version>17</java.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>`;
  }

  /**
   * Genera datos de ejemplo
   */
  private generateSampleData(entities: SpringBootEntity[]): string {
    let sql = "-- Sample Data\n\n";

    for (const entity of entities) {
      const tableName = entity.tableName;
      const sampleRecords = this.generateSampleRecords(entity);

      for (const record of sampleRecords) {
        sql += `INSERT INTO ${tableName} (${Object.keys(record).join(
          ", "
        )}) VALUES (${Object.values(record)
          .map((v) => `'${v}'`)
          .join(", ")});\n`;
      }
      sql += "\n";
    }

    return sql;
  }

  /**
   * Genera registros de ejemplo para una entidad
   */
  private generateSampleRecords(
    entity: SpringBootEntity
  ): Array<Record<string, string | number | boolean>> {
    const records: Array<Record<string, string | number | boolean>> = [];
    const recordCount = 3; // Generar 3 registros por tabla

    for (let i = 1; i <= recordCount; i++) {
      const record: Record<string, string | number | boolean> = {};

      for (const field of entity.fields) {
        if (field.primaryKey) {
          record[field.columnName] = i;
        } else if (field.foreignKey) {
          // Asumir que hay registros con IDs 1, 2, 3 en las tablas referenciadas
          record[field.columnName] =
            Math.floor(Math.random() * recordCount) + 1;
        } else {
          record[field.columnName] = this.generateSampleValue(field.type, i);
        }
      }

      records.push(record);
    }

    return records;
  }

  /**
   * Genera un valor de ejemplo basado en el tipo
   */
  private generateSampleValue(
    type: string,
    index: number
  ): string | number | boolean {
    switch (type.toLowerCase()) {
      case "string":
        return `Sample ${type} ${index}`;
      case "long":
      case "integer":
      case "int":
        return index * 10;
      case "boolean":
        return index % 2 === 0;
      case "localdatetime":
        return "2024-01-01T10:00:00";
      case "bigdecimal":
        return (index * 10.5).toFixed(2);
      default:
        return `Sample ${index}`;
    }
  }

  /**
   * Genera el código Java completo
   */
  public generateJavaCode(): Record<string, string> {
    const code: Record<string, string> = {};
    const generated = this.generateCode();

    // Generar entidades
    for (const entity of generated.entities) {
      code[
        `src/main/java/${entity.packageName.replace(/\./g, "/")}/${
          entity.className
        }.java`
      ] = this.generateEntityCode(entity);
    }

    // Generar DTOs
    for (const dto of generated.dtos) {
      code[
        `src/main/java/${dto.packageName.replace(/\./g, "/")}/${
          dto.className
        }.java`
      ] = this.generateDTOCode(dto);
    }

    // Generar Mappers
    for (const mapper of generated.mappers) {
      code[
        `src/main/java/${mapper.packageName.replace(/\./g, "/")}/${
          mapper.className
        }.java`
      ] = this.generateMapperCode(mapper);
    }

    // Generar Repositories
    for (const repository of generated.repositories) {
      code[
        `src/main/java/${repository.packageName.replace(/\./g, "/")}/${
          repository.className
        }.java`
      ] = this.generateRepositoryCode(repository);
    }

    // Generar Services
    for (const service of generated.services) {
      code[
        `src/main/java/${service.packageName.replace(/\./g, "/")}/${
          service.className
        }.java`
      ] = this.generateServiceCode(service);
    }

    // Generar Controllers
    for (const controller of generated.controllers) {
      code[
        `src/main/java/${controller.packageName.replace(/\./g, "/")}/${
          controller.className
        }.java`
      ] = this.generateControllerCode(controller);
    }

    // Archivos de configuración
    code["src/main/resources/application.properties"] =
      generated.applicationProperties;
    code["pom.xml"] = generated.pomXml;
    code["src/main/resources/data.sql"] = generated.sampleData;

    return code;
  }

  /**
   * Genera código Java para una entidad
   */
  private generateEntityCode(entity: SpringBootEntity): string {
    let code = `package ${entity.packageName};\n\n`;

    // Imports
    for (const imp of entity.imports) {
      code += `import ${imp};\n`;
    }
    code += `import lombok.Data;\n`;
    code += `import lombok.NoArgsConstructor;\n`;
    code += `import lombok.AllArgsConstructor;\n\n`;

    // Anotaciones de clase
    for (const annotation of entity.annotations) {
      code += `${annotation}\n`;
    }

    code += `@Data\n@NoArgsConstructor\n@AllArgsConstructor\n`;
    code += `public class ${entity.className} {\n\n`;

    // Campos
    for (const field of entity.fields) {
      code += `    ${field.annotations.join("\n    ")}\n`;
      code += `    private ${field.type} ${field.name};\n\n`;
    }

    code += `}\n`;
    return code;
  }

  /**
   * Genera código Java para un DTO
   */
  private generateDTOCode(dto: SpringBootDTO): string {
    let code = `package ${dto.packageName};\n\n`;

    // Imports
    for (const imp of dto.imports) {
      code += `import ${imp};\n`;
    }
    code += `\n`;

    code += `@Data\n@NoArgsConstructor\n@AllArgsConstructor\n`;
    code += `public class ${dto.className} {\n\n`;

    // Campos
    for (const field of dto.fields) {
      code += `    private ${field.type} ${field.name};\n`;
    }

    code += `}\n`;
    return code;
  }

  /**
   * Genera código Java para un Mapper
   */
  private generateMapperCode(mapper: SpringBootMapper): string {
    let code = `package ${mapper.packageName};\n\n`;
    code += `import ${this.basePackage}.entity.${mapper.entityClass};\n`;
    code += `import ${this.basePackage}.dto.${mapper.dtoClass};\n`;
    code += `import java.util.List;\n`;
    code += `import java.util.stream.Collectors;\n\n`;

    code += `public class ${mapper.className} {\n\n`;

    code += `    public static ${mapper.dtoClass} toDTO(${mapper.entityClass} entity) {\n`;
    code += `        if (entity == null) return null;\n`;
    code += `        ${mapper.dtoClass} dto = new ${mapper.dtoClass}();\n`;
    code += `        // TODO: Map entity fields to DTO\n`;
    code += `        return dto;\n`;
    code += `    }\n\n`;

    code += `    public static ${mapper.entityClass} toEntity(${mapper.dtoClass} dto) {\n`;
    code += `        if (dto == null) return null;\n`;
    code += `        ${mapper.entityClass} entity = new ${mapper.entityClass}();\n`;
    code += `        // TODO: Map DTO fields to entity\n`;
    code += `        return entity;\n`;
    code += `    }\n\n`;

    code += `    public static List<${mapper.dtoClass}> toDTOList(List<${mapper.entityClass}> entities) {\n`;
    code += `        return entities.stream()\n`;
    code += `            .map(${mapper.className}::toDTO)\n`;
    code += `            .collect(Collectors.toList());\n`;
    code += `    }\n\n`;

    code += `    public static List<${mapper.entityClass}> toEntityList(List<${mapper.dtoClass}> dtos) {\n`;
    code += `        return dtos.stream()\n`;
    code += `            .map(${mapper.className}::toEntity)\n`;
    code += `            .collect(Collectors.toList());\n`;
    code += `    }\n\n`;

    code += `    public static void updateEntityFromDTO(${mapper.dtoClass} dto, ${mapper.entityClass} entity) {\n`;
    code += `        if (dto == null || entity == null) return;\n`;
    code += `        // TODO: Update entity fields from DTO\n`;
    code += `    }\n\n`;

    code += `}\n`;
    return code;
  }

  /**
   * Genera código Java para un Repository
   */
  private generateRepositoryCode(repository: SpringBootRepository): string {
    let code = `package ${repository.packageName};\n\n`;
    code += `import ${this.basePackage}.entity.${repository.entityClass};\n`;
    code += `import org.springframework.data.jpa.repository.JpaRepository;\n`;
    code += `import org.springframework.stereotype.Repository;\n`;
    code += `import java.util.Optional;\n`;
    code += `import java.util.List;\n\n`;

    code += `@Repository\n`;
    code += `public interface ${repository.className} extends JpaRepository<${repository.entityClass}, Long> {\n\n`;
    code += `    // Custom query methods can be added here\n\n`;
    code += `}\n`;
    return code;
  }

  /**
   * Genera código Java para un Service
   */
  private generateServiceCode(service: SpringBootService): string {
    let code = `package ${service.packageName};\n\n`;
    code += `import ${this.basePackage}.entity.${service.entityClass};\n`;
    code += `import ${this.basePackage}.repository.${service.repositoryClass};\n`;
    code += `import org.springframework.beans.factory.annotation.Autowired;\n`;
    code += `import org.springframework.stereotype.Service;\n`;
    code += `import java.util.List;\n`;
    code += `import java.util.Optional;\n\n`;

    code += `@Service\n`;
    code += `public class ${service.className} {\n\n`;

    code += `    @Autowired\n`;
    code += `    private ${service.repositoryClass} repository;\n\n`;

    code += `    public List<${service.entityClass}> findAll() {\n`;
    code += `        return repository.findAll();\n`;
    code += `    }\n\n`;

    code += `    public Optional<${service.entityClass}> findById(Long id) {\n`;
    code += `        return repository.findById(id);\n`;
    code += `    }\n\n`;

    code += `    public ${service.entityClass} save(${service.entityClass} entity) {\n`;
    code += `        return repository.save(entity);\n`;
    code += `    }\n\n`;

    code += `    public void deleteById(Long id) {\n`;
    code += `        repository.deleteById(id);\n`;
    code += `    }\n\n`;

    code += `}\n`;
    return code;
  }

  /**
   * Genera código Java para un Controller
   */
  private generateControllerCode(controller: SpringBootController): string {
    let code = `package ${controller.packageName};\n\n`;
    code += `import ${this.basePackage}.entity.${controller.entityClass};\n`;
    code += `import ${this.basePackage}.dto.${controller.dtoClass};\n`;
    code += `import ${this.basePackage}.service.${controller.serviceClass};\n`;
    code += `import ${this.basePackage}.mapper.${controller.mapperClass};\n`;
    code += `import org.springframework.beans.factory.annotation.Autowired;\n`;
    code += `import org.springframework.http.ResponseEntity;\n`;
    code += `import org.springframework.web.bind.annotation.*;\n`;
    code += `import java.util.List;\n`;
    code += `import java.util.Optional;\n\n`;

    code += `@RestController\n`;
    code += `@RequestMapping("/api")\n`;
    code += `public class ${controller.className} {\n\n`;

    code += `    @Autowired\n`;
    code += `    private ${controller.serviceClass} service;\n\n`;

    // Endpoints
    for (const endpoint of controller.endpoints) {
      const mappingAnnotation = this.getMappingAnnotation(endpoint.method);
      code += `    @${mappingAnnotation}("${endpoint.path}")\n`;
      code += `    public ${endpoint.returnType} ${
        endpoint.methodName
      }(${endpoint.parameters.join(", ")}) {\n`;

      switch (endpoint.methodName) {
        case "findAll":
          code += `        List<${controller.entityClass}> entities = service.findAll();\n`;
          code += `        return ${controller.mapperClass}.toDTOList(entities);\n`;
          break;
        case "findById":
          code += `        Optional<${controller.entityClass}> entity = service.findById(id);\n`;
          code += `        if (entity.isPresent()) {\n`;
          code += `            return ResponseEntity.ok(${controller.mapperClass}.toDTO(entity.get()));\n`;
          code += `        } else {\n`;
          code += `            return ResponseEntity.notFound().build();\n`;
          code += `        }\n`;
          break;
        case "create":
          code += `        ${controller.entityClass} entity = ${controller.mapperClass}.toEntity(dto);\n`;
          code += `        ${controller.entityClass} savedEntity = service.save(entity);\n`;
          code += `        return ResponseEntity.ok(${controller.mapperClass}.toDTO(savedEntity));\n`;
          break;
        case "update":
          code += `        Optional<${controller.entityClass}> existingEntity = service.findById(id);\n`;
          code += `        if (!existingEntity.isPresent()) {\n`;
          code += `            return ResponseEntity.notFound().build();\n`;
          code += `        }\n`;
          code += `        ${controller.entityClass} entity = existingEntity.get();\n`;
          code += `        // Update entity fields from DTO (excluding ID)\n`;
          code += `        ${controller.mapperClass}.updateEntityFromDTO(dto, entity);\n`;
          code += `        ${controller.entityClass} updatedEntity = service.save(entity);\n`;
          code += `        return ResponseEntity.ok(${controller.mapperClass}.toDTO(updatedEntity));\n`;
          break;
        case "delete":
          code += `        if (!service.findById(id).isPresent()) {\n`;
          code += `            return ResponseEntity.notFound().build();\n`;
          code += `        }\n`;
          code += `        service.deleteById(id);\n`;
          code += `        return ResponseEntity.noContent().build();\n`;
          break;
      }

      code += `    }\n\n`;
    }

    code += `}\n`;
    return code;
  }

  // Métodos auxiliares

  private mapSQLTypeToJavaType(sqlType: string): string {
    const typeMap: Record<string, string> = {
      "NUMBER(10)": "Integer",
      "NUMBER(19)": "Long",
      "NUMBER(10,2)": "BigDecimal",
      "NUMBER(15,2)": "BigDecimal",
      "VARCHAR2(255)": "String",
      "VARCHAR2(50)": "String",
      "CHAR(1)": "Boolean",
      DATE: "LocalDate",
      TIMESTAMP: "LocalDateTime",
    };

    return typeMap[sqlType] || "String";
  }

  private determineRelationshipType():
    | "OneToOne"
    | "OneToMany"
    | "ManyToOne"
    | "ManyToMany" {
    // Lógica simplificada: asumir ManyToOne por defecto
    // En una implementación completa, esto debería analizar las cardinalidades
    return "ManyToOne";
  }

  private toPascalCase(str: string): string {
    return str
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("");
  }

  private toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  private toKebabCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  }

  private getMappingAnnotation(method: string): string {
    switch (method) {
      case "GET":
        return "GetMapping";
      case "POST":
        return "PostMapping";
      case "PUT":
        return "PutMapping";
      case "DELETE":
        return "DeleteMapping";
      default:
        return "RequestMapping";
    }
  }
}

// Función de utilidad para generar código Spring Boot
export function generateSpringBootCode(
  physicalModel: PhysicalModel,
  basePackage?: string,
  projectName?: string
): SpringBootGeneratedCode {
  const generator = new SpringBootCodeGenerator(
    physicalModel,
    basePackage,
    projectName
  );
  return generator.generateCode();
}
