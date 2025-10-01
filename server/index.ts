import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import {
  DiagramController,
  ViewObserver,
} from "./controllers/DiagramController.js";
import { InvitationController } from "./controllers/InvitationController.js";
import { DiagramSnapshotController } from "./controllers/DiagramSnapshotController.js";
import { JsonPatchOperation } from "./validation/UMLValidator.js";
import { UserModel } from "./models/UserModel.js";
import { DiagramSnapshotModel } from "./models/DiagramSnapshotModel.js";
import { transformLogicalToPhysical } from "./models/TransformationManager.js";
import { SpringBootCodeGenerator } from "./models/SpringBootCodeGenerator.js";
import archiver from "archiver";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);

// Función para gestionar base de datos con migraciones usando Prisma
async function manageDatabaseWithMigrations(
  databaseConfig: any,
  physicalModel: any
) {
  try {
    console.log("Gestionando base de datos con migraciones:", databaseConfig);

    // Crear directorio temporal para el proyecto Prisma
    const tempDir = path.join(process.cwd(), "temp-db-migration");
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });

    // Generar schema.prisma basado en el modelo físico
    const schemaContent = generatePrismaSchema(physicalModel, databaseConfig);
    const schemaPath = path.join(tempDir, "schema.prisma");
    fs.writeFileSync(schemaPath, schemaContent);

    // Crear package.json básico para Prisma
    const packageJson = {
      name: "temp-db-migration",
      version: "1.0.0",
      dependencies: {
        prisma: "^5.0.0",
        "@prisma/client": "^5.0.0",
      },
    };
    fs.writeFileSync(
      path.join(tempDir, "package.json"),
      JSON.stringify(packageJson, null, 2)
    );

    // Instalar dependencias
    console.log("Instalando dependencias de Prisma...");
    await execAsync("npm install", { cwd: tempDir });

    // Generar cliente Prisma
    console.log("Generando cliente Prisma...");
    await execAsync("npx prisma generate", { cwd: tempDir });

    // Verificar si la base de datos existe
    console.log("Verificando estado de la base de datos...");
    try {
      await execAsync("npx prisma db push --preview-feature", { cwd: tempDir });
      console.log("Base de datos existe, verificando si hay cambios...");

      // Generar migración si hay cambios
      const migrationName = `migration_${Date.now()}`;
      await execAsync(
        `npx prisma migrate dev --name ${migrationName} --create-only`,
        { cwd: tempDir }
      );
      await execAsync("npx prisma migrate deploy", { cwd: tempDir });

      console.log("Migración aplicada exitosamente");
    } catch (error) {
      console.log(
        "Base de datos no existe o error en verificación, creando desde cero..."
      );

      // Crear la base de datos desde cero
      await execAsync("npx prisma db push --force-reset", { cwd: tempDir });

      // Crear migración inicial
      await execAsync(
        "npx prisma migrate dev --name initial_migration --create-only",
        { cwd: tempDir }
      );
      await execAsync("npx prisma migrate deploy", { cwd: tempDir });

      console.log("Base de datos creada y migración inicial aplicada");
    }

    // Limpiar directorio temporal
    fs.rmSync(tempDir, { recursive: true, force: true });

    return { success: true };
  } catch (error) {
    console.error("Error gestionando base de datos con migraciones:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Función para crear base de datos usando Prisma
async function createDatabase(databaseConfig: any, physicalModel: any) {
  try {
    console.log("Creando base de datos con configuración:", databaseConfig);

    // Crear directorio temporal para el proyecto Prisma
    const tempDir = path.join(process.cwd(), "temp-db-setup");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Generar schema.prisma basado en el modelo físico
    const schemaContent = generatePrismaSchema(physicalModel, databaseConfig);
    const schemaPath = path.join(tempDir, "schema.prisma");
    fs.writeFileSync(schemaPath, schemaContent);

    // Crear package.json básico para Prisma
    const packageJson = {
      name: "temp-db-setup",
      version: "1.0.0",
      dependencies: {
        prisma: "^5.0.0",
        "@prisma/client": "^5.0.0",
      },
    };
    fs.writeFileSync(
      path.join(tempDir, "package.json"),
      JSON.stringify(packageJson, null, 2)
    );

    // Instalar dependencias
    console.log("Instalando dependencias de Prisma...");
    await execAsync("npm install", { cwd: tempDir });

    // Generar cliente Prisma
    console.log("Generando cliente Prisma...");
    await execAsync("npx prisma generate", { cwd: tempDir });

    // Crear la base de datos
    console.log("Creando base de datos...");
    await execAsync("npx prisma db push --force-reset", { cwd: tempDir });

    console.log("Base de datos creada exitosamente");

    // Limpiar directorio temporal
    fs.rmSync(tempDir, { recursive: true, force: true });

    return { success: true };
  } catch (error) {
    console.error("Error creando base de datos:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Función para generar schema.prisma basado en el modelo físico
function generatePrismaSchema(physicalModel: any, databaseConfig: any): string {
  let schema = `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${databaseConfig.type}"
  url      = "${generateDatabaseUrl(databaseConfig)}"
}

// Modelos generados desde el diagrama UML\n\n`;

  // Generar modelos desde las entidades físicas
  if (physicalModel.entities) {
    physicalModel.entities.forEach((entity: any) => {
      schema += `model ${entity.name} {\n`;

      // ID field (primera columna como ID si no hay una explícita)
      const idField = entity.attributes.find((attr: any) => attr.isPrimaryKey);
      if (idField) {
        schema += `  ${idField.name} ${mapTypeToPrisma(idField.type)} @id`;
        if (idField.autoIncrement) {
          schema += ` @default(autoincrement())`;
        }
        schema += `\n`;
      } else {
        // Usar la primera columna como ID si no hay una explícita
        const firstAttr = entity.attributes[0];
        if (firstAttr) {
          schema += `  ${firstAttr.name} ${mapTypeToPrisma(
            firstAttr.type
          )} @id @default(autoincrement())\n`;
        }
      }

      // Otros atributos
      entity.attributes.forEach((attr: any) => {
        if (!idField || attr.name !== idField.name) {
          schema += `  ${attr.name} ${mapTypeToPrisma(attr.type)}`;
          if (attr.isUnique) {
            schema += ` @unique`;
          }
          if (attr.isNullable === false) {
            schema += ``; // Por defecto no nullable en Prisma
          } else {
            schema += `?`; // Nullable
          }
          schema += `\n`;
        }
      });

      // Relaciones (simplificadas)
      if (entity.relationships) {
        entity.relationships.forEach((rel: any) => {
          // Esto es una simplificación - en un caso real necesitarías lógica más compleja
          schema += `  // Relación con ${rel.targetEntity}\n`;
        });
      }

      schema += `}\n\n`;
    });
  }

  return schema;
}

// Función para mapear tipos de datos a Prisma
function mapTypeToPrisma(type: string): string {
  const typeMapping: { [key: string]: string } = {
    String: "String",
    Integer: "Int",
    Long: "BigInt",
    Float: "Float",
    Double: "Float",
    Boolean: "Boolean",
    Date: "DateTime",
    DateTime: "DateTime",
    Text: "String",
    VARCHAR: "String",
    INT: "Int",
    BIGINT: "BigInt",
    DECIMAL: "Decimal",
    BOOL: "Boolean",
    TIMESTAMP: "DateTime",
  };

  return typeMapping[type] || "String";
}

// Función para generar URL de base de datos
function generateDatabaseUrl(config: any): string {
  switch (config.type) {
    case "postgresql":
      return `postgresql://${config.username}:${config.password}@${
        config.host
      }:${config.port}/${config.database}?schema=${config.schema || "public"}`;
    case "mysql":
      return `mysql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;
    case "sqlserver":
      return `sqlserver://${config.host}:${config.port};database=${config.database};user=${config.username};password=${config.password}`;
    case "sqlite":
      return `file:./${config.database}.db`;
    default:
      return `postgresql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;
  }
}

// Función helper para crear estructura de archivos desde el código generado
function createFileStructure(
  codeGenerator: any,
  projectName: string,
  databaseConfig?: any
) {
  // Usar el método generateJavaCode del generador que ya crea la estructura correcta
  const javaFiles = codeGenerator.generateJavaCode();

  // Crear archivos adicionales (configuración, etc.)
  const files: { [path: string]: string | Buffer } = { ...javaFiles };

  const basePackage = "com.example.demo";

  // Configuración de base de datos
  let dbConfigContent = "";
  let dbDependency = "";

  if (databaseConfig) {
    switch (databaseConfig.type) {
      case "postgresql":
        dbConfigContent = `spring.datasource.url=jdbc:postgresql://${databaseConfig.host}:${databaseConfig.port}/${databaseConfig.database}
spring.datasource.driverClassName=org.postgresql.Driver
spring.datasource.username=${databaseConfig.username}
spring.datasource.password=${databaseConfig.password}
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect`;
        dbDependency = `        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>`;
        break;
      case "mysql":
        dbConfigContent = `spring.datasource.url=jdbc:mysql://${
          databaseConfig.host
        }:${databaseConfig.port}/${databaseConfig.database}?useSSL=${
          databaseConfig.ssl || false
        }
spring.datasource.driverClassName=com.mysql.cj.jdbc.Driver
spring.datasource.username=${databaseConfig.username}
spring.datasource.password=${databaseConfig.password}
spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect`;
        dbDependency = `        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <scope>runtime</scope>
        </dependency>`;
        break;
      case "sqlserver":
        dbConfigContent = `spring.datasource.url=jdbc:sqlserver://${databaseConfig.host}:${databaseConfig.port};databaseName=${databaseConfig.database}
spring.datasource.driverClassName=com.microsoft.sqlserver.jdbc.SQLServerDriver
spring.datasource.username=${databaseConfig.username}
spring.datasource.password=${databaseConfig.password}
spring.jpa.database-platform=org.hibernate.dialect.SQLServerDialect`;
        dbDependency = `        <dependency>
            <groupId>com.microsoft.sqlserver</groupId>
            <artifactId>mssql-jdbc</artifactId>
            <scope>runtime</scope>
        </dependency>`;
        break;
      case "sqlite":
        dbConfigContent = `spring.datasource.url=jdbc:sqlite:${databaseConfig.database}.db
spring.datasource.driverClassName=org.sqlite.JDBC
spring.jpa.database-platform=org.hibernate.dialect.SQLiteDialect`;
        dbDependency = `        <dependency>
            <groupId>org.xerial</groupId>
            <artifactId>sqlite-jdbc</artifactId>
            <scope>runtime</scope>
        </dependency>`;
        break;
      default:
        // H2 por defecto
        dbConfigContent = `spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.driverClassName=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.h2.console.enabled=true`;
        dbDependency = `        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
        </dependency>`;
    }
  } else {
    // Configuración por defecto con H2
    dbConfigContent = `spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.driverClassName=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.h2.console.enabled=true`;
    dbDependency = `        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
        </dependency>`;
  }

  files["src/main/resources/application.properties"] = `${dbConfigContent}
spring.jpa.hibernate.ddl-auto=create-drop
spring.jpa.show-sql=true
`;

  files["pom.xml"] = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
        <relativePath/>
    </parent>
    <groupId>com.example</groupId>
    <artifactId>${projectName}</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>${projectName}</name>
    <description>Spring Boot project generated from UML diagram</description>
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
${dbDependency}
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
            </plugin>
        </plugins>
    </build>
</project>`;

  // Archivo principal de Spring Boot
  const mainClassName = `${
    projectName.charAt(0).toUpperCase() + projectName.slice(1)
  }Application`;
  const packagePath = basePackage.replace(/\./g, "/");
  files[
    `src/main/java/${packagePath}/${mainClassName}.java`
  ] = `package ${basePackage};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ${mainClassName} {

    public static void main(String[] args) {
        SpringApplication.run(${mainClassName}.class, args);
    }
}`;

  // Archivo de prueba
  files[
    `src/test/java/${packagePath}/${mainClassName}Tests.java`
  ] = `package ${basePackage};

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class ${mainClassName}Tests {

    @Test
    void contextLoads() {
    }
}`;

  // README
  let readmeContent = `# ${projectName}

Proyecto Spring Boot generado automáticamente desde diagrama UML.

## Configuración de Base de Datos

Este proyecto está configurado para usar:`;

  if (databaseConfig) {
    switch (databaseConfig.type) {
      case "postgresql":
        readmeContent += `
- **Base de datos:** PostgreSQL
- **Host:** ${databaseConfig.host}:${databaseConfig.port}
- **Base de datos:** ${databaseConfig.database}
- **Usuario:** ${databaseConfig.username}`;
        break;
      case "mysql":
        readmeContent += `
- **Base de datos:** MySQL
- **Host:** ${databaseConfig.host}:${databaseConfig.port}
- **Base de datos:** ${databaseConfig.database}
- **Usuario:** ${databaseConfig.username}`;
        break;
      case "sqlserver":
        readmeContent += `
- **Base de datos:** SQL Server
- **Host:** ${databaseConfig.host}:${databaseConfig.port}
- **Base de datos:** ${databaseConfig.database}
- **Usuario:** ${databaseConfig.username}`;
        break;
      case "sqlite":
        readmeContent += `
- **Base de datos:** SQLite
- **Archivo:** ${databaseConfig.database}.db`;
        break;
      default:
        readmeContent += `
- **Base de datos:** H2 (en memoria)
- **Consola H2:** http://localhost:8080/h2-console
- **JDBC URL:** jdbc:h2:mem:testdb
- **Usuario:** sa
- **Contraseña:** (vacía)`;
    }
  } else {
    readmeContent += `
- **Base de datos:** H2 (en memoria)
- **Consola H2:** http://localhost:8080/h2-console
- **JDBC URL:** jdbc:h2:mem:testdb
- **Usuario:** sa
- **Contraseña:** (vacía)`;
  }

  readmeContent += `

## Ejecutar la aplicación

\`\`\`bash
./mvnw spring-boot:run
\`\`\`

## Construir la aplicación

\`\`\`bash
./mvnw clean package
\`\`\`

## Ejecutar tests

\`\`\`bash
./mvnw test
\`\`\`
`;

  files["README.md"] = readmeContent;

  return files;
}

class DiagramManager {
  private controllers: Map<string, DiagramController> = new Map();

  getController(diagramId: string): DiagramController {
    if (!this.controllers.has(diagramId)) {
      this.controllers.set(diagramId, new DiagramController(diagramId));
    }
    return this.controllers.get(diagramId)!;
  }

  removeController(diagramId: string) {
    this.controllers.delete(diagramId);
  }
}

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5174", // Vite dev server
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Instancia del controlador (única para toda la aplicación)
const diagramManager = new DiagramManager();
const invitationController = new InvitationController();
const diagramSnapshotController = new DiagramSnapshotController();

// Conexiones activas - mapea socket.id a diagramId
const activeConnections = new Map<string, string>();

io.on("connection", (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);

  let currentController: DiagramController | null = null;
  let unregisterView: (() => void) | null = null;

  // Crear observador para esta vista (socket)
  const viewObserver: ViewObserver = {
    id: socket.id,
    notify: (operation: JsonPatchOperation, newState: any) => {
      // Enviar notificación a la vista específica
      socket.emit("diagram:update", { operation, newState });
    },
  };

  // Manejar unión a sala de diagrama
  socket.on("diagram:join", (diagramId: string) => {
    // Si ya estaba en un diagrama, desregistrar
    if (unregisterView) {
      unregisterView();
    }

    // Obtener controlador para este diagrama
    currentController = diagramManager.getController(diagramId);

    // Registrar la vista en el controlador
    unregisterView = currentController.registerView(socket.id, viewObserver);

    socket.join(`diagram-${diagramId}`);
    activeConnections.set(socket.id, diagramId);
    console.log(`Cliente ${socket.id} se unió al diagrama ${diagramId}`);

    // Notificar a otros clientes en la sala
    socket.to(`diagram-${diagramId}`).emit("user:joined", {
      userId: socket.id,
      timestamp: Date.now(),
    });
  });

  // Manejar operaciones del diagrama - MVC Pattern
  socket.on("diagram:operation", async (operation: JsonPatchOperation) => {
    if (!currentController) {
      socket.emit("operation:error", {
        operation,
        error: "No se ha unido a ningún diagrama",
        timestamp: Date.now(),
      });
      return;
    }

    try {
      console.log(`Operación recibida de vista ${socket.id}:`, operation);

      // El controlador procesa la operación a través del modelo
      const result = await currentController.processOperation(
        socket.id,
        operation
      );

      if (result.success) {
        // Confirmar operación a la vista que la envió
        socket.emit("operation:confirmed", {
          operation,
          timestamp: Date.now(),
        });

        console.log(`Operación confirmada para vista ${socket.id}`);
      } else {
        // Rechazar operación con errores
        socket.emit("operation:rejected", {
          operation,
          reason: result.errors?.join(", ") || "Error desconocido",
          timestamp: Date.now(),
        });

        console.log(
          `Operación rechazada para vista ${socket.id}:`,
          result.errors
        );
      }
    } catch (error) {
      console.error(`Error procesando operación de vista ${socket.id}:`, error);
      socket.emit("operation:error", {
        operation,
        error: "Error interno del servidor",
        timestamp: Date.now(),
      });
    }
  });

  // Manejar desconexión
  socket.on("disconnect", () => {
    const diagramId = activeConnections.get(socket.id);
    if (diagramId) {
      // Notificar a otros clientes en la sala
      socket.to(`diagram-${diagramId}`).emit("user:left", {
        userId: socket.id,
        timestamp: Date.now(),
      });
      activeConnections.delete(socket.id);
    }

    // Remover la vista del controlador
    if (unregisterView) {
      unregisterView();
    }

    console.log(`Cliente desconectado: ${socket.id}`);
  });
});

// Rutas HTTP para estadísticas y estado
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// Endpoint de prueba para validación de credenciales
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`Intento de login - Email: ${email}`);

    const userModel = new UserModel();
    const user = await userModel.validateCredentials(email, password);

    console.log(`Resultado validación - Usuario encontrado: ${!!user}`);
    if (user) {
      console.log(`Login exitoso para: ${user.email}`);
      res.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email },
      });
    } else {
      console.log(`Login fallido para: ${email}`);
      res.status(401).json({ success: false, error: "Credenciales inválidas" });
    }
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Endpoint de prueba para registro de usuarios
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Faltan campos requeridos: name, email, password" });
    }

    const userModel = new UserModel();
    const newUser = await userModel.create({ name, email, password });

    res.status(201).json({
      success: true,
      user: { id: newUser.id, name: newUser.name, email: newUser.email },
    });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.get("/diagram/:diagramId/stats", (req, res) => {
  const { diagramId } = req.params;
  const controller = diagramManager.getController(diagramId);
  const stats = controller.getStatistics();
  res.json(stats);
});

