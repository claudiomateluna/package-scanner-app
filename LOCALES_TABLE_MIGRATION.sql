-- Migration script to create locales table
-- This script creates the locales table and provides guidance on how to populate it

-- Create the locales table
CREATE TABLE IF NOT EXISTS locales (
  id SERIAL PRIMARY KEY,
  tipo_local VARCHAR(3) NOT NULL CHECK (tipo_local IN ('FRA', 'RTL', 'SKA', 'WHS')),
  nombre_local VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_locales_tipo ON locales(tipo_local);
CREATE INDEX IF NOT EXISTS idx_locales_nombre ON locales(nombre_local);

-- Add comments for documentation
COMMENT ON TABLE locales IS 'Table containing all store locations with their types';
COMMENT ON COLUMN locales.tipo_local IS 'Type of location: FRA (Franchise), RTL (Retail), SKA (Skape), WHS (Wholesale)';
COMMENT ON COLUMN locales.nombre_local IS 'Name of the location, must match the local column in data table';

-- To populate this table with actual data from your existing data table, you can use a query like this:
-- First, check what unique locals exist in your data table:
-- SELECT DISTINCT "Local" as nombre_local FROM data ORDER BY "Local";

-- Then, populate the locales table with actual data. Here's an example approach:
-- If your local names follow a pattern like "ADIDAS_FRA_001", you can extract the type:
-- INSERT INTO locales (tipo_local, nombre_local)
-- SELECT 
--   CASE 
--     WHEN "Local" LIKE '%_FRA_%' THEN 'FRA'
--     WHEN "Local" LIKE '%_RTL_%' THEN 'RTL'
--     WHEN "Local" LIKE '%_SKA_%' THEN 'SKA'
--     WHEN "Local" LIKE '%_WHS_%' THEN 'WHS'
--     ELSE 'RTL' -- default to retail if no pattern matches
--   END as tipo_local,
--   "Local" as nombre_local
-- FROM (SELECT DISTINCT "Local" FROM data WHERE "Local" IS NOT NULL) as unique_locals
-- ON CONFLICT (nombre_local) DO NOTHING;

-- If your local names don't follow a pattern, you'll need to manually categorize them:
-- Example data (replace with your actual local names):
-- INSERT INTO locales (tipo_local, nombre_local) VALUES 
-- ('FRA', 'ADIDAS_FRA_001'),
-- ('FRA', 'ADIDAS_FRA_002'),
-- ('RTL', 'ADIDAS_RTL_001'),
-- ('RTL', 'ADIDAS_RTL_002'),
-- ('SKA', 'ADIDAS_SKA_001'),
-- ('WHS', 'ADIDAS_WHS_001');

-- After creating and populating the table, you can add a foreign key constraint to the data table:
-- ALTER TABLE data ADD CONSTRAINT fk_data_local FOREIGN KEY ("Local") REFERENCES locales(nombre_local);
-- ALTER TABLE recepciones_completadas ADD CONSTRAINT fk_recepciones_local FOREIGN KEY (local) REFERENCES locales(nombre_local);

-- You might also want to update the SelectionScreen and ScannerView components to use this new table for filtering
-- For example, to get all locals of a specific type:
-- SELECT nombre_local FROM locales WHERE tipo_local = 'FRA' ORDER BY nombre_local;

-- To get all locals with their types:
-- SELECT tipo_local, nombre_local FROM locales ORDER BY tipo_local, nombre_local;