-- Script de diagnóstico detallado para identificar la causa exacta del error "No autorizado"

-- 1. Verificar si el problema ocurre en la autenticación inicial
-- La API hace: supabase.auth.getSession() y luego verifica el rol
-- Vamos a simular esta parte para confirmar que el usuario tiene sesión válida

-- 2. Verificar que las variables de entorno estén correctamente configuradas
-- Esto no se puede verificar directamente aquí, pero debemos asegurarnos
-- que SUPABASE_SERVICE_ROLE_KEY esté correctamente configurado en .env.local

-- 3. Test de autenticación: Verificar si podemos simular el proceso de la API
-- IMPORTANTE: Este test debe hacerse en el contexto de una sesión autenticada
/*
-- Este código se ejecutaría en una función de base de datos o trigger para probar:

DO $$
DECLARE
    user_session_id UUID;
    user_role TEXT;
    allowed_roles TEXT[] := ARRAY['administrador', 'Warehouse Supervisor', 'Warehouse Operator'];
    role_check BOOLEAN;
BEGIN
    -- Suponiendo que estamos en el contexto de un usuario autenticado
    user_session_id := auth.uid();
    RAISE NOTICE 'User ID: %', user_session_id;
    
    -- Obtener el rol del usuario
    SELECT role INTO user_role FROM profiles WHERE id = user_session_id;
    RAISE NOTICE 'User Role: %', user_role;
    
    -- Verificar si el rol está en la lista permitida
    role_check := user_role = ANY(allowed_roles);
    RAISE NOTICE 'Role check (should be true): %', role_check;
    
    -- Intentar realizar la operación que la API intenta hacer
    -- SET LOCAL ROLE service_role;
    -- INSERT INTO data (OLPN, DN, Unidades, Local, Fecha) VALUES ('test', 'test', 1, 'test', CURRENT_DATE);
    -- RESET ROLE;
    
END $$;
*/

-- 4. Verificar si hay errores en las tablas relacionadas que afectan la autenticación
-- Verificar si la tabla profiles tiene las columnas esperadas
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 5. Verificar si hay usuarios con los roles necesarios en la tabla profiles
SELECT 
    id,
    email,
    role,
    first_name,
    last_name
FROM profiles
WHERE role IN ('administrador', 'Warehouse Supervisor', 'Warehouse Operator');

-- 6. Verificar si hay problemas con la tabla user_locals que podría afectar la autenticación
SELECT 
    user_id,
    local_name
FROM user_locals
WHERE user_id IN (
    SELECT id FROM profiles 
    WHERE role IN ('administrador', 'Warehouse Supervisor', 'Warehouse Operator')
);

-- 7. Verificar si hay problemas con las sesiones de autenticación
-- (esto solo se puede verificar realmente desde el lado del cliente)

-- 8. Revisar el problema desde la perspectiva del código de la API
-- El error "No autorizado" (status: 401) sugiere que el fallo está ocurriendo 
-- en la verificación de sesión, no en la operación de upsert
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('data', 'profiles', 'user_locals', 'auth.users', 'auth.sessions');

-- 9. Verificar si hay triggers en las tablas de autenticación
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    event_object_table
FROM information_schema.triggers
WHERE event_object_table LIKE 'auth.%'
   OR event_object_table IN ('profiles', 'user_locals');