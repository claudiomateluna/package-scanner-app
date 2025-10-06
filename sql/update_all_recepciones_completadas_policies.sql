-- Eliminar todas las políticas existentes para recepciones_completadas
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar recepciones" ON recepciones_completadas;
DROP POLICY IF EXISTS "Usuarios pueden leer sus propias recepciones" ON recepciones_completadas;
DROP POLICY IF EXISTS "Administradores pueden leer todas las recepciones" ON recepciones_completadas;

-- Crear nuevas políticas de seguridad para recepciones_completadas

-- Política para permitir inserciones a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden insertar recepciones" ON recepciones_completadas
FOR INSERT TO authenticated
WITH CHECK (true);

-- Política para permitir lectura a usuarios de locales asignados o administradores
CREATE POLICY "Usuarios pueden leer recepciones de locales asignados y administradores" ON recepciones_completadas
FOR SELECT TO authenticated
USING (
  -- Usuarios con roles elevados pueden leer todo
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = ANY (ARRAY['administrador'::user_role, 'Warehouse Supervisor'::user_role, 'Warehouse Operator'::user_role, 'Store Supervisor'::user_role])
  )
  OR
  -- Usuarios con locales asignados pueden leer recepciones de sus locales
  EXISTS (
    SELECT 1 FROM user_locals 
    WHERE user_locals.local_name = recepciones_completadas.local 
    AND user_locals.user_id = auth.uid()
  )
);

-- Política para permitir actualizaciones a administradores y warehouse supervisors
CREATE POLICY "Administradores y warehouse supervisors pueden actualizar recepciones" ON recepciones_completadas
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = ANY (ARRAY['administrador'::user_role, 'Warehouse Supervisor'::user_role, 'Warehouse Operator'::user_role, 'Store Supervisor'::user_role])
  )
);

-- Política para permitir eliminaciones a administradores
CREATE POLICY "Administradores pueden eliminar recepciones" ON recepciones_completadas
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'administrador'::user_role
  )
);