-- FIX_RECHAZOS_PERMISSIONS.sql
-- This script grants the necessary permissions for the get_next_ticket_id function.

-- Grant usage on the schema to the authenticated role.
-- The public schema should already have this, but it's good practice to be explicit.
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant execute permission on the function to the authenticated role.
-- This allows any logged-in user to call this function.
GRANT EXECUTE ON FUNCTION get_next_ticket_id(TEXT) TO authenticated;

-- Grant necessary permissions on the counter table to the authenticated role.
-- The function needs to be able to read and update the counter.
GRANT SELECT, UPDATE ON TABLE ticket_counters_rechazos TO authenticated;

-- Also grant usage on the sequence used by the rechazos table's ID if it has one (for SERIAL)
-- This is often handled automatically, but can be a source of permission errors.
-- Assuming the sequence is named rechazos_id_seq
GRANT USAGE, SELECT ON SEQUENCE rechazos_id_seq TO authenticated;

