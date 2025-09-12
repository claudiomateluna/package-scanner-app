-- Essential commands to update faltantes table for multiple products support

-- 1. Remove UNIQUE constraint from OLPN (exact name may vary)
ALTER TABLE faltantes DROP CONSTRAINT IF EXISTS faltantes_olpn_key;

-- 2. Drop and recreate OLPN index without UNIQUE
DROP INDEX IF EXISTS idx_faltantes_olpn;
CREATE INDEX idx_faltantes_olpn ON faltantes(olpn);

-- 3. ticket_id should remain unique (from original schema)
-- No action needed if it's already unique