app.get("/diagram/:diagramId/state", (req, res) => {
  const { diagramId } = req.params;
  const controller = diagramManager.getController(diagramId);
  const state = controller.getCurrentState();
  res.json(state);
});

// Rutas API para invitaciones
app.post("/api/invitations", (req, res) =>
  invitationController.createInvitation(req, res)
);
app.get("/api/invitations/user/:userId", (req, res) =>
  invitationController.getInvitationsByUser(req, res)
);
app.get("/api/invitations/:id", (req, res) =>
  invitationController.getInvitationById(req, res)
);
app.post("/api/invitations/:id/accept", (req, res) =>
  invitationController.acceptInvitation(req, res)
);
app.post("/api/invitations/:id/reject", (req, res) =>
  invitationController.rejectInvitation(req, res)
);
app.delete("/api/invitations/:id", (req, res) =>
  invitationController.deleteInvitation(req, res)
);
app.get("/api/invitations", (req, res) =>
  invitationController.getAllInvitations(req, res)
);

// Endpoint de prueba
app.get("/api/test", (req, res) => {
  res.json({
    message: "API funcionando correctamente",
    timestamp: new Date().toISOString(),
  });
});

// Rutas API para diagramas
app.get("/api/diagrams/check-name", (req, res) =>
  diagramSnapshotController.checkDiagramNameExists(req, res)
);
app.get("/api/diagrams/user/:userId", (req, res) =>
  diagramSnapshotController.getDiagramsByUser(req, res)
);
app.get("/api/diagrams/:diagramId", (req, res) =>
  diagramSnapshotController.getDiagramById(req, res)
);
app.post("/api/diagrams", (req, res) =>
  diagramSnapshotController.createDiagram(req, res)
);
app.put("/api/diagrams/:diagramId", (req, res) =>
  diagramSnapshotController.updateDiagram(req, res)
);
app.delete("/api/diagrams/:diagramId", (req, res) =>
  diagramSnapshotController.deleteDiagram(req, res)
);

