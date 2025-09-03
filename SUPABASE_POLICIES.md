# Políticas de Seguridad para Tablas de Usuarios

## Tabla `profiles`

```sql
-- Política para permitir que los usuarios autenticados lean perfiles
CREATE POLICY "Usuarios autenticados pueden leer perfiles" 
ON profiles FOR SELECT 
TO authenticated 
USING (true);

-- Política para permitir que los usuarios autenticados inserten perfiles (para nuevos usuarios)
CREATE POLICY "Administradores pueden insertar perfiles" 
ON profiles FOR INSERT 
TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'administrador'));

-- Política para permitir que los usuarios autenticados actualicen perfiles
CREATE POLICY "Usuarios pueden actualizar su propio perfil" 
ON profiles FOR UPDATE 
TO authenticated 
USING (id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrador', 'Warehouse Supervisor')))
WITH CHECK (id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrador', 'Warehouse Supervisor')));

-- Política para permitir que los administradores eliminen perfiles
CREATE POLICY "Administradores pueden eliminar perfiles" 
ON profiles FOR DELETE 
TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'administrador'));
```

## Tabla `user_locals`

```sql
-- Política para permitir que los usuarios autenticados lean sus locales asignados
CREATE POLICY "Usuarios pueden leer sus locales asignados" 
ON user_locals FOR SELECT 
TO authenticated 
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrador', 'Warehouse Supervisor')));

-- Política para permitir que los administradores inserten asignaciones de locales
CREATE POLICY "Administradores pueden insertar asignaciones de locales" 
ON user_locals FOR INSERT 
TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrador', 'Warehouse Supervisor')));

-- Política para permitir que los administradores actualicen asignaciones de locales
CREATE POLICY "Administradores pueden actualizar asignaciones de locales" 
ON user_locals FOR UPDATE 
TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrador', 'Warehouse Supervisor')))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrador', 'Warehouse Supervisor')));

-- Política para permitir que los administradores eliminen asignaciones de locales
CREATE POLICY "Administradores pueden eliminar asignaciones de locales" 
ON user_locals FOR DELETE 
TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrador', 'Warehouse Supervisor')));
```

## Verificación de políticas existentes

Para verificar las políticas actuales, ejecuta:

```sql
-- Ver políticas en la tabla profiles
SELECT * FROM pg_policy WHERE polrelid = 'profiles'::regclass;

-- Ver políticas en la tabla user_locals
SELECT * FROM pg_policy WHERE polrelid = 'user_locals'::regclass;
```

## Eliminar políticas existentes (si es necesario)

```sql
-- Eliminar todas las políticas de la tabla profiles
DROP POLICY IF EXISTS "Usuarios autenticados pueden leer perfiles" ON profiles;
DROP POLICY IF EXISTS "Administradores pueden insertar perfiles" ON profiles;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON profiles;
DROP POLICY IF EXISTS "Administradores pueden eliminar perfiles" ON profiles;

-- Eliminar todas las políticas de la tabla user_locals
DROP POLICY IF EXISTS "Usuarios pueden leer sus locales asignados" ON user_locals;
DROP POLICY IF EXISTS "Administradores pueden insertar asignaciones de locales" ON user_locals;
DROP POLICY IF EXISTS "Administradores pueden actualizar asignaciones de locales" ON user_locals;
DROP POLICY IF EXISTS "Administradores pueden eliminar asignaciones de locales" ON user_locals;
```