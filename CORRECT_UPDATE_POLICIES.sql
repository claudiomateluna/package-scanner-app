-- CORRECT_UPDATE_POLICIES.sql
-- Script para corregir las políticas de actualización de la tabla faltantes

-- Eliminar políticas de actualización existentes
DROP POLICY IF EXISTS "Usuarios pueden actualizar reportes de faltantes" ON faltantes;

-- Crear política corregida para actualización
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