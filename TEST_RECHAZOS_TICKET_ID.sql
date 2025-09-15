-- TEST_RECHAZOS_TICKET_ID.sql
-- Script para probar la generación de ticket ID para rechazos

-- Primero verificar si la tabla de contadores existe y tiene datos
SELECT * FROM ticket_counters_rechazos;

-- Probar la función directamente
SELECT get_next_ticket_id('REC') AS test_ticket_id;

-- Verificar el contenido de la tabla de contadores después de la prueba
SELECT * FROM ticket_counters_rechazos;

-- Verificar las políticas RLS de la tabla rechazos
SELECT polname, polroles, polcmd, polqual, polwithcheck
FROM pg_policy 
WHERE polrelid = 'rechazos'::regclass;

-- Verificar si RLS está habilitado en la tabla rechazos
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'rechazos';