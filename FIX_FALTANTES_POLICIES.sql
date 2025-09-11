-- FIX_FALTANTES_POLICIES.sql
-- Script para corregir las políticas de seguridad de la tabla faltantes

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar reportes de faltantes" ON faltantes;
DROP POLICY IF EXISTS "Usuarios pueden leer sus propios reportes de faltantes" ON faltantes;
DROP POLICY IF EXISTS "Administradores pueden leer todos los reportes de faltantes" ON faltantes;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios reportes de faltantes" ON faltantes;
DROP POLICY IF EXISTS "Administradores pueden actualizar todos los reportes de faltantes" ON faltantes;

-- Crear políticas corregidas para la tabla faltantes
-- Política para inserción - permitir a todos los usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden insertar reportes de faltantes" 
ON faltantes FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Política para lectura - usuarios pueden leer sus propios reportes
CREATE POLICY "Usuarios pueden leer sus propios reportes de faltantes" 
ON faltantes FOR SELECT 
TO authenticated 
USING (created_by_user_id = auth.uid());

-- Política para lectura - administradores pueden leer todos los reportes
CREATE POLICY "Administradores pueden leer todos los reportes de faltantes" 
ON faltantes FOR SELECT 
TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrador', 'Warehouse Supervisor', 'Store Supervisor')));

-- Política para actualización - usuarios pueden actualizar sus propios reportes
CREATE POLICY "Usuarios pueden actualizar sus propios reportes de faltantes" 
ON faltantes FOR UPDATE 
TO authenticated 
USING (created_by_user_id = auth.uid())
WITH CHECK (created_by_user_id = auth.uid());

-- Política para actualización - administradores pueden actualizar todos los reportes
CREATE POLICY "Administradores pueden actualizar todos los reportes de faltantes" 
ON faltantes FOR UPDATE 
TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrador', 'Warehouse Supervisor', 'Store Supervisor')))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrador', 'Warehouse Supervisor', 'Store Supervisor')));

-- Asegurar que RLS está habilitado
ALTER TABLE faltantes ENABLE ROW LEVEL SECURITY;