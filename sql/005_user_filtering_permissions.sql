-- SQL script to demonstrate and test user filtering based on role hierarchy
-- This script shows how the frontend filtering logic works with the database

-- Show all users with their roles and assigned locals
SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.role,
    COALESCE(ul.locals_list, '[]') as assigned_locals
FROM profiles p
LEFT JOIN (
    SELECT 
        user_id,
        JSON_AGG(local_name) as locals_list
    FROM user_locals
    GROUP BY user_id
) ul ON p.id = ul.user_id
ORDER BY p.role, p.first_name, p.last_name;

-- Example: Query that would simulate Store Supervisor filtering
-- This shows how a Store Supervisor with user_id = 'some_store_supervisor_id'
-- would see users assigned to their locales
WITH current_supervisor_locals AS (
    -- Get the locales assigned to the current Store Supervisor
    SELECT local_name
    FROM user_locals
    WHERE user_id = 'CURRENT_SUPERVISOR_USER_ID'
),
supervisor_users AS (
    -- Get users that are assigned to the same locales as the supervisor
    SELECT DISTINCT p.*
    FROM profiles p
    JOIN user_locals ul ON p.id = ul.user_id
    WHERE ul.local_name IN (SELECT local_name FROM current_supervisor_locals)
      AND p.id != 'CURRENT_SUPERVISOR_USER_ID'  -- Exclude the supervisor themselves
    UNION
    -- Include the supervisor themselves
    SELECT p.*
    FROM profiles p
    WHERE p.id = 'CURRENT_SUPERVISOR_USER_ID'
)
SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.role,
    COALESCE(ul.locals_list, '[]') as assigned_locals
FROM supervisor_users p
LEFT JOIN (
    SELECT 
        user_id,
        JSON_AGG(local_name) as locals_list
    FROM user_locals
    GROUP BY user_id
) ul ON p.id = ul.user_id
ORDER BY p.role, p.first_name, p.last_name;

-- Example: Query that would simulate general role hierarchy filtering
-- For a user with role 'Store Operator' (rank 5), they would see:
-- Store Operator (5), SKA Operator (6) but NOT Store Supervisor (4), Warehouse Operator (3), etc.
SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.role,
    COALESCE(ul.locals_list, '[]') as assigned_locals
FROM profiles p
LEFT JOIN (
    SELECT 
        user_id,
        JSON_AGG(local_name) as locals_list
    FROM user_locals
    GROUP BY user_id
) ul ON p.id = ul.user_id
WHERE 
    -- Role hierarchy: Store Operator (rank 5) can see roles with rank >= 5
    (CASE p.role 
        WHEN 'administrador' THEN 1
        WHEN 'Warehouse Supervisor' THEN 2
        WHEN 'Warehouse Operator' THEN 3
        WHEN 'Store Supervisor' THEN 4
        WHEN 'Store Operator' THEN 5
        WHEN 'SKA Operator' THEN 6
    END) >= 5  -- Rank of the current user
ORDER BY p.role, p.first_name, p.last_name;