# Fix for CSV Upload Unauthorized Error

## Problem Description
When attempting to upload CSV files through the admin panel, users with allowed roles (administrador, Warehouse Supervisor, Warehouse Operator) were receiving "No autorizado" (Unauthorized) errors even though they were properly authenticated and had the correct roles.

## Root Cause
The 'data' table in Supabase had Row Level Security (RLS) enabled, but there was no explicit policy allowing the service role (used by the backend API) to perform upsert operations on this table. Although the service role key was properly configured in environment variables, the missing RLS policy was blocking the operations.

## Solution
Added a new SQL script `018_add_service_role_policy_to_data_table.sql` that creates the necessary RLS policies:

1. Enables RLS on the 'data' table
2. Creates a policy allowing the service_role to perform all operations on the 'data' table
3. Creates a policy allowing authenticated users to read from the 'data' table

## Files Modified
- Created: `sql/018_add_service_role_policy_to_data_table.sql`
- Updated: `src/app/api/upload-data/route.ts` (already had correct role permissions)
- Updated: `src/app/components/AdminView.tsx` (already had correct role permissions for UI)

## Deployment
Run the new SQL script against your Supabase database to add the required policies.

## Verification
After applying the SQL changes, CSV uploads should work correctly for users with administrador, Warehouse Supervisor, and Warehouse Operator roles.