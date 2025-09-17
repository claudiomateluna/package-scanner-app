// src/app/api/diagnostic-rechazos/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = await cookies();
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

    // Verificar si el usuario está autenticado
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener información de la tabla rechazos
    const { data: sampleData, error: sampleError } = await supabase
      .from('rechazos')
      .select('*')
      .limit(3);

    if (sampleError) {
      console.error('Error obteniendo muestra de rechazos:', sampleError);
      return NextResponse.json({ error: 'Error obteniendo datos de rechazos' }, { status: 500 });
    }

    // Obtener la estructura de la tabla
    const { data: tableInfo, error: tableError } = await supabase
      .from('rechazos')
      .select('*')
      .limit(1);

    return NextResponse.json({
      sampleData: sampleData,
      columnNames: tableInfo && tableInfo.length > 0 ? Object.keys(tableInfo[0]) : [],
      totalRecords: sampleData ? sampleData.length : 0
    });

  } catch (error) {
    console.error('Error en diagnóstico de rechazos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}