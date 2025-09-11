-- VERIFICAR_ESTRUCTURA_TICKET_COUNTERS.sql
-- Script para verificar la estructura de la tabla ticket_counters

-- Verificar la estructura de la tabla
\d ticket_counters;

-- Verificar los datos en la tabla
SELECT * FROM ticket_counters;

-- Verificar si hay problemas con los permisos
SELECT * FROM pg_tables WHERE tablename = 'ticket_counters';

-- Verificar las políticas de seguridad
SELECT * FROM pg_policy WHERE polrelid = 'ticket_counters'::regclass;