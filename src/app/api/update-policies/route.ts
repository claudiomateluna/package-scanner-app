import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Verificar si el usuario es administrador
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar si el usuario es administrador
    const { data: profile, error: profileError } = await supabase
      .from('profiles') 
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile || profile?.role !== 'administrador') {
      return NextResponse.json({ error: 'Acceso denegado. Solo administradores pueden actualizar políticas.' }, { status: 403 });
    }

    // Crear cliente de Supabase con service role para operaciones administrativas
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Actualizar políticas de faltantes
    // Eliminar políticas de selección existentes
    await supabaseAdmin.rpc('execute_sql', { 
      sql: 'DROP POLICY IF EXISTS "Usuarios pueden leer sus propios reportes de faltantes" ON faltantes;' 
    });
    
    await supabaseAdmin.rpc('execute_sql', { 
      sql: 'DROP POLICY IF EXISTS "Administradores pueden leer todos los reportes de faltantes" ON faltantes;' 
    });

    // Crear nueva política que permita a todos los usuarios autenticados leer cualquier reporte
    await supabaseAdmin.rpc('execute_sql', { 
      sql: 'CREATE POLICY "Usuarios autenticados pueden leer todos los reportes de faltantes" ON faltantes FOR SELECT TO authenticated USING (true);' 
    });

    // Actualizar políticas de storage buckets
    // Configurar políticas para 'faltantes-attachments' bucket
    const faltantesBucketPolicy = `
DO $
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
  
  -- Crear política para rechazos-fotos bucket
  DROP POLICY IF EXISTS "Usuarios pueden subir a rechazos-fotos" ON storage.objects;
  DROP POLICY IF EXISTS "Usuarios pueden leer de rechazos-fotos" ON storage.objects;
  
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
END $;
`;

    await supabaseAdmin.rpc('execute_sql', { 
      sql: faltantesBucketPolicy 
    });

    return NextResponse.json({ 
      message: 'Políticas actualizadas correctamente', 
      policies: [
        'Usuarios autenticados pueden leer todos los reportes de faltantes',
        'Usuarios pueden subir y leer faltantes-attachments',
        'Usuarios pueden subir y leer rechazos-fotos'
      ]
    });

  } catch (error) {
    console.error('Error actualizando políticas:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}