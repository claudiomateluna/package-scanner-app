-- Script para identificar el trigger en la tabla 'data' y entender su impacto

-- 1. Verificar detalles específicos del trigger en la tabla 'data'
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing,
    action_orientation,
    action_condition
FROM information_schema.triggers
WHERE event_object_table = 'data';

-- 2. Verificar si hay funciones asociadas con triggers que puedan afectar el upsert
SELECT 
    n.nspname AS schema_name,
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname LIKE '%data%' OR p.proname LIKE '%olpn%' OR p.proname LIKE '%upsert%';

-- 3. Verificar si hay RLS habilitado (como no apareció en 024, lo verificamos explícitamente)
SELECT 
    schemaname,
    tablename,
    rowsecurity  -- TRUE significa que RLS está habilitado
FROM pg_tables
WHERE tablename = 'data';

-- 4. Verificar políticas RLS específicas (como no aparecieron en 024, lo verificamos explícitamente)
SELECT 
    policyname AS policy_name,  
    permissive,
    roles,
    cmd,  
    qual AS using_clause,       
    with_check AS check_clause  
FROM pg_policies
WHERE tablename = 'data';

-- 5. Probar una operación de inserción simple para ver si el problema está en la estructura
-- IMPORTANTE: Esta prueba debe hacerse manualmente en el SQL Editor con service_role
/*
SET ROLE service_role;
INSERT INTO data (OLPN, DN, Unidades, Local, Fecha) VALUES ('test_olpn', 'test_dn', 1, 'test_local', CURRENT_DATE);
RESET ROLE;
*/