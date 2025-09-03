# Instrucciones de Migración de Base de Datos (Actualizadas)

Este documento contiene las instrucciones necesarias para migrar la base de datos y actualizar las políticas de seguridad para soportar la nueva funcionalidad de asignación de múltiples locales a usuarios.

## 1. Crear la nueva tabla user_locals

```sql
-- Crear tabla para la relación muchos a muchos entre usuarios y locales
CREATE TABLE user_locals (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  local_name TEXT,
  PRIMARY KEY (user_id, local_name)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_user_locals_user_id ON user_locals(user_id);
CREATE INDEX idx_user_locals_local_name ON user_locals(local_name);
```

## 2. Migrar datos existentes

```sql
-- Migrar los datos existentes de local_asignado a user_locals
INSERT INTO user_locals (user_id, local_name)
SELECT id, local_asignado
FROM profiles
WHERE local_asignado IS NOT NULL
ON CONFLICT (user_id, local_name) DO NOTHING;
```

## 3. Verificar políticas actuales

```sql
-- Ver las políticas actuales en la tabla data
SELECT polname, polcmd, polqual, polwithcheck 
FROM pg_policy 
WHERE polrelid = 'data'::regclass;

-- Ver las políticas actuales en la tabla recepcion
SELECT polname, polcmd, polqual, polwithcheck 
FROM pg_policy 
WHERE polrelid = 'recepcion'::regclass;
```

## 4. Crear nuevas políticas con nombres diferentes

```sql
-- Crear nuevas políticas con nombres diferentes para evitar conflictos
CREATE POLICY "Usuarios ven datos por rol y locales" 
ON data FOR SELECT 
TO authenticated 
USING (
  -- Administradores ven todo
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'administrador')
  OR
  -- Warehouse Supervisor y Warehouse Operator ven datos de sus locales
  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Warehouse Supervisor', 'Warehouse Operator')) 
   AND "Local" IN (SELECT local_name FROM user_locals WHERE user_id = auth.uid()))
  OR
  -- Store Supervisor y Store Operator ven datos de sus locales
  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Store Supervisor', 'Store Operator')) 
   AND "Local" IN (SELECT local_name FROM user_locals WHERE user_id = auth.uid()))
);

CREATE POLICY "Usuarios ven recepciones por rol y locales" 
ON recepcion FOR SELECT 
TO authenticated 
USING (
  -- Administradores ven todo
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'administrador')
  OR
  -- Warehouse Supervisor y Warehouse Operator ven recepciones de sus locales
  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Warehouse Supervisor', 'Warehouse Operator')) 
   AND "Local" IN (SELECT local_name FROM user_locals WHERE user_id = auth.uid()))
  OR
  -- Store Supervisor y Store Operator ven recepciones de sus locales
  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Store Supervisor', 'Store Operator')) 
   AND "Local" IN (SELECT local_name FROM user_locals WHERE user_id = auth.uid()))
);

CREATE POLICY "Usuarios insertan recepciones por rol y locales" 
ON recepcion FOR INSERT 
TO authenticated 
WITH CHECK (
  -- Administradores pueden insertar en cualquier local
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'administrador')
  OR
  -- Warehouse Supervisor y Warehouse Operator pueden insertar en sus locales
  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Warehouse Supervisor', 'Warehouse Operator')) 
   AND "Local" IN (SELECT local_name FROM user_locals WHERE user_id = auth.uid()))
  OR
  -- Store Supervisor y Store Operator pueden insertar en sus locales
  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Store Supervisor', 'Store Operator')) 
   AND "Local" IN (SELECT local_name FROM user_locals WHERE user_id = auth.uid()))
);
```

## 5. Desactivar temporalmente las políticas antiguas

```sql
-- Desactivar las políticas antiguas
ALTER POLICY "Los usuarios pueden ver datos según su rol" ON data USING (false);
ALTER POLICY "Los usuarios pueden ver recepciones según su rol" ON recepcion USING (false);
ALTER POLICY "Los usuarios pueden insertar recepciones según su rol" ON recepcion WITH CHECK (false);
```

## 6. Eliminar la columna local_asignado

```sql
-- Eliminar la columna local_asignado
ALTER TABLE profiles DROP COLUMN local_asignado;
```

## 7. Renombrar las nuevas políticas (opcional)

```sql
-- Renombrar las políticas si es necesario
ALTER POLICY "Usuarios ven datos por rol y locales" ON data RENAME TO "Los usuarios pueden ver datos según su rol";
ALTER POLICY "Usuarios ven recepciones por rol y locales" ON recepcion RENAME TO "Los usuarios pueden ver recepciones según su rol";
ALTER POLICY "Usuarios insertan recepciones por rol y locales" ON recepcion RENAME TO "Los usuarios pueden insertar recepciones según su rol";
```

## Notas importantes

1. Las nuevas políticas de seguridad utilizan la tabla `user_locals` para determinar el acceso a los datos.
2. Los usuarios pueden tener múltiples locales asignados a través de la tabla `user_locals`.
3. Las políticas verifican tanto el rol del usuario como sus locales asignados.
4. **Importante**: Las columnas de local en las tablas `data` y `recepcion` se llaman `"Local"` (con mayúscula).
5. Este enfoque evita el error de dependencia al desactivar primero las políticas antiguas.