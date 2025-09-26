-- Configurar políticas para el bucket de faltantes-attachments
DO $$
BEGIN
  -- Eliminar políticas existentes si existen
  DROP POLICY IF EXISTS "Usuarios pueden subir a faltantes-attachments" ON storage.objects;
  DROP POLICY IF EXISTS "Usuarios pueden leer de faltantes-attachments" ON storage.objects;
  
  -- Crear política para permitir subida y lectura en faltantes-attachments
  CREATE POLICY "Usuarios pueden subir y leer faltantes-attachments" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'faltantes-attachments'
    AND (auth.role() = 'authenticated' OR auth.uid() = owner)
  )
  WITH CHECK (
    bucket_id = 'faltantes-attachments'
    AND (auth.role() = 'authenticated')
  );
END $$;

-- Configurar políticas para el bucket de rechazos-fotos
DO $$
BEGIN
  -- Eliminar políticas existentes si existen
  DROP POLICY IF EXISTS "Usuarios pueden subir a rechazos-fotos" ON storage.objects;
  DROP POLICY IF EXISTS "Usuarios pueden leer de rechazos-fotos" ON storage.objects;
  
  -- Crear política para permitir subida y lectura en rechazos-fotos
  CREATE POLICY "Usuarios pueden subir y leer rechazos-fotos" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'rechazos-fotos'
    AND (auth.role() = 'authenticated' OR auth.uid() = owner)
  )
  WITH CHECK (
    bucket_id = 'rechazos-fotos'
    AND (auth.role() = 'authenticated')
  );
END $$;