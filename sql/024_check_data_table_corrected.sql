-- Script corregido para verificar la tabla 'data' con la estructura real
-- La tabla 'data' tiene 5 columnas: OLPN, DN, Unidades, Local, Fecha

-- 1. Verificar la estructura exacta de la tabla 'data'
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'data'
ORDER BY ordinal_position;

-- 2. Verificar si RLS está habilitado en la tabla 'data'
SELECT 
    schemaname,
    tablename,
    rowsecurity  -- TRUE significa que RLS está habilitado
FROM pg_tables
WHERE tablename = 'data';

-- 3. Verificar políticas RLS específicas en la tabla 'data' (corrigiendo el nombre de columna)
SELECT 
    policyname AS policy_name,  -- Nombre correcto de la columna
    permissive,
    roles,
    cmd,  -- Comando: r=SELECT, a=INSERT, w=UPDATE, d=DELETE
    qual AS using_clause,       -- Condición USING
    with_check AS check_clause  -- Condición WITH CHECK
FROM pg_policies
WHERE tablename = 'data';

-- 4. Verificar si hay restricciones únicas o llaves primarias en la columna OLPN
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'data'
AND kcu.column_name = 'OLPN';

-- 5. Verificar si hay triggers en la tabla 'data'
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'data';

-- 6. Contar registros en la tabla 'data' para ver si se puede acceder
SELECT COUNT(*) AS total_registros FROM data LIMIT 5;

-- 7. Probar una operación simple como service_role (esto simula lo que hace la API)
-- IMPORTANTE: Esta prueba debe hacerse manualmente en el SQL Editor con service_role
/*
SET ROLE service_role;
INSERT INTO data (OLPN, DN, Unidades, Local, Fecha) VALUES ('test', 'test_dn', 1, 'test_local', CURRENT_DATE);
RESET ROLE;
*/