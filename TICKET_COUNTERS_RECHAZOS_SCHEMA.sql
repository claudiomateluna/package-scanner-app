-- TICKET_COUNTERS_RECHAZOS_SCHEMA.sql
-- Schema for the ticket_counters_rechazos table to manage incremental ticket IDs

CREATE TABLE IF NOT EXISTS ticket_counters_rechazos (
  prefix VARCHAR(10) PRIMARY KEY,
  counter BIGINT NOT NULL DEFAULT 0
);

-- Insert initial counter values for rechazos
INSERT INTO ticket_counters_rechazos (prefix, counter) 
VALUES ('REC', 0)
ON CONFLICT (prefix) DO NOTHING;

-- Function to generate next ticket ID for rechazos
CREATE OR REPLACE FUNCTION get_next_rechazos_ticket_id()
RETURNS TEXT AS $$
DECLARE
  next_id BIGINT;
  formatted_id TEXT;
BEGIN
  -- Increment the counter for REC prefix
  UPDATE ticket_counters_rechazos 
  SET counter = counter + 1 
  WHERE prefix = 'REC'
  RETURNING counter INTO next_id;
  
  -- If no row was updated, insert it
  IF NOT FOUND THEN
    INSERT INTO ticket_counters_rechazos (prefix, counter) 
    VALUES ('REC', 1)
    RETURNING counter INTO next_id;
  END IF;
  
  -- Format the ID with leading zeros (9 digits) and REC prefix
  formatted_id := 'REC' || LPAD(next_id::TEXT, 9, '0');
  
  RETURN formatted_id;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT get_next_rechazos_ticket_id();