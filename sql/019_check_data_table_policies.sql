-- Script to check the 'data' table in Supabase
-- This script will help identify current table structure and RLS policies

-- 1. Check if the 'data' table exists and get its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'data'
ORDER BY ordinal_position;

-- 2. Check if RLS is enabled on the 'data' table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'data';

-- 3. Check existing RLS policies on the 'data' table
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'data';

-- 4. Check if there are any grants/permissions on the 'data' table
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges
WHERE table_name = 'data';

-- 5. Check the service_role and authenticated roles have access
SELECT 
    r.rolname AS role_name,
    m.rolname AS member_of
FROM pg_auth_members am
JOIN pg_roles r ON am.member = r.oid
JOIN pg_roles m ON am.roleid = m.oid
WHERE m.rolname IN ('service_role', 'authenticated')
AND r.rolname LIKE '%data%';

-- 6. Check the current grants specifically for the 'data' table
SELECT 
    grantee,
    privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'data'
AND grantee IN ('service_role', 'authenticated', 'anon');