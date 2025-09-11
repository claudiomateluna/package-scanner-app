-- POLÍTICAS DE SEGURIDAD PARA LA TABLA TICKET_COUNTERS
-- Script para asegurar que la tabla ticket_counters tenga las políticas adecuadas

-- Asegurarse de que RLS está habilitado
ALTER TABLE ticket_counters ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Usuarios autenticados pueden leer contadores" ON ticket_counters;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar contadores" ON ticket_counters;

-- Política para permitir que los usuarios autenticados lean los contadores
CREATE POLICY "Usuarios autenticados pueden leer contadores" 
ON ticket_counters FOR SELECT 
TO authenticated 
USING (
  -- Cualquier usuario autenticado puede leer
  auth.uid() IS NOT NULL
  -- Verificar que el usuario exista en la tabla profiles
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
);

-- Política para permitir que los usuarios autenticados actualicen los contadores
CREATE POLICY "Usuarios autenticados pueden actualizar contadores" 
ON ticket_counters FOR UPDATE 
TO authenticated 
USING (
  -- Cualquier usuario autenticado puede actualizar
  auth.uid() IS NOT NULL
  -- Verificar que el usuario exista en la tabla profiles
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
)
WITH CHECK (
  -- Cualquier usuario autenticado puede actualizar
  auth.uid() IS NOT NULL
  -- Verificar que el usuario exista en la tabla profiles
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
);

-- Política para permitir que los usuarios autenticados inserten contadores
CREATE POLICY "Usuarios autenticados pueden insertar contadores" 
ON ticket_counters FOR INSERT 
TO authenticated 
WITH CHECK (
  -- Cualquier usuario autenticado puede insertar
  auth.uid() IS NOT NULL
  -- Verificar que el usuario exista en la tabla profiles
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
);