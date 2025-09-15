-- VERIFY_RECHAZOS_TABLE.sql
-- Script para verificar el estado de la tabla rechazos y sus componentes

-- Verificar si la tabla rechazos existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'rechazos'
) AS table_exists;

-- Verificar si la función get_next_ticket_id existe
SELECT proname, probin
FROM pg_proc 
WHERE proname = 'get_next_ticket_id';

-- Verificar el contenido de la tabla ticket_counters_rechazos
SELECT * FROM ticket_counters_rechazos;

-- Verificar si RLS está habilitado en la tabla rechazos
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'rechazos';

-- Verificar las políticas RLS existentes para la tabla rechazos
SELECT polname, polroles, polcmd, polqual, polwithcheck
FROM pg_policy 
WHERE polrelid = 'rechazos'::regclass;