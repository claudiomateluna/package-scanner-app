-- UPDATE_FALTANTES_READ_POLICIES.sql
-- Este script actualiza las políticas de lectura para permitir que todos los usuarios autenticados 
-- puedan leer tickets de faltantes/sobrantes

-- Eliminar las políticas de selección existentes
DROP POLICY IF EXISTS "Usuarios pueden leer sus propios reportes de faltantes" ON faltantes;
DROP POLICY IF EXISTS "Administradores pueden leer todos los reportes de faltantes" ON faltantes;

-- Crear una nueva política que permita a todos los usuarios autenticados leer cualquier reporte
CREATE POLICY "Usuarios autenticados pueden leer todos los reportes de faltantes"
ON faltantes FOR SELECT
TO authenticated
USING (true);

-- Verificar las políticas actuales
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'faltantes';