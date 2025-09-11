-- FIX_STORAGE_PERMISSIONS_FOR_UPDATE.sql
-- Script para corregir los permisos del bucket de almacenamiento para permitir actualizaciones

-- Eliminar políticas existentes del bucket
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir archivos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden leer sus propios archivos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios archivos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios archivos" ON storage.objects;
DROP POLICY IF EXISTS "Administradores pueden gestionar todos los archivos" ON storage.objects;

-- Crear políticas para el bucket de faltantes-attachments
-- Política para inserción de objetos
CREATE POLICY "Usuarios autenticados pueden subir archivos" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'faltantes-attachments'
);

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

-- Política adicional para administradores
CREATE POLICY "Administradores pueden gestionar todos los archivos" 
ON storage.objects FOR ALL 
TO authenticated 
USING (
  bucket_id = 'faltantes-attachments'
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrador', 'Warehouse Supervisor', 'Store Supervisor'))
)
WITH CHECK (
  bucket_id = 'faltantes-attachments'
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrador', 'Warehouse Supervisor', 'Store Supervisor'))
);