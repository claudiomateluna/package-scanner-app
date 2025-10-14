-- Crear tabla para rastrear intentos de inicio de sesión fallidos
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  email TEXT PRIMARY KEY,
  attempts INTEGER DEFAULT 0,
  last_attempt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_blocked BOOLEAN DEFAULT FALSE
);

-- Opcional: Crear un índice para mejorar el rendimiento de las búsquedas por email
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_email ON failed_login_attempts (email);

-- Opcional: Crear una política para permitir que la aplicación inserte/actualice registros
-- Esta política dependerá de tu configuración de seguridad específica
GRANT INSERT, UPDATE, SELECT ON TABLE failed_login_attempts TO authenticated, anon;
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Opcional: Crear una función y disparador para actualizar automáticamente la columna last_attempt
CREATE OR REPLACE FUNCTION update_last_attempt_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_attempt = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_failed_login_attempts_last_attempt 
    BEFORE INSERT OR UPDATE ON failed_login_attempts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_last_attempt_column();