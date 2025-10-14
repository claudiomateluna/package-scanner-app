-- Actualizar políticas de seguridad para la tabla failed_login_attempts
-- para permitir operaciones con service role y anon keys

-- Eliminar la política existente si existe
DROP POLICY IF EXISTS "Allow authenticated users to manage failed login attempts" ON failed_login_attempts;
DROP POLICY IF EXISTS "Allow service role to manage failed login attempts" ON failed_login_attempts;

-- Política para permitir operaciones CRUD a usuarios autenticados
CREATE POLICY "Allow authenticated users to manage failed login attempts" ON failed_login_attempts
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Política para permitir operaciones CRUD a usuarios anon (para login desde cliente)
CREATE POLICY "Allow anon users to manage failed login attempts" ON failed_login_attempts
FOR ALL TO anon
USING (true)
WITH CHECK (true);

-- Política para permitir operaciones CRUD al service role
CREATE POLICY "Allow service role to manage failed login attempts" ON failed_login_attempts
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- Asegurar que el rol de servicio tenga permisos adecuados
GRANT ALL PRIVILEGES ON TABLE failed_login_attempts TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;