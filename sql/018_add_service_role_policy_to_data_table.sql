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

-- If you need specific roles to be able to insert/update, you may need additional policies like:
-- CREATE POLICY "Warehouse roles can insert and update data" ON data
-- FOR ALL TO authenticated
-- USING (auth.role() = 'authenticated' AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('administrador', 'Warehouse Supervisor', 'Warehouse Operator'))
-- WITH CHECK (auth.role() = 'authenticated' AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('administrador', 'Warehouse Supervisor', 'Warehouse Operator'));