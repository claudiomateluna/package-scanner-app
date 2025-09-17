-- UPDATE_FALTANTES_POLICIES_SIMPLE.sql
-- Script para actualizar las políticas de la tabla faltantes
-- Ejecutar este script en el SQL Editor del dashboard de Supabase

-- 1. Eliminar políticas de selección existentes
DROP POLICY IF EXISTS "Usuarios pueden leer sus propios reportes de faltantes" ON faltantes;
DROP POLICY IF EXISTS "Administradores pueden leer todos los reportes de faltantes" ON faltantes;

-- 2. Crear nueva política que permita a todos los usuarios autenticados leer cualquier reporte
CREATE POLICY "Usuarios autenticados pueden leer todos los reportes de faltantes"
ON faltantes FOR SELECT
TO authenticated
USING (true);

-- 3. Verificar las políticas actuales
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'faltantes';