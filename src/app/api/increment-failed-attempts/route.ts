import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabaseServerClient';

// Duración del bloqueo por intentos fallidos (en milisegundos) - 5 minutos
const BLOCK_DURATION = 5 * 60 * 1000;

// Límite de intentos fallidos antes de bloquear
const MAX_ATTEMPTS = 3;

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email es requerido' }, { status: 400 });
    }

    // Crear cliente de Supabase con permisos de servicio
    const supabase = createSupabaseServiceClient();

    // Obtener el registro actual de intentos fallidos
    const { data, error } = await supabase
      .from('failed_login_attempts')
      .select('attempts, last_attempt, is_blocked')
      .eq('email', email)
      .single();

    let attempts = 1;
    let isBlocked = false;
    const lastAttempt = new Date().toISOString();

    if (!error && data) {
      // Si ya existía un registro
      const lastAttemptTime = new Date(data.last_attempt).getTime();
      const now = Date.now();
      
      // Si ha pasado más del tiempo de bloqueo, reiniciar
      if (now - lastAttemptTime > BLOCK_DURATION) {
        attempts = 1;
      } else if (data.is_blocked && now - lastAttemptTime <= BLOCK_DURATION) {
        // Si está bloqueado y aún no ha pasado el tiempo, mantener bloqueado
        isBlocked = true;
        attempts = data.attempts; // Mantener el número de intentos
      } else {
        // Incrementar intentos
        attempts = data.attempts + 1;
        if (attempts >= MAX_ATTEMPTS) {
          isBlocked = true; // Bloquear al usuario
        }
      }
    }

    // Insertar o actualizar el registro de intentos fallidos
    const { error: upsertError } = await supabase
      .from('failed_login_attempts')
      .upsert({
        email,
        attempts,
        last_attempt: lastAttempt,
        is_blocked: isBlocked
      }, { onConflict: 'email' });

    if (upsertError) {
      console.error('Error incrementando intentos fallidos:', upsertError);
      return NextResponse.json({ error: 'Error al incrementar intentos fallidos' }, { status: 500 });
    }

    return NextResponse.json({ attempts });
  } catch (error) {
    console.error('Error en increment-failed-attempts:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}