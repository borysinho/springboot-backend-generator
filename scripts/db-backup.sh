#!/bin/bash

# Scripts de respaldo y restauración de base de datos
# Uso: ./scripts/db-backup.sh [backup|restore] [archivo]

set -e

# Configuración
DB_NAME="uml_collab"
DB_USER="jointjs_user"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Crear directorio de respaldos si no existe
mkdir -p "$BACKUP_DIR"

case "$1" in
    "backup")
        echo "📦 Creando respaldo de la base de datos..."
        BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

        pg_dump -U "$DB_USER" -h localhost -d "$DB_NAME" > "$BACKUP_FILE"

        echo "✅ Respaldo creado: $BACKUP_FILE"

        # Comprimir el respaldo
        gzip "$BACKUP_FILE"
        echo "✅ Respaldo comprimido: $BACKUP_FILE.gz"

        # Mantener solo los últimos 10 respaldos
        cd "$BACKUP_DIR"
        ls -t backup_*.sql.gz | tail -n +11 | xargs -r rm
        echo "🧹 Respaldos antiguos eliminados (manteniendo últimos 10)"
        ;;

    "restore")
        if [ -z "$2" ]; then
            echo "❌ Error: Debes especificar el archivo de respaldo"
            echo "Uso: $0 restore <archivo.sql.gz>"
            exit 1
        fi

        BACKUP_FILE="$2"

        if [ ! -f "$BACKUP_FILE" ]; then
            echo "❌ Error: Archivo de respaldo no encontrado: $BACKUP_FILE"
            exit 1
        fi

        echo "⚠️  ATENCIÓN: Esto eliminará todos los datos actuales"
        read -p "¿Estás seguro de que quieres restaurar la base de datos? (y/N): " -n 1 -r
        echo

        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "❌ Restauración cancelada"
            exit 1
        fi

        echo "🔄 Restaurando base de datos desde $BACKUP_FILE..."

        # Descomprimir si es necesario
        if [[ "$BACKUP_FILE" == *.gz ]]; then
            gunzip -c "$BACKUP_FILE" | psql -U "$DB_USER" -h localhost -d "$DB_NAME"
        else
            psql -U "$DB_USER" -h localhost -d "$DB_NAME" < "$BACKUP_FILE"
        fi

        echo "✅ Base de datos restaurada exitosamente"
        ;;

    "list")
        echo "📋 Respaldos disponibles:"
        ls -la "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null || echo "No se encontraron respaldos"
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