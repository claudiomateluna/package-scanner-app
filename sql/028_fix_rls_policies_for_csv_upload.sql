-- Solución para el problema de "No autorizado" en carga de CSV
-- Este script corrige las políticas RLS conflictivas en la tabla 'data'

-- Eliminar las políticas problemáticas que restringen el acceso basado en roles
-- y reemplazarlas con una política más adecuada para service_role

-- Primero, eliminar las políticas específicas que podrían interferir
DROP POLICY IF EXISTS "Los usuarios pueden ver datos según su rol y locales" ON data;
DROP POLICY IF EXISTS "Los usuarios pueden ver datos según su rol - SELECT" ON data;
DROP POLICY IF EXISTS "Authenticated users can read data table" ON data;

-- Crear una política más adecuada que permita al service_role hacer cualquier operación
CREATE POLICY "Service role full access to data table" ON data
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- Crear una política específica para que los usuarios autenticados puedan leer
-- según sus roles y locales
CREATE POLICY "Authenticated users can read data based on role and locales" ON data
FOR SELECT TO authenticated
USING (
    -- Administradores pueden ver todos los datos
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'administrador'::user_role
    )
    OR
    -- Warehouse Supervisors y Operators pueden ver datos de sus locales
    (EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = ANY (ARRAY['Warehouse Supervisor'::user_role, 'Warehouse Operator'::user_role])
    ) AND "Local" IN (
        SELECT user_locals.local_name FROM user_locals 
        WHERE user_locals.user_id = auth.uid()
    ))
    OR
    -- Store Supervisors y otros pueden ver datos de sus locales
    (EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = ANY (ARRAY['Store Supervisor'::user_role, 'Store Operator'::user_role, 'SKA Operator'::user_role])
    ) AND "Local" IN (
        SELECT user_locals.local_name FROM user_locals 
        WHERE user_locals.user_id = auth.uid()
    ))
);