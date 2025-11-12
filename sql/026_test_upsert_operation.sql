-- Script para simular exactamente la operación de la API de carga de CSV

-- 1. Primero, probar una inserción simple sin conflictos
-- IMPORTANTE: Ejecutar manualmente con service_role
/*
BEGIN;
SET LOCAL ROLE service_role;
INSERT INTO data (OLPN, DN, Unidades, Local, Fecha) 
VALUES ('TEST001', 'DN001', 5, 'Santiago', CURRENT_DATE);
SELECT 'Insert simple exitoso' AS resultado;
RESET ROLE;
ROLLBACK;
*/

-- 2. Luego, probar un upsert que podría causar conflicto
-- IMPORTANTE: Ejecutar manualmente con service_role
/*
BEGIN;
SET LOCAL ROLE service_role;
INSERT INTO data (OLPN, DN, Unidades, Local, Fecha) 
VALUES ('TEST001', 'DN001', 5, 'Santiago', CURRENT_DATE)
ON CONFLICT (OLPN) DO UPDATE SET
    DN = EXCLUDED.DN,
    Unidades = EXCLUDED.Unidades,
    Local = EXCLUDED.Local,
    Fecha = EXCLUDED.Fecha;
SELECT 'Upsert exitoso' AS resultado;
RESET ROLE;
ROLLBACK;
*/

-- 3. Verificar si la columna OLPN tiene una restricción UNIQUE o PRIMARY KEY
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'data'
AND kcu.column_name = 'OLPN';

-- 4. Verificar si hay índices en la columna OLPN (que podrían apoyar una restricción UNIQUE)
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'data'
AND indexname LIKE '%olpn%';

-- 5. Verificar información completa de todos los índices en la tabla
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'data';

-- 6. Verificar si hay una restricción de clave única implícita
SELECT 
    c.conname AS constraint_name,
    c.contype AS constraint_type,
    a.attname AS column_name
FROM pg_constraint c
JOIN pg_class r ON c.conrelid = r.oid
JOIN pg_attribute a ON a.attrelid = r.oid AND a.attnum = ANY(c.conkey)
WHERE r.relname = 'data'
AND c.contype IN ('p', 'u');  -- p = primary key, u = unique