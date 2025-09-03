-- Tabla para almacenar recepciones completadas
CREATE TABLE IF NOT EXISTS recepciones_completadas (
  id SERIAL PRIMARY KEY,
  local VARCHAR(50) NOT NULL,
  fecha_recepcion DATE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  fecha_hora_completada TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  olpn_esperadas INTEGER NOT NULL,
  olpn_escaneadas INTEGER NOT NULL,
  dn_esperadas INTEGER NOT NULL,
  dn_escaneadas INTEGER NOT NULL,
  unidades_esperadas INTEGER NOT NULL,
  unidades_escaneadas INTEGER NOT NULL,
  estado VARCHAR(20) DEFAULT 'pendiente',
  detalles JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_recepciones_completadas_local_fecha 
ON recepciones_completadas(local, fecha_recepcion);

CREATE INDEX IF NOT EXISTS idx_recepciones_completadas_user 
ON recepciones_completadas(user_id);

CREATE INDEX IF NOT EXISTS idx_recepciones_completadas_fecha 
ON recepciones_completadas(fecha_hora_completada);

-- Políticas de seguridad
ALTER TABLE recepciones_completadas ENABLE ROW LEVEL SECURITY;

-- Política para permitir que los usuarios autenticados inserten recepciones
CREATE POLICY "Usuarios autenticados pueden insertar recepciones" 
ON recepciones_completadas FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Política para permitir que los usuarios autenticados lean sus propias recepciones
CREATE POLICY "Usuarios pueden leer sus propias recepciones" 
ON recepciones_completadas FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- Política para permitir que administradores y supervisores lean todas las recepciones
CREATE POLICY "Administradores pueden leer todas las recepciones" 
ON recepciones_completadas FOR SELECT 
TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrador', 'Warehouse Supervisor')));