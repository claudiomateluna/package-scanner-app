-- Script to test and debug the exact RLS issue for CSV uploads

-- 1. Check current RLS settings for the 'data' table
SELECT 
    tablename,
    schemaname, 
    rowsecurity
FROM pg_tables 
WHERE tablename = 'data';

-- 2. Detailed view of existing policies for the 'data' table
SELECT 
    pol.polname AS policy_name,
    pol.polpermissive AS is_permissive,
    CASE 
        WHEN pol.polroles = '{0}' THEN 'ALL'
        ELSE (SELECT string_agg(rolname, ', ')
              FROM pg_roles
              WHERE oid = ANY(pol.polroles))
    END AS roles,
    pol.polcmd AS command_type, -- r=SELECT, a=INSERT, w=UPDATE, d=DELETE
    pg_get_expr(pol.polqual, pol.polrelid) AS using_expr,
    pg_get_expr(pol.polwithcheck, pol.polrelid) AS check_expr
FROM pg_policy pol
JOIN pg_class cls ON cls.oid = pol.polrelid
WHERE cls.relname = 'data';

-- 3. Try to simulate what the API does with a transaction to see the exact error
-- This test should be run with your service role key
/*
DO $$
DECLARE
    test_error TEXT;
BEGIN
    BEGIN
        -- Set the role to service_role to simulate the API call
        SET LOCAL ROLE service_role;
        
        -- Try to perform the same upsert operation that the API does
        INSERT INTO data (OLPN) VALUES ('test_csv_upload') 
        ON CONFLICT (OLPN) DO UPDATE SET OLPN = EXCLUDED.OLPN;
        
        RAISE NOTICE 'Upsert successful with service_role';
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS test_error = MESSAGE_TEXT;
        RAISE NOTICE 'Error during upsert with service_role: %', test_error;
    END;
END $$;
*/

-- 4. Check which columns are involved in the OLPN conflict (for upsert)
SELECT 
    a.attname AS column_name,
    i.indisunique AS is_unique,
    i.indisprimary AS is_primary
FROM pg_index i
JOIN pg_class ct ON ct.oid = i.indrelid
JOIN pg_class ci ON ci.oid = i.indexrelid
JOIN pg_attribute a ON a.attrelid = ct.oid AND a.attnum = ANY(i.indkey)
WHERE ct.relname = 'data' 
AND ci.relname LIKE '%data%olpn%';

-- 5. Check if there's a unique constraint or primary key on OLPN
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'data'
AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE');

-- 6. Get a comprehensive view of table permissions
SELECT 
    relname AS table_name,
    relacl AS permissions
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE relname = 'data'
AND n.nspname = 'public';