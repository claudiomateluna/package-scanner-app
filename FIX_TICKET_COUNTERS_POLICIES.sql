-- FIX_TICKET_COUNTERS_POLICIES.sql
-- Script para corregir las políticas de seguridad de la tabla ticket_counters

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Usuarios autenticados pueden leer contadores" ON ticket_counters;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar contadores" ON ticket_counters;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar contadores" ON ticket_counters;

-- Crear políticas corregidas para la tabla ticket_counters
-- Política para lectura
CREATE POLICY "Usuarios autenticados pueden leer contadores" 
ON ticket_counters FOR SELECT 
TO authenticated 
USING (true);

-- Política para actualización
CREATE POLICY "Usuarios autenticados pueden actualizar contadores" 
ON ticket_counters FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Política para inserción
CREATE POLICY "Usuarios autenticados pueden insertar contadores" 
ON ticket_counters FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Asegurar que RLS está habilitado
ALTER TABLE ticket_counters ENABLE ROW LEVEL SECURITY;