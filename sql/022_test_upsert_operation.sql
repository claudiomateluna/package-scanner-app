-- Script to test the exact upsert operation that's failing
-- This replicates what the API does in the upload-data route

-- 1. First, let's check if there are any users with the correct roles
SELECT 
    id,
    email,
    role,
    first_name,
    last_name
FROM profiles
WHERE role IN ('administrador', 'Warehouse Supervisor', 'Warehouse Operator');

-- 2. Check if we can manually perform an upsert operation as service_role
-- This simulates what the upload-data API does:
-- INSERT INTO data (OLPN) VALUES ('test') ON CONFLICT (OLPN) DO UPDATE SET OLPN = EXCLUDED.OLPN;

-- To test this, you would run the following with your service role (do NOT run this query in the SQL editor directly):
/*
SET ROLE service_role;
INSERT INTO data (OLPN) VALUES ('test-upload-verification') 
ON CONFLICT (OLPN) DO UPDATE SET OLPN = EXCLUDED.OLPN;
RESET ROLE;
*/

-- 3. Check the structure of the 'data' table to understand what columns are available
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'data'
ORDER BY ordinal_position;

-- 4. Check if there are any triggers on the 'data' table that might interfere
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'data';

-- 5. Check for any functions that might be related to the 'data' table
SELECT 
    proname AS function_name,
    probin AS is_builtin,
    prosecdef AS is_security_definer
FROM pg_proc 
WHERE proname LIKE '%data%' OR proname LIKE '%upload%' OR proname LIKE '%olpn%';

-- 6. Check if there's an OLPN column and if it has unique constraints
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    (SELECT constraint_name 
     FROM information_schema.constraint_column_usage 
     WHERE table_name = 'data' 
     AND column_name = c.column_name) AS constraint_name
FROM information_schema.columns c
WHERE table_name = 'data' AND column_name = 'olpn';

-- 7. If the OLPN column doesn't exist with that exact name, let's check all column names
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'data'
ORDER BY ordinal_position;