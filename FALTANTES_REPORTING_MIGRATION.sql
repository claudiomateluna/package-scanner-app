-- FALTANTES_REPORTING_MIGRATION.sql
-- Migration script to implement the missing/surplus reporting feature

-- 1. Create the faltantes table
CREATE TABLE IF NOT EXISTS faltantes (
  id SERIAL PRIMARY KEY,
  ticket_id VARCHAR(15) UNIQUE NOT NULL, -- Formato: <PREFIJO><9 dígitos>
  olpn VARCHAR(50) UNIQUE NOT NULL, -- En SKA, equivale a "Correlativo del B2B"
  delivery_note VARCHAR(50) NOT NULL, -- En SKA, equivale a "OC"
  tipo_reporte VARCHAR(10) NOT NULL CHECK (tipo_reporte IN ('Faltante', 'Sobrante')),
  nombre_local VARCHAR(100) NOT NULL,
  tipo_local VARCHAR(3) NOT NULL CHECK (tipo_local IN ('FRA', 'RTL', 'SKA', 'WHS')),
  fecha DATE NOT NULL,
  factura VARCHAR(50), -- Omitir en SKA
  detalle_producto TEXT,
  talla VARCHAR(20),
  cantidad INTEGER,
  peso_olpn VARCHAR(20), -- Omitir en SKA
  detalle_bulto_estado VARCHAR(50) CHECK (detalle_bulto_estado IN (
    'Caja abierta antes de la recepción',
    'Caja dañada en el transporte',
    'Caja perdida en el transporte',
    'Cinta adulterada'
  )),
  foto_olpn TEXT, -- URL o nombre del archivo
  foto_bulto TEXT, -- URL o nombre del archivo
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by_user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_by_user_name VARCHAR(100) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE,
  updated_by_user_id UUID REFERENCES auth.users(id),
  updated_by_user_name VARCHAR(100)
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_faltantes_ticket_id ON faltantes(ticket_id);
CREATE INDEX IF NOT EXISTS idx_faltantes_olpn ON faltantes(olpn);
CREATE INDEX IF NOT EXISTS idx_faltantes_tipo_local ON faltantes(tipo_local);
CREATE INDEX IF NOT EXISTS idx_faltantes_fecha ON faltantes(fecha);
CREATE INDEX IF NOT EXISTS idx_faltantes_created_at ON faltantes(created_at);
CREATE INDEX IF NOT EXISTS idx_faltantes_created_by_user_id ON faltantes(created_by_user_id);

-- 3. Enable Row Level Security
ALTER TABLE faltantes ENABLE ROW LEVEL SECURITY;

-- 4. Create policies for the faltantes table
-- Policy to allow authenticated users to insert reports
CREATE POLICY "Usuarios autenticados pueden insertar reportes de faltantes" 
ON faltantes FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Policy to allow users to read their own reports
CREATE POLICY "Usuarios pueden leer sus propios reportes de faltantes" 
ON faltantes FOR SELECT 
TO authenticated 
USING (created_by_user_id = auth.uid());

-- Policy to allow admins and supervisors to read all reports
CREATE POLICY "Administradores pueden leer todos los reportes de faltantes" 
ON faltantes FOR SELECT 
TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrador', 'Warehouse Supervisor', 'Store Supervisor')));

-- Policy to allow users to update their own reports
CREATE POLICY "Usuarios pueden actualizar sus propios reportes de faltantes" 
ON faltantes FOR UPDATE 
TO authenticated 
USING (created_by_user_id = auth.uid())
WITH CHECK (created_by_user_id = auth.uid());

-- Policy to allow admins and supervisors to update all reports
CREATE POLICY "Administradores pueden actualizar todos los reportes de faltantes" 
ON faltantes FOR UPDATE 
TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrador', 'Warehouse Supervisor', 'Store Supervisor')))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrador', 'Warehouse Supervisor', 'Store Supervisor')));

-- 5. Create the ticket_counters table
CREATE TABLE IF NOT EXISTS ticket_counters (
  tipo_local VARCHAR(3) PRIMARY KEY CHECK (tipo_local IN ('FRA', 'RTL', 'SKA', 'WHS')),
  counter INTEGER NOT NULL DEFAULT 0
);

-- 6. Insert initial values for each local type
INSERT INTO ticket_counters (tipo_local, counter) VALUES 
  ('FRA', 0),
  ('RTL', 0),
  ('SKA', 0),
  ('WHS', 0)
ON CONFLICT (tipo_local) DO NOTHING;

-- 7. Create index for better performance on ticket_counters
CREATE INDEX IF NOT EXISTS idx_ticket_counters_tipo_local ON ticket_counters(tipo_local);

-- 8. Add comments for documentation
COMMENT ON TABLE faltantes IS 'Tabla para almacenar reportes de faltantes/sobrantes';
COMMENT ON TABLE ticket_counters IS 'Tabla para manejar contadores incrementales de tickets por tipo de local';
COMMENT ON COLUMN ticket_counters.tipo_local IS 'Tipo de local: FRA, RTL, SKA, WHS';
COMMENT ON COLUMN ticket_counters.counter IS 'Contador incremental para generar IDs de tickets';

-- 9. Grant necessary permissions (if using a service role)
-- GRANT ALL ON TABLE faltantes TO authenticated;
-- GRANT ALL ON TABLE ticket_counters TO authenticated;
-- GRANT USAGE, SELECT ON SEQUENCE faltantes_id_seq TO authenticated;