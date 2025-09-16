-- RECHAZOS_TABLE_SCHEMA.sql
-- Schema for the rechazos table

CREATE TABLE IF NOT EXISTS rechazos (
  id SERIAL PRIMARY KEY,
  ticket_id VARCHAR(255) UNIQUE NOT NULL,
  tipo_rechazo VARCHAR(20) NOT NULL CHECK (tipo_rechazo IN ('Completo', 'Parcial')),
  ruta VARCHAR(255),
  mes DATE NOT NULL DEFAULT (DATE_TRUNC('month', CURRENT_DATE)),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  hora TIME NOT NULL DEFAULT CURRENT_TIME,
  folio VARCHAR(255) NOT NULL,
  oc VARCHAR(255) NOT NULL,
  nombre_local VARCHAR(255) NOT NULL,
  tipo_local VARCHAR(50),
  cliente_final VARCHAR(255),
  motivo TEXT NOT NULL,
  responsabilidad VARCHAR(20) NULL CHECK (responsabilidad IN ('Customer', 'Transporte', 'Cliente', 'CD')),
  responsabilidad_area VARCHAR(20) NULL CHECK (responsabilidad_area IN ('Shipping', 'QA', 'Planning', 'Picking', 'VAS', 'Consolidación')),
  unidades_rechazadas INTEGER,
  unidades_totales INTEGER,
  bultos_rechazados INTEGER,
  bultos_totales INTEGER,
  transporte VARCHAR(255),
  foto_rechazado TEXT,
  gestionado BOOLEAN DEFAULT false,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by_user_id UUID,
  created_by_user_name VARCHAR(255),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by_user_id UUID,
  updated_by_user_name VARCHAR(255)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rechazos_ticket_id ON rechazos(ticket_id);
CREATE INDEX IF NOT EXISTS idx_rechazos_fecha ON rechazos(fecha);
CREATE INDEX IF NOT EXISTS idx_rechazos_mes ON rechazos(mes);
CREATE INDEX IF NOT EXISTS idx_rechazos_nombre_local ON rechazos(nombre_local);
CREATE INDEX IF NOT EXISTS idx_rechazos_tipo_local ON rechazos(tipo_local);
CREATE INDEX IF NOT EXISTS idx_rechazos_responsabilidad ON rechazos(responsabilidad);
CREATE INDEX IF NOT EXISTS idx_rechazos_responsabilidad_area ON rechazos(responsabilidad_area);
CREATE INDEX IF NOT EXISTS idx_rechazos_transporte ON rechazos(transporte);

-- Function to format month in Spanish
CREATE OR REPLACE FUNCTION format_month_spanish(date_val DATE)
RETURNS TEXT AS '
DECLARE
  month_names TEXT[] := ARRAY[
    ''enero'', ''febrero'', ''marzo'', ''abril'', ''mayo'', ''junio'',
    ''julio'', ''agosto'', ''septiembre'', ''octubre'', ''noviembre'', ''diciembre''
  ];
BEGIN
  RETURN month_names[EXTRACT(MONTH FROM date_val)] || '' '' || EXTRACT(YEAR FROM date_val);
END;
' LANGUAGE plpgsql;

-- Table for ticket counters (similar to faltantes implementation)
CREATE TABLE IF NOT EXISTS ticket_counters_rechazos (
  prefix VARCHAR(10) PRIMARY KEY,
  counter BIGINT NOT NULL DEFAULT 0
);

-- Insert initial counter values if they don't exist
INSERT INTO ticket_counters_rechazos (prefix, counter) 
VALUES ('REC', 0)
ON CONFLICT (prefix) DO NOTHING;

-- Function to generate next ticket ID
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

-- RLS Policies
-- Enable RLS
ALTER TABLE rechazos ENABLE ROW LEVEL SECURITY;

-- Policies will be defined based on user roles
-- This would be implemented in the application layer for more complex role-based access
