-- Script to specifically check for RLS status and policies on the data table

-- 1. Check if RLS is enabled on the 'data' table specifically
SELECT 
    schemaname,
    tablename,
    rowsecurity  -- This shows if RLS is enabled (true/false)
FROM pg_tables
WHERE tablename = 'data';

-- 2. Get detailed view of all RLS policies on the 'data' table (corrigiendo el nombre de columna)
SELECT 
    policyname AS policy_name,  -- Nombre correcto de la columna
    permissive,
    roles,
    cmd,  -- Command type: r=SELECT, a=INSERT, w=UPDATE, d=DELETE
    qual AS using_clause,       -- The USING condition
    with_check AS check_clause  -- The WITH CHECK condition
FROM pg_policies
WHERE tablename = 'data';

-- 3. Since we know the service_role has table permissions,
-- let's check if there might be a trigger that's causing the issue
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'data';

-- 4. Let's also check for any authentication-related security issues
-- by looking at the current auth context
SELECT 
    auth.uid() AS current_user_id,
    auth.role() AS current_role,
    session_user,
    current_user;

-- 5. Since the upsert operation uses 'ON CONFLICT (OLPN)', let's check
-- if there's a unique constraint or primary key on the OLPN column
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'data'
AND kcu.column_name = 'OLPN';

-- 6. If the OLPN column doesn't exist with that exact name, check all column names
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'data'
ORDER BY ordinal_position;

-- 7. Check the storage engine and table options
SELECT 
    schemaname,
    tablename,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables
WHERE tablename = 'data';