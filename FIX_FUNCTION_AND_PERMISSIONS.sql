-- FIX_FUNCTION_AND_PERMISSIONS.sql
-- This script completely replaces the faulty function and sets the correct permissions.

-- Step 1: Drop the old function that has the parameter with the ambiguous name.
DROP FUNCTION IF EXISTS get_next_ticket_id(text);

-- Step 2: Create the new, corrected function with a non-ambiguous parameter name (p_prefix)
-- and using single-quote syntax for the function body.
CREATE OR REPLACE FUNCTION get_next_ticket_id(p_prefix TEXT)
RETURNS TEXT AS '
DECLARE
  next_id BIGINT;
  formatted_id TEXT;
BEGIN
  -- Increment the counter for the given prefix
  UPDATE ticket_counters_rechazos 
  SET counter = counter + 1 
  WHERE prefix = p_prefix
  RETURNING counter INTO next_id;
  
  -- If no row was updated, insert it
  IF NOT FOUND THEN
    INSERT INTO ticket_counters_rechazos (prefix, counter) 
    VALUES (p_prefix, 1)
    RETURNING counter INTO next_id;
  END IF;
  
  -- Format the ID with leading zeros (9 digits)
  formatted_id := p_prefix || LPAD(next_id::TEXT, 9, ''0'');
  
  RETURN formatted_id;
END;
' LANGUAGE plpgsql;

-- Step 3: Grant the necessary permissions to the 'authenticated' role to ensure it can be executed.
GRANT EXECUTE ON FUNCTION get_next_ticket_id(TEXT) TO authenticated;

GRANT SELECT, UPDATE ON TABLE ticket_counters_rechazos TO authenticated;

-- Grant usage on the sequence for the main table as a good practice.
GRANT USAGE, SELECT ON SEQUENCE rechazos_id_seq TO authenticated;

