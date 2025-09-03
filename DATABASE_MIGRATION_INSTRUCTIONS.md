# Instrucciones de Migración de Base de Datos

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

## 3. Actualizar políticas de seguridad (RLS)

```sql
-- Eliminar las políticas existentes (si es seguro hacerlo)
DROP POLICY IF EXISTS "Los usuarios pueden ver datos según su rol" ON data;
DROP POLICY IF EXISTS "Los usuarios pueden ver recepciones según su rol" ON recepcion;
DROP POLICY IF EXISTS "Los usuarios pueden insertar recepciones según su rol" ON recepcion;

-- Crear nueva política para la tabla data
CREATE POLICY "Los usuarios pueden ver datos según su rol y locales" 
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

-- Crear nueva política para ver recepciones
CREATE POLICY "Los usuarios pueden ver recepciones según su rol y locales" 
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

-- Crear nueva política para insertar recepciones
CREATE POLICY "Los usuarios pueden insertar recepciones según su rol y locales" 
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

## 4. Eliminar columna local_asignado (OPCIONAL y SOLO CUANDO SEA SEGURO)

**IMPORTANTE**: No ejecutar esta consulta hasta que estés completamente seguro de que todo funciona correctamente con la nueva tabla `user_locals`.

```sql
-- Solo ejecutar esto cuando estemos seguros de que ya no se necesita
ALTER TABLE profiles DROP COLUMN local_asignado;
```

## Notas importantes

1. La columna `local_asignado` se mantiene temporalmente para compatibilidad con el código existente.
2. Las nuevas políticas de seguridad utilizan la tabla `user_locals` para determinar el acceso a los datos.
3. Los usuarios pueden tener múltiples locales asignados a través de la tabla `user_locals`.
4. Las políticas verifican tanto el rol del usuario como sus locales asignados.
5. **Importante**: Las columnas de local en las tablas `data` y `recepcion` se llaman `"Local"` (con mayúscula).