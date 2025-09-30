#!/usr/bin/env node

// Script de respaldo usando Prisma Client
// Uso: node scripts/db-backup-node.js [backup|restore|list] [archivo]

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

async function backup() {
  console.log("📦 Creando respaldo de la base de datos...");

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  const backupDir = path.join(
    path.dirname(new URL(import.meta.url).pathname),
    "..",
    "backups"
  );
  const backupFile = path.join(backupDir, `backup_${timestamp}.json`);

  // Crear directorio si no existe
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  try {
    // Obtener todos los datos
    const [users, diagrams, invitations] = await Promise.all([
      prisma.user.findMany(),
      prisma.diagram.findMany(),
      prisma.invitation.findMany(),
    ]);

    const backupData = {
      metadata: {
        created_at: new Date().toISOString(),
        version: "1.0",
        description: "Database backup created with Prisma Client",
      },
      data: {
        users,
        diagrams,
        invitations,
      },
    };

    // Escribir archivo de respaldo
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    console.log(`✅ Respaldo creado: ${backupFile}`);

    // Comprimir el respaldo
    const compressedFile = `${backupFile}.gz`;
    execSync(`gzip "${backupFile}"`);
    console.log(`✅ Respaldo comprimido: ${compressedFile}`);

    // Mantener solo los últimos 10 respaldos
    const backupFiles = fs
      .readdirSync(backupDir)
      .filter((file) => file.startsWith("backup_") && file.endsWith(".json.gz"))
      .sort()
      .reverse();

    if (backupFiles.length > 10) {
      const filesToDelete = backupFiles.slice(10);
      filesToDelete.forEach((file) => {
        fs.unlinkSync(path.join(backupDir, file));
      });
      console.log("🧹 Respaldos antiguos eliminados (manteniendo últimos 10)");
    }
  } catch (error) {
    console.error("❌ Error creando respaldo:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function restore(backupFile) {
  if (!backupFile) {
    console.error("❌ Error: Debes especificar el archivo de respaldo");
    console.error(
      "Uso: node scripts/db-backup-node.js restore <archivo.json.gz>"
    );
    process.exit(1);
  }

  const fullPath = path.resolve(backupFile);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Error: Archivo de respaldo no encontrado: ${fullPath}`);
    process.exit(1);
  }

  console.log("⚠️  ATENCIÓN: Esto eliminará todos los datos actuales");
  console.log(
    "¿Estás seguro de que quieres restaurar la base de datos? (y/N): "
  );

  // En un script automatizado, asumimos que sí (para producción)
  // En desarrollo, el usuario debería confirmar manualmente
  const shouldProceed =
    process.env.NODE_ENV === "production" || process.argv.includes("--force");

  if (!shouldProceed) {
    console.log("❌ Restauración cancelada. Usa --force para confirmar.");
    process.exit(1);
  }

  try {
    console.log(`🔄 Restaurando base de datos desde ${fullPath}...`);

    // Leer y descomprimir archivo de respaldo
    let backupData;
    if (fullPath.endsWith(".gz")) {
      const compressedData = fs.readFileSync(fullPath);
      const decompressedData = execSync("gunzip -c", { input: compressedData });
      backupData = JSON.parse(decompressedData.toString());
    } else {
      backupData = JSON.parse(fs.readFileSync(fullPath, "utf8"));
    }

    // Resetear base de datos
    console.log("Resetando base de datos...");
    execSync("npx prisma migrate reset --force --skip-generate", {
      stdio: "inherit",
    });

    // Restaurar datos
    if (backupData.data.users && backupData.data.users.length > 0) {
      console.log(`Restaurando ${backupData.data.users.length} usuarios...`);
      for (const user of backupData.data.users) {
        await prisma.user.upsert({
          where: { id: user.id },
          update: user,
          create: user,
        });
      }
    }

    if (backupData.data.diagrams && backupData.data.diagrams.length > 0) {
      console.log(
        `Restaurando ${backupData.data.diagrams.length} diagramas...`
      );
      for (const diagram of backupData.data.diagrams) {
        await prisma.diagram.upsert({
          where: { id: diagram.id },
          update: diagram,
          create: diagram,
        });
      }
    }

    if (backupData.data.invitations && backupData.data.invitations.length > 0) {
      console.log(
        `Restaurando ${backupData.data.invitations.length} invitaciones...`
      );
      for (const invitation of backupData.data.invitations) {
        await prisma.invitation.upsert({
          where: { id: invitation.id },
          update: invitation,
          create: invitation,
        });
      }
    }

    console.log("✅ Base de datos restaurada exitosamente");
  } catch (error) {
    console.error("❌ Error restaurando base de datos:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

function list() {
  const backupDir = path.join(
    path.dirname(new URL(import.meta.url).pathname),
    "..",
    "backups"
  );

  if (!fs.existsSync(backupDir)) {
    console.log("No se encontraron respaldos");
    return;
  }

  const backupFiles = fs
    .readdirSync(backupDir)
    .filter((file) => file.startsWith("backup_") && file.endsWith(".json.gz"))
    .sort()
    .reverse();

  if (backupFiles.length === 0) {
    console.log("No se encontraron respaldos");
    return;
  }

  console.log("📋 Respaldos disponibles:");
  backupFiles.forEach((file) => {
    const filePath = path.join(backupDir, file);
    const stats = fs.statSync(filePath);
    const size = (stats.size / 1024).toFixed(1);
    console.log(`${file} (${size} KB) - ${stats.mtime.toISOString()}`);
  });
}

async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];

  switch (command) {
    case "backup":
      await backup();
      break;
    case "restore":
      await restore(arg);
      break;
    case "list":
      list();
      break;
    default:
      console.log(
        "📖 Uso: node scripts/db-backup-node.js {backup|restore|list} [archivo]"
      );
      console.log("");
      console.log("Comandos:");
      console.log("  backup              Crear un nuevo respaldo");
      console.log(
        "  restore <archivo>   Restaurar desde un archivo de respaldo"
      );
      console.log("  list                Listar respaldos disponibles");
      console.log("");
      console.log("Ejemplos:");
      console.log("  node scripts/db-backup-node.js backup");
      console.log(
        "  node scripts/db-backup-node.js restore ./backups/backup_2023-09-30T18-30-25.json.gz"
      );
      console.log("  node scripts/db-backup-node.js list");
      process.exit(1);
  }
}

main().catch(console.error);