// Endpoints de exportación
app.get("/api/diagrams/:diagramId/export/json", (req, res) =>
  diagramSnapshotController.exportDiagramAsJSON(req, res)
);
app.get("/api/diagrams/:diagramId/export/svg", (req, res) =>
  diagramSnapshotController.exportDiagramAsSVG(req, res)
);

// Endpoint para generar backend
app.post("/api/diagrams/generate-backend", async (req, res) => {
  try {
    const { diagramState, diagramName, databaseConfig, diagramId, creatorId } =
      req.body;

    if (!diagramState) {
      return res.status(400).json({
        success: false,
        error: "Estado del diagrama requerido",
      });
    }

    console.log("Iniciando transformación del diagrama:", diagramName);
    console.log("Configuración de BD:", databaseConfig);

    // Paso 1: Transformar modelo lógico a físico
    const transformationResult = transformLogicalToPhysical(diagramState);

    if (!transformationResult.success) {
      return res.status(400).json({
        success: false,
        error: `Error en transformación: ${transformationResult.errors.join(
          ", "
        )}`,
        details: transformationResult,
      });
    }

    console.log("Transformación completada, guardando snapshot...");

    // Paso 2: Guardar snapshot con el modelo físico
    if (diagramId && creatorId) {
      try {
        const diagramSnapshotModel = new DiagramSnapshotModel();
        await diagramSnapshotModel.create({
          diagramId,
          name: diagramName || "Generated Backend",
          description: `Backend generado automáticamente para ${diagramName}`,
          creatorId,
          collaborators: [],
          state: diagramState,
          physicalModel: transformationResult.physicalModel,
          isPublic: false,
          tags: ["generated", "backend"],
        });
        console.log("Snapshot guardado exitosamente con modelo físico");
      } catch (error) {
        console.warn("Advertencia: No se pudo guardar el snapshot:", error);
        // Continuar con la generación aunque falle el guardado del snapshot
      }
    }

    console.log("Generando código Spring Boot...");

    // Paso 3: Generar código Spring Boot
    const codeGenerator = new SpringBootCodeGenerator(
      transformationResult.physicalModel!,
      diagramName || "generated-backend"
    );

    // Paso 4: Gestionar base de datos con migraciones si se proporcionó configuración
    if (databaseConfig) {
      console.log("Gestionando base de datos con migraciones...");
      const dbResult = await manageDatabaseWithMigrations(
        databaseConfig,
        transformationResult.physicalModel
      );
      if (!dbResult.success) {
        console.warn(
          "Advertencia: No se pudo gestionar la base de datos:",
          dbResult.error
        );
        // Continuar con la generación del backend aunque falle la gestión de BD
      } else {
        console.log("Base de datos gestionada exitosamente");
      }
    }

    // Paso 4: Crear estructura de archivos
    const fileStructure = createFileStructure(
      codeGenerator,
      diagramName || "backend",
      databaseConfig
    );

    // Agregar lombok.jar al proyecto generado
    try {
      const lombokJarPath = path.join(__dirname, "libs", "lombok.jar");
      if (fs.existsSync(lombokJarPath)) {
        const lombokJarContent = fs.readFileSync(lombokJarPath);
        (fileStructure as any)["libs/lombok.jar"] = lombokJarContent;
        console.log("Lombok JAR agregado al proyecto generado");
      } else {
        console.warn("Archivo lombok.jar no encontrado en:", lombokJarPath);
      }
    } catch (error) {
      console.error("Error al agregar lombok.jar:", error);
    }

    // Paso 5: Crear archivo ZIP
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Mejor compresión
    });

    // Configurar headers para descarga
    const zipFileName = `${diagramName || "backend"}.zip`;
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${zipFileName}"`
    );

    // Pipe del archive a la respuesta
    archive.pipe(res);

    // Agregar archivos al ZIP
    for (const [filePath, content] of Object.entries(fileStructure)) {
      archive.append(content, { name: filePath });
    }

    // Manejar errores
    archive.on("error", (err) => {
      console.error("Error creando ZIP:", err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: "Error creando archivo ZIP",
        });
      }
    });

    // Finalizar el archive
    archive.finalize();

    console.log(
      `ZIP generado exitosamente con ${
        Object.keys(fileStructure).length
      } archivos`
    );
  } catch (error) {
    console.error("Error generando backend:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: `Error interno del servidor: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
      });
    }
  }
});

// Iniciar servidor
server
  .listen(PORT, () => {
    console.log(`🚀 Servidor MVC corriendo en http://localhost:${PORT}`);
    console.log(`📊 WebSocket listo para conexiones`);
    console.log(`🎯 Patrón MVC implementado: Vista -> Controlador -> Modelo`);
  })
  .on("error", (error) => {
    console.error("Error al iniciar servidor:", error);
    process.exit(1);
  });

// Manejar errores no capturados
process.on("uncaughtException", (error) => {
  console.error("Error no capturado:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Rechazo no manejado en:", promise, "razón:", reason);
  process.exit(1);
});

export { app, server, io };
