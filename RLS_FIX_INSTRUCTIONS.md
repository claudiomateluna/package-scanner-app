# Instrucciones para Corregir los Errores de Seguridad RLS

## Problema
Al intentar crear reportes de faltantes/sobrantes, se produce el error:
```
"new row violates row-level security policy"
```

Este error ocurre porque las políticas de seguridad a nivel de fila (RLS) en las tablas de Supabase están bloqueando las operaciones de inserción.

## Solución

### 1. Aplicar las políticas corregidas para la tabla `faltantes`

Ejecute el script `UPDATE_FALTANTES_POLICIES.sql` en el SQL Editor de Supabase:

```sql
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Usuarios pueden leer sus propios reportes de faltantes" ON faltantes;
DROP POLICY IF EXISTS "Administradores pueden leer todos los reportes de faltantes" ON faltantes;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios reportes de faltantes" ON faltantes;
DROP POLICY IF EXISTS "Administradores pueden actualizar todos los reportes de faltantes" ON faltantes;

-- Crear políticas actualizadas para la tabla faltantes
-- Política para lectura - usuarios pueden leer sus propios reportes y reportes de su local
CREATE POLICY "Usuarios pueden leer reportes de faltantes" 
ON faltantes FOR SELECT 
TO authenticated 
USING (
  -- Usuarios pueden leer sus propios reportes
  created_by_user_id = auth.uid()
  OR
  -- Usuarios con roles de supervisor pueden leer todos los reportes
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrador', 'Warehouse Supervisor', 'Store Supervisor'))
  OR
  -- Usuarios pueden leer reportes de su mismo local
  nombre_local IN (
    SELECT local_name FROM user_locals WHERE user_id = auth.uid()
  )
);

-- Política para actualización - usuarios pueden actualizar sus propios reportes y usuarios con roles adecuados pueden actualizar todos
CREATE POLICY "Usuarios pueden actualizar reportes de faltantes" 
ON faltantes FOR UPDATE 
TO authenticated 
USING (
  -- Usuarios pueden actualizar sus propios reportes
  created_by_user_id = auth.uid()
  OR
  -- Usuarios con roles de supervisor pueden actualizar todos los reportes
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrador', 'Warehouse Supervisor', 'Store Supervisor'))
)
WITH CHECK (
  -- Usuarios pueden actualizar sus propios reportes
  created_by_user_id = auth.uid()
  OR
  -- Usuarios con roles de supervisor pueden actualizar todos los reportes
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrador', 'Warehouse Supervisor', 'Store Supervisor'))
);

-- Asegurar que RLS está habilitado
ALTER TABLE faltantes ENABLE ROW LEVEL SECURITY;
```

### 2. Aplicar las políticas corregidas para la tabla `ticket_counters`

Ejecute el script `FIX_TICKET_COUNTERS_POLICIES.sql` en el SQL Editor de Supabase:

```sql
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Usuarios autenticados pueden leer contadores" ON ticket_counters;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar contadores" ON ticket_counters;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar contadores" ON ticket_counters;

-- Crear políticas corregidas para la tabla ticket_counters
-- Política para lectura
CREATE POLICY "Usuarios autenticados pueden leer contadores" 
ON ticket_counters FOR SELECT 
TO authenticated 
USING (true);

-- Política para actualización
CREATE POLICY "Usuarios autenticados pueden actualizar contadores" 
ON ticket_counters FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Política para inserción
CREATE POLICY "Usuarios autenticados pueden insertar contadores" 
ON ticket_counters FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Asegurar que RLS está habilitado
ALTER TABLE ticket_counters ENABLE ROW LEVEL SECURITY;
```

### 3. Configurar los permisos del bucket de almacenamiento

Ejecute el script `FIX_STORAGE_PERMISSIONS.sql` en el SQL Editor de Supabase:

```sql
-- Crear el bucket si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('faltantes-attachments', 'faltantes-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Eliminar políticas existentes del bucket
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir archivos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden leer sus propios archivos" ON storage.objects;
DROP POLICY IF EXISTS "Administradores pueden leer todos los archivos" ON storage.objects;

-- Crear políticas para el bucket de faltantes-attachments
-- Política para inserción de objetos
CREATE POLICY "Usuarios autenticados pueden subir archivos" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'faltantes-attachments');

-- Política para lectura de objetos
CREATE POLICY "Usuarios pueden leer sus propios archivos" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (
  bucket_id = 'faltantes-attachments'
);

-- Política para actualización de objetos
CREATE POLICY "Usuarios pueden actualizar sus propios archivos" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'faltantes-attachments'
)
WITH CHECK (
  bucket_id = 'faltantes-attachments'
);

-- Política para eliminación de objetos
CREATE POLICY "Usuarios pueden eliminar sus propios archivos" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'faltantes-attachments'
);
```

## Verificación

Después de aplicar estos cambios, reinicie la aplicación y pruebe nuevamente:

1. Cree un reporte con un usuario
2. Intente editar ese mismo reporte con otro usuario (debe funcionar si el segundo usuario tiene rol de supervisor)
3. Verifique que usuarios sin permisos adecuados no puedan editar reportes de otros

Los errores deberían desaparecer y la funcionalidad debería trabajar correctamente.