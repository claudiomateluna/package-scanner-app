-- VERIFY_CURRENT_POLICIES.sql
-- Script para verificar las políticas actuales de las tablas

-- Verificar políticas de faltantes
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'faltantes';

-- Verificar políticas de rechazos
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'rechazos';

-- Verificar si RLS está habilitado en ambas tablas
SELECT relname as table_name, relrowsecurity 
FROM pg_class 
WHERE relname IN ('faltantes', 'rechazos') AND relkind = 'r';