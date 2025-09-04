-- Script para añadir la columna fecha_hora_inicio a la tabla recepciones_completadas
ALTER TABLE recepciones_completadas 
ADD COLUMN IF NOT EXISTS fecha_hora_inicio TIMESTAMP WITH TIME ZONE;

-- Añadir comentario para documentar la columna
COMMENT ON COLUMN recepciones_completadas.fecha_hora_inicio IS 'Hora de inicio de la recepción';