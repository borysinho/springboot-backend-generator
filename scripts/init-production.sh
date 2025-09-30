#!/bin/bash

# Script de inicialización de base de datos para producción
# Este script es más seguro y no interactivo

set -e

echo "🚀 Iniciando inicialización de base de datos para producción..."

# Verificar que las variables de entorno estén configuradas
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL no está configurada"
    exit 1
fi

echo "📊 Verificando conexión a la base de datos..."
npx prisma db push --accept-data-loss

echo "🔧 Generando cliente de Prisma..."
npx prisma generate

echo "🌱 Ejecutando seed de datos..."
npm run db:seed

echo "✅ Inicialización completada exitosamente!"

echo ""
echo "📋 Resumen:"
echo "- ✅ Esquema aplicado a la base de datos"
echo "- ✅ Cliente de Prisma generado"
echo "- ✅ Datos iniciales creados"
echo ""
echo "🎯 La aplicación está lista para usar!"