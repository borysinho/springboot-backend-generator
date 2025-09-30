# JointJS UML Collaboration Platform

Una plataforma de colaboración para crear y editar diagramas UML en tiempo real utilizando JointJS.

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Configurar base de datos
cp .env.example .env
# Editar .env con tu configuración de base de datos

# Inicializar base de datos
npm run db:init

# Iniciar servidor de desarrollo
npm run server:dev

# En otra terminal, iniciar cliente
npm run dev
```

La aplicación estará disponible en:

- **Cliente:** http://localhost:5174
- **Servidor API:** http://localhost:3001

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar cliente de desarrollo
npm run server:dev       # Iniciar servidor de desarrollo
npm run build            # Construir para producción

# Base de datos
npm run db:init          # Inicializar base de datos completa
npm run db:migrate       # Ejecutar migraciones
npm run db:seed          # Poblar datos de ejemplo
npm run db:studio        # Abrir Prisma Studio

# Testing
npm run test             # Ejecutar tests
npm run test:watch       # Tests en modo watch
npm run test:coverage    # Tests con cobertura
```

## 🏗️ Arquitectura

- **Frontend:** React + TypeScript + JointJS + Socket.IO
- **Backend:** Node.js + Express + Socket.IO + Prisma ORM
- **Base de datos:** PostgreSQL
- **Comunicación:** WebSocket con JSON Patch operations

## 📋 Características

- ✅ Creación colaborativa de diagramas UML
- ✅ Sincronización en tiempo real
- ✅ Validación UML integrada
- ✅ Sistema de invitaciones
- ✅ Autenticación de usuarios
- ✅ Persistencia con PostgreSQL

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request
