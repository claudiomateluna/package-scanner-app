-- Migration script to update faltantes table for multiple products support
-- This script removes the UNIQUE constraint from OLPN and keeps ticket_id unique

-- First, we need to drop the existing constraint on OLPN
-- Note: In PostgreSQL, constraints have auto-generated names, so we need to find it first
ALTER TABLE faltantes DROP CONSTRAINT IF EXISTS faltantes_olpn_key;

-- If the above doesn't work, we can also drop the index
DROP INDEX IF EXISTS idx_faltantes_olpn;

-- Recreate the index without UNIQUE constraint
CREATE INDEX IF NOT EXISTS idx_faltantes_olpn ON faltantes(olpn);

-- Ensure ticket_id remains unique
ALTER TABLE faltantes ADD CONSTRAINT IF NOT EXISTS faltantes_ticket_id_key UNIQUE (ticket_id);

-- Add a comment to document the change
COMMENT ON TABLE faltantes IS 'Tabla para almacenar reportes de faltantes/sobrantes. OLPN no es único para permitir múltiples productos por reporte, pero ticket_id sí es único.';

-- Verify the changes
\d faltantes