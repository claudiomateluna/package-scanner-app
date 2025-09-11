-- CORRECCIÓN DE POLÍTICAS DE SEGURIDAD PARA LA TABLA FALTANTES
-- Script para corregir las políticas RLS que están causando el error "new row violates row-level security policy"

-- Primero, eliminar todas las políticas existentes en la tabla faltantes
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar reportes de faltantes" ON faltantes;
DROP POLICY IF EXISTS "Usuarios pueden leer sus propios reportes de faltantes" ON faltantes;
DROP POLICY IF EXISTS "Administradores pueden leer todos los reportes de faltantes" ON faltantes;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios reportes de faltantes" ON faltantes;
DROP POLICY IF EXISTS "Administradores pueden actualizar todos los reportes de faltantes" ON faltantes;

-- Crear nuevas políticas corregidas

-- Política para permitir que los usuarios autenticados inserten reportes
-- Esta política debe permitir inserciones para todos los usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden insertar reportes de faltantes" 
ON faltantes FOR INSERT 
TO authenticated 
WITH CHECK (
  -- Cualquier usuario autenticado puede insertar
  auth.uid() IS NOT NULL
  -- Verificar que el usuario exista en la tabla profiles
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
);

-- Política para permitir que los usuarios autenticados lean sus propios reportes
CREATE POLICY "Usuarios pueden leer sus propios reportes de faltantes" 
ON faltantes FOR SELECT 
TO authenticated 
USING (
  created_by_user_id = auth.uid()
  -- Verificar que el usuario exista en la tabla profiles
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
);

-- Política para permitir que administradores y supervisores lean todos los reportes
CREATE POLICY "Administradores pueden leer todos los reportes de faltantes" 
ON faltantes FOR SELECT 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrador', 'Warehouse Supervisor', 'Store Supervisor'))
  -- Verificar que el usuario exista en la tabla profiles
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
);

-- Política para permitir que los usuarios autenticados actualicen sus propios reportes
CREATE POLICY "Usuarios pueden actualizar sus propios reportes de faltantes" 
ON faltantes FOR UPDATE 
TO authenticated 
USING (
  created_by_user_id = auth.uid()
  -- Verificar que el usuario exista en la tabla profiles
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
)
WITH CHECK (
  created_by_user_id = auth.uid()
  -- Verificar que el usuario exista en la tabla profiles
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
);

-- Política para permitir que administradores y supervisores actualicen todos los reportes
CREATE POLICY "Administradores pueden actualizar todos los reportes de faltantes" 
ON faltantes FOR UPDATE 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrador', 'Warehouse Supervisor', 'Store Supervisor'))
  -- Verificar que el usuario exista en la tabla profiles
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrador', 'Warehouse Supervisor', 'Store Supervisor'))
  -- Verificar que el usuario exista en la tabla profiles
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
);

-- Asegurarse de que RLS está habilitado
ALTER TABLE faltantes ENABLE ROW LEVEL SECURITY;