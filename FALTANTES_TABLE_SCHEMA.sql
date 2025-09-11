-- Tabla para almacenar reportes de faltantes/sobrantes
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

-- Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_faltantes_ticket_id ON faltantes(ticket_id);
CREATE INDEX IF NOT EXISTS idx_faltantes_olpn ON faltantes(olpn);
CREATE INDEX IF NOT EXISTS idx_faltantes_tipo_local ON faltantes(tipo_local);
CREATE INDEX IF NOT EXISTS idx_faltantes_fecha ON faltantes(fecha);
CREATE INDEX IF NOT EXISTS idx_faltantes_created_at ON faltantes(created_at);
CREATE INDEX IF NOT EXISTS idx_faltantes_created_by_user_id ON faltantes(created_by_user_id);

-- Políticas de seguridad
ALTER TABLE faltantes ENABLE ROW LEVEL SECURITY;

-- Política para permitir que los usuarios autenticados inserten reportes
CREATE POLICY "Usuarios autenticados pueden insertar reportes de faltantes" 
ON faltantes FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Política para permitir que los usuarios autenticados lean sus propios reportes
CREATE POLICY "Usuarios pueden leer sus propios reportes de faltantes" 
ON faltantes FOR SELECT 
TO authenticated 
USING (created_by_user_id = auth.uid());

-- Política para permitir que administradores y supervisores lean todos los reportes
CREATE POLICY "Administradores pueden leer todos los reportes de faltantes" 
ON faltantes FOR SELECT 
TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrador', 'Warehouse Supervisor', 'Store Supervisor')));

-- Política para permitir que los usuarios autenticados actualicen sus propios reportes
CREATE POLICY "Usuarios pueden actualizar sus propios reportes de faltantes" 
ON faltantes FOR UPDATE 
TO authenticated 
USING (created_by_user_id = auth.uid())
WITH CHECK (created_by_user_id = auth.uid());

-- Política para permitir que administradores y supervisores actualicen todos los reportes
CREATE POLICY "Administradores pueden actualizar todos los reportes de faltantes" 
ON faltantes FOR UPDATE 
TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrador', 'Warehouse Supervisor', 'Store Supervisor')))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrador', 'Warehouse Supervisor', 'Store Supervisor')));