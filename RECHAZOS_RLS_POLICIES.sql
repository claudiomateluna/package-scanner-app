-- RECHAZOS_RLS_POLICIES.sql
-- This script creates the necessary Row Level Security (RLS) policies for the 'rechazos' table.

-- Enable RLS on the table if it's not already enabled.
ALTER TABLE public.rechazos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, to ensure a clean slate.
DROP POLICY IF EXISTS "Allow authenticated users to insert rechazos" ON public.rechazos;
DROP POLICY IF EXISTS "Allow authenticated users to select all rechazos" ON public.rechazos;
DROP POLICY IF EXISTS "Allow authenticated users to update rechazos" ON public.rechazos;

-- 1. INSERT Policy
-- Allows any logged-in user to insert a new row into the rechazos table.
CREATE POLICY "Allow authenticated users to insert rechazos"
ON public.rechazos
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 2. SELECT Policy
-- Allows any logged-in user to view all rows in the rechazos table.
CREATE POLICY "Allow authenticated users to select all rechazos"
ON public.rechazos
FOR SELECT
TO authenticated
USING (true);

-- 3. UPDATE Policy
-- Allows any logged-in user to update any row in the rechazos table.
CREATE POLICY "Allow authenticated users to update rechazos"
ON public.rechazos
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

