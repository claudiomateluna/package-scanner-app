# Debugging CSV Upload Authorization Issues

## Purpose
This document explains how to debug and identify the root cause of "No autorizado" errors when uploading CSV files.

## SQL Scripts for Debugging

### 1. 019_check_data_table_policies.sql
This script helps identify:
- Structure of the 'data' table
- Whether RLS is enabled on the 'data' table
- Existing RLS policies on the 'data' table
- Permissions granted to different roles

### 2. 020_check_user_permissions.sql (UPDATED)
This script helps verify:
- Current database user and roles
- Column structure of the profiles table
- Users with roles that should be able to upload (administrador, Warehouse Supervisor, Warehouse Operator)
- Which roles exist in the database

### 3. 021_debug_rls_issue.sql
This script helps debug:
- Detailed RLS policy information
- Constraints on the OLPN column (used in upsert)
- Table permissions
- Potential test for the actual upsert operation

## How to Execute the Debugging Process

1. Execute the scripts in your Supabase SQL Editor in the order mentioned above
2. Look for the following in the results:
   - Is RLS enabled on the 'data' table? (It should be)
   - Does the service_role have a policy that allows upsert operations? (It should)
   - Are there any conflicting policies that might block access?
   - Do the required roles (administrador, Warehouse Supervisor, Warehouse Operator) exist in the profiles table?

## Expected Results After Applying the Fix

After running the fix script (018_add_service_role_policy_to_data_table.sql), you should see:
- A policy named "Service role access to data table" allowing service_role to perform ALL operations
- The CSV upload functionality should start working for authorized users

## Common Issues and Solutions

### Issue: RLS Enabled but No Policies for Service Role
Solution: Run the fix script to add the necessary policy

### Issue: Service Role Key Not Working
Solution: Verify that the SUPABASE_SERVICE_ROLE_KEY in .env.local matches the one in your Supabase project settings

### Issue: User Roles Not Properly Set
Solution: Ensure that the users trying to upload CSVs have the correct roles set in the profiles table

## Next Steps

If the debugging scripts reveal issues with RLS policies, run the fix script:
- sql/018_add_service_role_policy_to_data_table.sql