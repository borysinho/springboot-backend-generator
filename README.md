# JointJS UML Collaboration Platform

Una plataforma### # Testing
npm run test             # Ejecutar tests
npm run test:watch       # Tests en modo watch
npm run test:coverage    # Tests con cobertura
npm run test:ai          # Verificar configuración de API de DeepSeek
npm run test:ai:integration # Ejecutar pruebas de integración completas con DeepSeekey de DeepSeek

Para usar el asistente de IA integrado, necesitas configurar una API key válida de DeepSeek:

1. Ve a [DeepSeek Platform](https://platform.deepseek.com/)
2. Crea una nueva API key
3. Copia el archivo `.env.example` a `.env`
4. Agrega tu API key:

```bash
VITE_IA_API_KEY=tu-api-key-valida-de-deepseek
```

**Nota:** Sin una API key válida, el asistente de IA mostrará un error 401.ón para crear y editar diagramas UML en tiempo real utilizando JointJS.

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
npm run test:ai          # Verificar configuración de API de Google AI
```

## ⚙️ Configuración

### API Key de Google AI (Gemini)

Para usar el asistente de IA integrado, necesitas configurar una API key válida de Google AI:

1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crea una nueva API key
3. Copia el archivo `.env.example` a `.env`
4. Agrega tu API key:

```bash
VITE_IA_API_KEY=tu-api-key-valida-de-google-ai
```

**Nota:** Sin una API key válida, el asistente de IA mostrará un error 400.

### Base de Datos

La aplicación utiliza PostgreSQL. Configura la conexión en el archivo `.env`:

```bash
DATABASE_URL="postgresql://usuario:password@localhost:5432/uml_collab?schema=public"
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
