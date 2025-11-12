# Troubleshooting CSV Upload "No autorizado" Error

## Issue Description
Users with roles `administrador`, `Warehouse Supervisor`, and `Warehouse Operator` receive "No autorizado" error when attempting to upload CSV files through the application, despite being properly authenticated.

## Root Cause Analysis
The issue has two components:
1. Application-level role authorization (already fixed in the code)
2. Database-level Row Level Security (RLS) policies that prevent the upsert operation

## Debugging Steps

### Step 1: Check Database Policies
Run the following SQL scripts in your Supabase SQL Editor to diagnose the issue:

1. `sql/019_check_data_table_policies.sql` - Checks RLS and table policies
2. `sql/020_check_user_permissions.sql` - Checks user roles and permissions
3. `sql/021_debug_rls_issue.sql` - Debugs the specific RLS issue

### Step 2: Analyze Results
Look for these specific indicators:
- Is RLS enabled on the 'data' table?
- Does the service_role have appropriate policies?
- Are there any conflicting policies?

### Step 3: Apply the Fix
If the debugging shows missing RLS policies for the service role, run:
- `sql/018_add_service_role_policy_to_data_table.sql`

## Solution Components

### 1. Application-Level Fix (Already Applied)
- Updated `src/app/api/upload-data/route.ts` to include Warehouse Supervisor role
- Updated `src/app/components/AdminView.tsx` to show upload button to Warehouse Supervisors

### 2. Database-Level Fix (To Be Applied)
The missing component is the RLS policy for the service role. You must run this SQL script in your Supabase dashboard:

```sql
-- Add RLS policy to allow service role to perform all operations on the 'data' table
-- This is needed to fix the unauthorized error when uploading CSV data

-- First, make sure RLS is enabled on the data table (if not already)
ALTER TABLE data ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows the service role to perform all operations on the data table
-- The service role bypasses RLS by default, but we'll create an explicit policy for clarity
CREATE POLICY "Service role access to data table" ON data
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- Also create a policy for authenticated users who might need access for reading
CREATE POLICY "Authenticated users can read data table" ON data
FOR SELECT TO authenticated
USING (true);
```

## Verification Steps

After applying the database fix:

1. Log into the application with a user that has one of the authorized roles
2. Navigate to the admin panel
3. Try uploading a CSV file
4. The upload should now complete successfully

## Environment Variables Check
Ensure your `.env.local` file contains:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

## Common Problems and Solutions

### Problem: Still getting "No autorizado" after applying fixes
**Solution:** Verify that the service role key in your `.env.local` matches the one in your Supabase dashboard and the database policy is active.

### Problem: CSV upload works but data doesn't appear in the table
**Solution:** Check the data format matches expected columns in the 'data' table and ensure the OLPN column has proper constraints/indices.

### Problem: Different error messages after the "No autorizado" fix
**Solution:** The original auth error may have been masking other issues. Check the browser console and server logs for additional error details.

## Additional Notes

The service role in Supabase is powerful and bypasses RLS by default, but explicit policies provide better security and clarity. The upsert operation in the upload API uses the service role client, which needs appropriate permissions on the 'data' table.