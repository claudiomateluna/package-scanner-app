import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabaseServerClient';
import { SupabaseClient } from '@supabase/supabase-js';

// Duración del bloqueo por intentos fallidos (en milisegundos) - 5 minutos
const BLOCK_DURATION = 5 * 60 * 1000;

export async function GET(request: Request) {
  try {
    // Obtener el email de los parámetros de consulta
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email es requerido' }, { status: 400 });
    }

    // Crear cliente de Supabase con permisos de servicio
    const supabase = createSupabaseServiceClient();

    // Obtener el registro de intentos fallidos para el email
    const { data, error } = await supabase
      .from('failed_login_attempts')
      .select('attempts, last_attempt, is_blocked')
      .eq('email', email)
      .single();

    if (error || !data) {
      // Si no hay registro o hay un error de acceso, el correo no está bloqueado
      return NextResponse.json({ isBlocked: false, remainingTime: 0 });
    }

    if (!data.is_blocked) {
      // Si no está marcado como bloqueado, definitivamente no lo está
      return NextResponse.json({ isBlocked: false, remainingTime: 0 });
    }

    // Calcular tiempo restante de bloqueo
    const lastAttemptTime = new Date(data.last_attempt).getTime();
    const now = Date.now();
    const elapsedTime = now - lastAttemptTime;
    const remainingTime = Math.max(0, BLOCK_DURATION - elapsedTime);

    if (remainingTime <= 0) {
      // El bloqueo ha expirado, debemos desbloquear
      await unblockEmail(email, supabase);
      return NextResponse.json({ isBlocked: false, remainingTime: 0 });
    }

    return NextResponse.json({ 
      isBlocked: true, 
      remainingTime 
    });
  } catch (error) {
    console.error('Error en check-email-blocked:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// Función auxiliar para desbloquear un email
async function unblockEmail(email: string, supabase: SupabaseClient) {
  const { error } = await supabase
    .from('failed_login_attempts')
    .update({ 
      is_blocked: false, 
      attempts: 0 
    })
    .eq('email', email);

  if (error) {
    console.error('Error desbloqueando correo:', error);
  }
}