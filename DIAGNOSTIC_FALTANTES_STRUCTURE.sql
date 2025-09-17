-- DIAGNOSTIC_FALTANTES_STRUCTURE.sql
-- Script para diagnosticar la estructura de la tabla faltantes

-- Ver la estructura de la tabla
\d faltantes

-- Ver algunos registros de ejemplo
SELECT * FROM faltantes LIMIT 5;

-- Ver registros con ticket_id específico
SELECT * FROM faltantes WHERE ticket_id = 'RTL000000001';

-- Contar cuántos registros hay por ticket_id
SELECT ticket_id, COUNT(*) as record_count 
FROM faltantes 
GROUP BY ticket_id 
HAVING COUNT(*) > 1 
ORDER BY record_count DESC 
LIMIT 10;

-- Ver la estructura de la tabla de productos (si existe)
\d faltantes_productos