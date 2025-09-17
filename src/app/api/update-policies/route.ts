-- src/app/api/update-policies/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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

    if (profileError || profile?.role !== 'administrador') {
      return NextResponse.json({ error: 'Acceso denegado. Solo administradores pueden actualizar políticas.' }, { status: 403 });
    }

    // Actualizar políticas de faltantes
    // Eliminar políticas de selección existentes
    await supabase.rpc('execute_sql', { 
      sql: 'DROP POLICY IF EXISTS "Usuarios pueden leer sus propios reportes de faltantes" ON faltantes;' 
    });
    
    await supabase.rpc('execute_sql', { 
      sql: 'DROP POLICY IF EXISTS "Administradores pueden leer todos los reportes de faltantes" ON faltantes;' 
    });

    // Crear nueva política que permita a todos los usuarios autenticados leer cualquier reporte
    await supabase.rpc('execute_sql', { 
      sql: 'CREATE POLICY "Usuarios autenticados pueden leer todos los reportes de faltantes" ON faltantes FOR SELECT TO authenticated USING (true);' 
    });

    return NextResponse.json({ 
      message: 'Políticas actualizadas correctamente', 
      policies: [
        'Usuarios autenticados pueden leer todos los reportes de faltantes'
      ]
    });

  } catch (error) {
    console.error('Error actualizando políticas:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}