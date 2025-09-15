-- TEST_TICKET_ID_GENERATION.sql
-- Script para probar la generación de ticket ID

-- Probar la función directamente
SELECT get_next_ticket_id('REC') AS test_ticket_id;

-- Verificar el contenido de la tabla de contadores después de la prueba
SELECT * FROM ticket_counters_rechazos;