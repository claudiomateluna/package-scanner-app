// src/app/api/diagnostic-faltantes-structure/route.ts
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

    // Obtener información de la estructura de la tabla
    console.log('Diagnosticando estructura de faltantes...');
    
    // Obtener registros con ticket_id específico
    const { data: specificTickets, error: specificError } = await supabase
      .from('faltantes')
      .select('*')
      .eq('ticket_id', 'RTL000000001');
    
    if (specificError) {
      console.error('Error obteniendo tickets específicos:', specificError);
    } else {
      console.log(`Encontrados ${specificTickets?.length || 0} registros con ticket_id RTL000000001`);
    }
    
    // Contar registros por ticket_id
    const { data: ticketCounts, error: countError } = await supabase
      .from('faltantes')
      .select('ticket_id, count(*)', { count: 'exact' });
    
    if (countError) {
      console.error('Error contando tickets:', countError);
    } else {
      console.log('Distribución de tickets:', ticketCounts);
    }
    
    // Obtener muestra de datos
    const { data: sampleData, error: sampleError } = await supabase
      .from('faltantes')
      .select('*')
      .limit(5);
    
    if (sampleError) {
      console.error('Error obteniendo muestra:', sampleError);
    } else {
      console.log('Muestra de datos:', sampleData);
    }

    return NextResponse.json({
      specificTickets: specificTickets,
      ticketCounts: ticketCounts,
      sampleData: sampleData,
      message: 'Diagnóstico completado'
    });

  } catch (error) {
    console.error('Error en diagnóstico:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}