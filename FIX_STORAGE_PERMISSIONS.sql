-- FIX_STORAGE_PERMISSIONS.sql
-- Script para corregir los permisos del bucket de almacenamiento

-- Crear los buckets si no existen
INSERT INTO storage.buckets (id, name, public)
VALUES ('faltantes-attachments', 'faltantes-attachments', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('rechazos-fotos', 'rechazos-fotos', false)
ON CONFLICT (id) DO NOTHING;

-- Eliminar políticas existentes de los buckets
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir archivos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden leer sus propios archivos" ON storage.objects;
DROP POLICY IF EXISTS "Administradores pueden leer todos los archivos" ON storage.objects;

-- Crear políticas para el bucket de faltantes-attachments
-- Política para inserción de objetos
CREATE POLICY "Usuarios autenticados pueden subir archivos faltantes" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'faltantes-attachments');

-- Política para lectura de objetos
CREATE POLICY "Usuarios pueden leer sus propios archivos faltantes" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (
  bucket_id = 'faltantes-attachments' 
  AND (storage.foldername(name))[1] = 'faltantes-attachments'
);

-- Política para actualización de objetos
CREATE POLICY "Usuarios pueden actualizar sus propios archivos faltantes" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'faltantes-attachments' 
  AND (storage.foldername(name))[1] = 'faltantes-attachments'
)
WITH CHECK (
  bucket_id = 'faltantes-attachments' 
  AND (storage.foldername(name))[1] = 'faltantes-attachments'
);

-- Política para eliminación de objetos
CREATE POLICY "Usuarios pueden eliminar sus propios archivos faltantes" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'faltantes-attachments' 
  AND (storage.foldername(name))[1] = 'faltantes-attachments'
);

-- Crear políticas para el bucket de rechazos-fotos
-- Política para inserción de objetos
CREATE POLICY "Usuarios autenticados pueden subir fotos rechazos" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'rechazos-fotos');

-- Política para lectura de objetos
CREATE POLICY "Usuarios pueden leer sus propios fotos rechazos" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (
  bucket_id = 'rechazos-fotos' 
  AND (storage.foldername(name))[1] = 'rechazos-fotos'
);

-- Política para actualización de objetos
CREATE POLICY "Usuarios pueden actualizar sus propios fotos rechazos" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'rechazos-fotos' 
  AND (storage.foldername(name))[1] = 'rechazos-fotos'
)
WITH CHECK (
  bucket_id = 'rechazos-fotos' 
  AND (storage.foldername(name))[1] = 'rechazos-fotos'
);

-- Política para eliminación de objetos
CREATE POLICY "Usuarios pueden eliminar sus propios fotos rechazos" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'rechazos-fotos' 
  AND (storage.foldername(name))[1] = 'rechazos-fotos'
);