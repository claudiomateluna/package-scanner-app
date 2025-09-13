-- Agregar campos para la gestión de faltantes
ALTER TABLE public.faltantes
ADD COLUMN gestionado BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN responsabilidad VARCHAR(50) CHECK (responsabilidad IN ('CD', 'Asume Tienda', 'Asume Transporte')),
ADD COLUMN comentarios TEXT,
ADD COLUMN gestionado_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN gestionado_by_user_id UUID REFERENCES auth.users(id),
ADD COLUMN gestionado_by_user_name VARCHAR(100);

-- Crear índices para acelerar búsquedas y filtros de gestión
CREATE INDEX IF NOT EXISTS idx_faltantes_gestionado ON public.faltantes(gestionado);
CREATE INDEX IF NOT EXISTS idx_faltantes_delivery_note ON public.faltantes(delivery_note);
CREATE INDEX IF NOT EXISTS idx_faltantes_nombre_local ON public.faltantes(nombre_local);

-- Actualizar políticas de seguridad para permitir la modificación de los nuevos campos
-- Asegurarse de que los roles correctos puedan actualizar estos campos.

-- Primero, eliminamos las políticas de UPDATE existentes para reemplazarlas
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios reportes de faltantes" ON public.faltantes;
DROP POLICY IF EXISTS "Administradores pueden actualizar todos los reportes de faltantes" ON public.faltantes;

-- Política para que los creadores originales NO puedan modificar el reporte una vez creado (solo lectura para ellos)
-- Opcional: Si se quiere que el creador pueda editar, se puede ajustar.

-- Política que permite a los roles de gestión actualizar los campos de gestión
CREATE POLICY "Gestores pueden actualizar todos los reportes de faltantes" 
ON public.faltantes FOR UPDATE 
TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND lower(role::text) IN ('administrador', 'admnistrador', 'warehouse supervisor', 'warehouse operator')))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND lower(role::text) IN ('administrador', 'admnistrador', 'warehouse supervisor', 'warehouse operator')));

-- Política para que todos los roles autorizados puedan ver todos los reportes
DROP POLICY IF EXISTS "Usuarios pueden leer sus propios reportes de faltantes" ON public.faltantes;
DROP POLICY IF EXISTS "Administradores pueden leer todos los reportes de faltantes" ON public.faltantes;

CREATE POLICY "Roles autorizados pueden leer todos los reportes de faltantes" 
ON public.faltantes FOR SELECT 
TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND lower(role::text) IN ('administrador', 'admnistrador', 'warehouse supervisor', 'warehouse operator', 'store supervisor', 'store operator', 'ska operator')));
