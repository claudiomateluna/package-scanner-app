-- RECREAR_TABLA_TICKET_COUNTERS.sql
-- Script para recrear la tabla ticket_counters correctamente

-- Eliminar la tabla existente
DROP TABLE IF EXISTS ticket_counters;

-- Crear la tabla ticket_counters
CREATE TABLE ticket_counters (
  tipo_local VARCHAR(3) PRIMARY KEY CHECK (tipo_local IN ('FRA', 'RTL', 'SKA', 'WHS')),
  counter INTEGER NOT NULL DEFAULT 0
);

-- Insertar valores iniciales
INSERT INTO ticket_counters (tipo_local, counter) VALUES 
  ('FRA', 0),
  ('RTL', 0),
  ('SKA', 0),
  ('WHS', 0);

-- Crear índice para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_ticket_counters_tipo_local ON ticket_counters(tipo_local);

-- Comentarios para documentación
COMMENT ON TABLE ticket_counters IS 'Tabla para manejar contadores incrementales de tickets por tipo de local';
COMMENT ON COLUMN ticket_counters.tipo_local IS 'Tipo de local: FRA, RTL, SKA, WHS';
COMMENT ON COLUMN ticket_counters.counter IS 'Contador incremental para generar IDs de tickets';

-- Verificar los datos
SELECT * FROM ticket_counters;