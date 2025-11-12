-- Script para verificar los usuarios y sus roles en el sistema

-- 1. Verificar los usuarios que deberían poder subir CSV
SELECT 
    id,
    email,
    role,
    first_name,
    last_name
FROM profiles
WHERE role IN ('administrador', 'Warehouse Supervisor', 'Warehouse Operator');

-- 2. Verificar si hay locales asignados a estos usuarios (esto podría ser relevante para la autorización)
SELECT 
    ul.user_id,
    p.email,
    p.role,
    ul.local_name
FROM user_locals ul
JOIN profiles p ON ul.user_id = p.id
WHERE p.role IN ('administrador', 'Warehouse Supervisor', 'Warehouse Operator');

-- 3. Verificar los locales disponibles en el sistema
SELECT nombre_local FROM locales ORDER BY nombre_local;

-- 4. Ver el estado actual de la tabla failed_login_attempts que podría afectar la autenticación
SELECT * FROM failed_login_attempts LIMIT 10;

-- 5. Verificar si hay alguna restricción en la tabla de perfiles que podría afectar la consulta
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 6. Verificar si hay políticas RLS en la tabla profiles (que se consulta en la API)
SELECT 
    policyname AS policy_name,  
    permissive,
    roles,
    cmd,  
    qual AS using_clause,       
    with_check AS check_clause  
FROM pg_policies
WHERE tablename = 'profiles';

-- 7. Verificar si hay triggers en la tabla profiles
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'profiles';