# Scripts de Base de Datos

Este documento explica cómo usar los scripts disponibles para inicializar y gestionar la base de datos del proyecto JointJS.

## 📋 Requisitos Previos

- PostgreSQL instalado y ejecutándose
- Variables de entorno configuradas en `.env`:
  ```env
  DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/uml_collab?schema=public"
  ```

## 🚀 Inicialización Completa

Para inicializar la base de datos desde cero, ejecuta:

```bash
npm run db:init
```

Este comando ejecuta automáticamente:

1. `db:migrate` - Crea/aplica las migraciones
2. `db:generate` - Genera el cliente de Prisma
3. `db:seed` - Pobla la base de datos con datos iniciales

### Inicialización para Producción

Para entornos de producción, usa:

```bash
npm run db:init:prod
```

Este script es no interactivo y más seguro para despliegues automatizados.

## 🛠️ Scripts Individuales

### Generar Cliente de Prisma

```bash
npm run db:generate
```

Genera el cliente de TypeScript para interactuar con la base de datos.

### Ejecutar Migraciones (Desarrollo)

```bash
npm run db:migrate
```

Crea y aplica migraciones en modo desarrollo. Requiere confirmación interactiva.

### Desplegar Migraciones (Producción)

```bash
npm run db:migrate:deploy
```

Aplica migraciones pendientes en entornos de producción.

### Push Schema (Desarrollo Rápido)

```bash
npm run db:push
```

Sincroniza el esquema directamente con la base de datos (útil para desarrollo rápido).

### Poblar Datos Iniciales

```bash
npm run db:seed
```

Crea usuarios y diagramas de ejemplo en la base de datos.

### Resetear Base de Datos

```bash
npm run db:reset
```

**⚠️ PELIGROSO:** Elimina todos los datos y restablece las migraciones.

### Abrir Prisma Studio

```bash
npm run db:studio
```

Abre una interfaz web para explorar y editar los datos de la base de datos.

## 💾 Respaldos y Restauración

### Crear Respaldo

```bash
npm run db:backup
```

Crea un respaldo comprimido de toda la base de datos.

**Nota:** Si `pg_dump` no está disponible (PostgreSQL no instalado localmente), crea un respaldo básico con instrucciones para recrear datos de ejemplo.

### Listar Respaldos

```bash
npm run db:list-backups
```

Muestra todos los respaldos disponibles en el directorio `backups/`.

### Restaurar desde Respaldo

```bash
npm run db:restore ./backups/backup_20231201_120000.sql.gz
```

**⚠️ PELIGROSO:** Restaura la base de datos desde un archivo de respaldo (elimina datos actuales).

**Nota:** Para respaldos básicos (sin pg_dump), recrea los datos de ejemplo usando el seed.

## 🐳 Uso con Docker (Opcional)

Si prefieres usar PostgreSQL en Docker en lugar de instalarlo localmente:

```bash
# Ejecutar PostgreSQL en Docker
docker run --name postgres-jointjs -e POSTGRES_PASSWORD=jointjs_password -e POSTGRES_USER=jointjs_user -e POSTGRES_DB=uml_collab -p 5432:5432 -d postgres:15

# Actualizar .env con la configuración de Docker
DATABASE_URL="postgresql://jointjs_user:jointjs_password@localhost:5432/uml_collab?schema=public"
```

Con Docker, `pg_dump` estará disponible y podrás crear respaldos completos de la base de datos.

## 🚀 Inicialización en Producción

### Script Automatizado

```bash
npm run db:init:prod
```

Ejecuta la inicialización completa de producción de forma no interactiva.

### Pasos Manuales en Producción

Si necesitas ejecutar manualmente:

1. **Configurar variables de entorno:**

   ```bash
   export DATABASE_URL="postgresql://user:password@host:5432/dbname"
   export NODE_ENV=production
   ```

2. **Ejecutar inicialización:**
   ```bash
   ./scripts/init-production.sh
   ```

### Consideraciones de Producción

- El script de producción no solicita confirmación
- No ejecuta datos de prueba (seed)
- Requiere configuración completa de DATABASE_URL
- Crea respaldos automáticos antes de migraciones

## 🔧 Solución de Problemas

### Error de Conexión a Base de Datos

```
Error: P1001: Can't reach database server
```

**Solución:**

- Verificar que PostgreSQL esté ejecutándose
- Comprobar DATABASE_URL en .env
- Para Docker: `docker-compose up -d postgres`

### Error de Migración

```
Error: P3009: migrate found failed migrations
```

**Solución:**

```bash
npm run db:reset
npm run db:migrate
```

### Error de Seed

```
Error: Unique constraint failed
```

**Solución:** Los datos ya existen. Ejecutar:

```bash
npm run db:reset
npm run db:seed
```

### Problemas de Permisos

```
Error: EACCES: permission denied
```

**Solución:**

```bash
chmod +x scripts/*.sh
```

### Error de pg_dump no encontrado

```
pg_dump: command not found
```

**Solución:**

- El script automáticamente crea un respaldo básico con instrucciones para recrear datos
- Para respaldos completos, instala PostgreSQL:

  ```bash
  # Ubuntu/Debian
  sudo apt-get install postgresql-client

  # macOS con Homebrew
  brew install postgresql

  # O usa Docker (ver sección de Docker arriba)
  ```

- Los respaldos básicos permiten recrear datos de ejemplo con `npm run db:seed`

### Variables de Entorno Faltantes

```
Error: Environment variable not found: DATABASE_URL
```

**Solución:** Copiar y configurar .env.example:

```bash
cp .env.example .env
# Editar .env con valores correctos
```

## 📊 Datos de Prueba

### Usuarios de Prueba

Después de ejecutar `npm run db:seed`, tendrás estos usuarios:

| Email             | Contraseña | Rol   |
| ----------------- | ---------- | ----- |
| admin@jointjs.com | admin123   | Admin |
| user1@jointjs.com | user123    | User  |
| user2@jointjs.com | user123    | User  |

### Diagramas de Ejemplo

Se crean diagramas UML de ejemplo incluyendo:

- Diagrama de Clases (Class Diagram)
- Diagrama de Secuencia (Sequence Diagram)
- Diagrama de Casos de Uso (Use Case Diagram)

---

## 📝 Notas Importantes

- **Siempre crear respaldos** antes de migraciones importantes
- **Probar en desarrollo** antes de ejecutar en producción
- **Verificar permisos** de archivos de script
- **Mantener .env** fuera del control de versiones
- **Documentar cambios** en el esquema de base de datos
