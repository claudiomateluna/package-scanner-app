-- Script to verify current user permissions and roles
-- This will help identify who can upload CSV files through the application

-- 1. Check the current user
SELECT current_user;

-- 2. Check your current session's roles
SELECT 
    session_user,
    current_user,
    current_database(),
    current_schema();

-- 3. List all roles in the database
SELECT rolname, rolsuper, rolbypassrls
FROM pg_roles
WHERE rolname IN ('service_role', 'authenticated', 'anon', 'postgres');

-- 4. Check which roles the current session has
SELECT 
    unnest(roles) as role_name
FROM (
    SELECT (
        SELECT array_agg(role_name)
        FROM (
            SELECT rolname as role_name
            FROM pg_auth_members m
            JOIN pg_roles r ON m.member = r.oid
            WHERE m.roleid = (SELECT oid FROM pg_roles WHERE rolname = current_user)
            UNION ALL
            SELECT current_user
        ) t
    ) AS roles
) t2;

-- 5. Check if your service role key has proper permissions in the profiles table
-- This is to confirm whether your currently logged in user is recognized correctly
-- You would run this after authenticating with your service role

-- 6. Check for users with roles that should be able to upload
-- First, let's check what columns actually exist in the profiles table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 7. Check for users with roles that should be able to upload (using available columns)
SELECT 
    id,
    email,
    role,
    first_name,
    last_name,
    updated_at
FROM profiles
WHERE role IN ('administrador', 'Warehouse Supervisor', 'Warehouse Operator')
ORDER BY role;

-- 7. Check if the upload-data API function is working by testing permissions
-- Let's see if we can simulate what the API does by checking the same from the DB
-- This would be run with service role permissions:
/*
BEGIN;
SET LOCAL ROLE service_role;
-- Try to perform an upsert operation like the API does
INSERT INTO data (OLPN) VALUES ('test') 
ON CONFLICT (OLPN) DO UPDATE SET OLPN = EXCLUDED.OLPN;
-- If this fails, it will show the exact RLS policy issue
ROLLBACK;
*/