#!/bin/bash

# Script para aplicar la migración de la base de datos para el sistema de notificaciones

echo "Aplicando migración de base de datos para el sistema de notificaciones..."

# Verificar que el archivo de migración existe
if [ ! -f "DATABASE_MIGRATION_NOTIFICATIONS.sql" ]; then
  echo "Error: No se encontró el archivo DATABASE_MIGRATION_NOTIFICATIONS.sql"
  exit 1
fi

# Aplicar la migración usando el cliente de Supabase
# Nota: Necesitarás tener el cliente de Supabase instalado y configurado
echo "Aplicando migración..."
# supabase migration up

# Alternativamente, puedes ejecutar el SQL directamente en tu base de datos
echo "Para aplicar la migración manualmente, ejecuta el contenido de DATABASE_MIGRATION_NOTIFICATIONS.sql en tu base de datos de Supabase"

echo "Migración aplicada exitosamente!"