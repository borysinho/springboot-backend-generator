import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de la base de datos...");

  // Crear usuario administrador
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@jointjs.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@jointjs.com",
      password: adminPassword,
    },
  });
  console.log("✅ Usuario administrador creado:", admin.email);

  // Crear usuario de prueba
  const testPassword = await bcrypt.hash("123456", 10);
  const testUser = await prisma.user.upsert({
    where: { email: "borysquiroga@gmail.com" },
    update: {},
    create: {
      name: "Borys",
      email: "borysquiroga@gmail.com",
      password: testPassword,
    },
  });
  console.log("✅ Usuario de prueba creado:", testUser.email);

  // Crear usuario colaborador
  const collabPassword = await bcrypt.hash("collab123", 10);
  const collabUser = await prisma.user.upsert({
    where: { email: "colaborador@jointjs.com" },
    update: {},
    create: {
      name: "Colaborador",
      email: "colaborador@jointjs.com",
      password: collabPassword,
    },
  });
  console.log("✅ Usuario colaborador creado:", collabUser.email);

  // Crear diagramas de ejemplo
  const diagram1 = await prisma.diagramSnapshot.upsert({
    where: { diagramId: "diagram-admin-001" },
    update: {},
    create: {
      diagramId: "diagram-admin-001",
      name: "Diagrama de Clases - Sistema UML",
      description: "Diagrama de ejemplo mostrando un sistema UML básico",
      creatorId: admin.id,
      collaborators: [testUser.id],
      state: {
        elements: [
          {
            id: "class1",
            type: "uml.Class",
            position: { x: 100, y: 100 },
            size: { width: 160, height: 100 },
            attributes: ["+ nombre: String", "+ edad: int"],
            methods: ["+ getNombre(): String", "+ setEdad(edad: int): void"],
            name: "Persona",
          },
          {
            id: "class2",
            type: "uml.Class",
            position: { x: 350, y: 100 },
            size: { width: 160, height: 100 },
            attributes: ["- estudiantes: List<Persona>"],
            methods: [
              "+ agregarEstudiante(persona: Persona): void",
              "+ getEstudiantes(): List<Persona>",
            ],
            name: "Curso",
          },
        ],
        links: [
          {
            id: "link1",
            type: "uml.Association",
            source: { id: "class1" },
            target: { id: "class2" },
            labels: [{ position: 0.5, attrs: { text: { text: "1..*" } } }],
          },
        ],
      },
      isPublic: true,
      tags: ["ejemplo", "uml", "clases"],
    },
  });
  console.log("✅ Diagrama de ejemplo creado:", diagram1.name);

  const diagram2 = await prisma.diagramSnapshot.upsert({
    where: { diagramId: "diagram-test-001" },
    update: {},
    create: {
      diagramId: "diagram-test-001",
      name: "Diagrama de Secuencia - Login",
      description: "Diagrama de secuencia mostrando el proceso de login",
      creatorId: testUser.id,
      collaborators: [],
      state: {
        elements: [
          {
            id: "actor1",
            type: "uml.Actor",
            position: { x: 50, y: 50 },
            name: "Usuario",
          },
          {
            id: "lifeline1",
            type: "uml.Lifeline",
            position: { x: 200, y: 50 },
            name: "Sistema",
          },
        ],
        links: [
          {
            id: "message1",
            type: "uml.Message",
            source: { id: "actor1" },
            target: { id: "lifeline1" },
            labels: [
              {
                position: 0.5,
                attrs: { text: { text: "ingresarCredenciales()" } },
              },
            ],
          },
          {
            id: "message2",
            type: "uml.Message",
            source: { id: "lifeline1" },
            target: { id: "actor1" },
            labels: [
              {
                position: 0.5,
                attrs: { text: { text: "validarCredenciales()" } },
              },
            ],
          },
        ],
      },
      isPublic: false,
      tags: ["secuencia", "login", "autenticación"],
    },
  });
  console.log("✅ Diagrama de secuencia creado:", diagram2.name);

  // Crear invitaciones de ejemplo
  const invitation1 = await prisma.invitation.create({
    data: {
      diagramId: diagram1.diagramId,
      creatorId: admin.id,
      inviteeEmail: collabUser.email,
      message: "Te invito a colaborar en este diagrama de clases UML",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
    },
  });
  console.log(
    "✅ Invitación de ejemplo creada para:",
    invitation1.inviteeEmail
  );

  console.log("🎉 Seed completado exitosamente!");
  console.log("\n📋 Credenciales de acceso:");
  console.log("Admin: admin@jointjs.com / admin123");
  console.log("Usuario: borysquiroga@gmail.com / 123456");
  console.log("Colaborador: colaborador@jointjs.com / collab123");
}

main()
  .catch((e) => {
    console.error("❌ Error durante el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
