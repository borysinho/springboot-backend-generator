#!/bin/bash

# Script de respaldo simple usando pg_dump si está disponible, o alternativa
# Uso: ./scripts/db-backup-simple.sh [backup|restore|list] [archivo]

set -e

# Configuración
BACKUP_DIR="./backups"

# Crear directorio de respaldos si no existe
mkdir -p "$BACKUP_DIR"

# Función para intentar respaldo con pg_dump
try_pg_dump_backup() {
    if command -v pg_dump &> /dev/null; then
        echo "📦 Creando respaldo usando pg_dump..."

        # Extraer credenciales de DATABASE_URL
        DB_URL=$(grep DATABASE_URL .env | cut -d'"' -f2)
        DB_USER=$(echo $DB_URL | sed -n 's|.*://\([^:]*\):.*|\1|p')
        DB_PASS=$(echo $DB_URL | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
        DB_HOST=$(echo $DB_URL | sed -n 's|.*@\([^:]*\):.*|\1|p')
        DB_PORT=$(echo $DB_URL | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
        DB_NAME=$(echo $DB_URL | sed -n 's|.*/\([^?]*\).*|\1|p')

        TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
        BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

        export PGPASSWORD="$DB_PASS"
        pg_dump -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" > "$BACKUP_FILE"

        echo "✅ Respaldo creado: $BACKUP_FILE"

        # Comprimir el respaldo
        gzip "$BACKUP_FILE"
        echo "✅ Respaldo comprimido: $BACKUP_FILE.gz"

        # Mantener solo los últimos 10 respaldos
        cd "$BACKUP_DIR"
        ls -t backup_*.sql.gz | tail -n +11 | xargs -r rm
        echo "🧹 Respaldos antiguos eliminados (manteniendo últimos 10)"

        return 0
    else
        return 1
    fi
}

# Función de respaldo alternativo usando Prisma
alternative_backup() {
    echo "⚠️  pg_dump no encontrado, creando respaldo básico con Prisma..."

    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.txt"

    # Crear un respaldo básico con información del esquema
    echo "Respaldo creado el: $(date)" > "$BACKUP_FILE"
    echo "Versión: Básica (pg_dump no disponible)" >> "$BACKUP_FILE"
    echo "" >> "$BACKUP_FILE"
    echo "Para restaurar, ejecuta:" >> "$BACKUP_FILE"
    echo "npm run db:reset" >> "$BACKUP_FILE"
    echo "npm run db:seed" >> "$BACKUP_FILE"
    echo "" >> "$BACKUP_FILE"
    echo "Esto recreará los datos de ejemplo." >> "$BACKUP_FILE"

    echo "✅ Respaldo básico creado: $BACKUP_FILE"
    echo "⚠️  NOTA: Este respaldo no contiene datos específicos, solo instrucciones para recrear datos de ejemplo"
}

# Función de respaldo principal
backup() {
    if ! try_pg_dump_backup; then
        alternative_backup
    fi
}

# Función para restaurar
restore() {
    if [ -z "$2" ]; then
        echo "❌ Error: Debes especificar el archivo de respaldo"
        echo "Uso: $0 restore <archivo>"
        exit 1
    fi

    BACKUP_FILE="$2"

    if [ ! -f "$BACKUP_FILE" ]; then
        echo "❌ Error: Archivo de respaldo no encontrado: $BACKUP_FILE"
        exit 1
    fi

    echo "⚠️  ATENCIÓN: Esto eliminará todos los datos actuales"

    # Verificar si es un respaldo básico
    if grep -q "Versión: Básica" "$BACKUP_FILE"; then
        echo "Este es un respaldo básico. Se recrearán los datos de ejemplo."
        read -p "¿Continuar? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "❌ Restauración cancelada"
            exit 1
        fi

        echo "🔄 Recreando datos de ejemplo..."
        npm run db:reset
        npm run db:seed
        echo "✅ Datos de ejemplo recreados"
        return
    fi

    # Para respaldos reales con pg_dump
    if command -v psql &> /dev/null; then
        read -p "¿Estás seguro de que quieres restaurar la base de datos? (y/N): " -n 1 -r
        echo

        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "❌ Restauración cancelada"
            exit 1
        fi

        echo "🔄 Restaurando base de datos desde $BACKUP_FILE..."

        # Extraer credenciales de DATABASE_URL
        DB_URL=$(grep DATABASE_URL .env | cut -d'"' -f2)
        DB_USER=$(echo $DB_URL | sed -n 's|.*://\([^:]*\):.*|\1|p')
        DB_PASS=$(echo $DB_URL | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
        DB_HOST=$(echo $DB_URL | sed -n 's|.*@\([^:]*\):.*|\1|p')
        DB_PORT=$(echo $DB_URL | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
        DB_NAME=$(echo $DB_URL | sed -n 's|.*/\([^?]*\).*|\1|p')

        export PGPASSWORD="$DB_PASS"

        # Descomprimir si es necesario
        if [[ "$BACKUP_FILE" == *.gz ]]; then
            gunzip -c "$BACKUP_FILE" | psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME"
        else
            psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" < "$BACKUP_FILE"
        fi

        echo "✅ Base de datos restaurada exitosamente"
    else
        echo "❌ Error: psql no está disponible para restaurar"
        echo "Para restaurar, necesitas instalar PostgreSQL o usar Docker"
        exit 1
    fi
}

# Función para listar respaldos
list() {
    echo "📋 Respaldos disponibles:"
    ls -la "$BACKUP_DIR"/backup_* 2>/dev/null || echo "No se encontraron respaldos"
}

case "$1" in
    "backup")
        backup
        ;;
    "restore")
        restore "$1" "$2"
        ;;
    "list")
        list
        ;;
    *)
        echo "📖 Uso: $0 {backup|restore|list} [archivo]"
        echo ""
        echo "Comandos:"
        echo "  backup              Crear un nuevo respaldo"
        echo "  restore <archivo>   Restaurar desde un archivo de respaldo"
        echo "  list                Listar respaldos disponibles"
        echo ""
        echo "Ejemplos:"
        echo "  $0 backup"
        echo "  $0 restore ./backups/backup_20231201_120000.sql.gz"
        echo "  $0 list"
        exit 1
        ;;
esac