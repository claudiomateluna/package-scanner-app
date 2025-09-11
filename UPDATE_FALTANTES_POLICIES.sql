-- UPDATE_FALTANTES_POLICIES.sql
-- Script para actualizar las políticas de seguridad de la tabla faltantes
-- Permitir que usuarios con roles adecuados vean y editen reportes de otros usuarios

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Usuarios pueden leer sus propios reportes de faltantes" ON faltantes;
DROP POLICY IF EXISTS "Administradores pueden leer todos los reportes de faltantes" ON faltantes;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios reportes de faltantes" ON faltantes;
DROP POLICY IF EXISTS "Administradores pueden actualizar todos los reportes de faltantes" ON faltantes;

-- Crear políticas actualizadas para la tabla faltantes
-- Política para lectura - usuarios pueden leer sus propios reportes y reportes de su local
CREATE POLICY "Usuarios pueden leer reportes de faltantes" 
ON faltantes FOR SELECT 
TO authenticated 
USING (
  -- Usuarios pueden leer sus propios reportes
  created_by_user_id = auth.uid()
  OR
  -- Usuarios con roles de supervisor pueden leer todos los reportes
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrador', 'Warehouse Supervisor', 'Store Supervisor'))
  OR
  -- Usuarios pueden leer reportes de su mismo local
  nombre_local IN (
    SELECT local_name FROM user_locals WHERE user_id = auth.uid()
  )
);

-- Política para actualización - usuarios pueden actualizar sus propios reportes y usuarios con roles adecuados pueden actualizar todos
CREATE POLICY "Usuarios pueden actualizar reportes de faltantes" 
ON faltantes FOR UPDATE 
TO authenticated 
USING (
  -- Usuarios pueden actualizar sus propios reportes
  created_by_user_id = auth.uid()
  OR
  -- Usuarios con roles de supervisor pueden actualizar todos los reportes
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrador', 'Warehouse Supervisor', 'Store Supervisor'))
)
WITH CHECK (
  -- Usuarios pueden actualizar sus propios reportes
  created_by_user_id = auth.uid()
  OR
  -- Usuarios con roles de supervisor pueden actualizar todos los reportes
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrador', 'Warehouse Supervisor', 'Store Supervisor'))
);

-- Asegurar que RLS está habilitado
ALTER TABLE faltantes ENABLE ROW LEVEL SECURITY;