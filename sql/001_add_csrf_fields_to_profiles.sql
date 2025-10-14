-- Agregar campos para el sistema de tokens CSRF a la tabla profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS csrf_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS csrf_token_created_at TIMESTAMP WITH TIME ZONE;

-- Opcional: Agregar comentario para describir los campos
COMMENT ON COLUMN profiles.csrf_token IS 'Token CSRF para protección contra falsificación de solicitudes';
COMMENT ON COLUMN profiles.csrf_token_created_at IS 'Fecha de creación del token CSRF para control de expiración';