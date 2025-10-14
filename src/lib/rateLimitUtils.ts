// src/lib/rateLimitUtils.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseServerClient, createSupabaseServiceClient } from './supabaseServerClient';

// Duración del bloqueo por intentos fallidos (en milisegundos) - 5 minutos
const BLOCK_DURATION = 5 * 60 * 1000;

// Límite de intentos fallidos antes de bloquear
const MAX_ATTEMPTS = 3;

/**
 * Obtiene una instancia de cliente de Supabase reutilizable (cliente público)
 * @returns Cliente de Supabase
 */
function getSupabaseClient(): SupabaseClient {
  try {
    return createSupabaseServerClient();
  } catch (error) {
    console.error('Faltan variables de entorno requeridas para Supabase:', error);
    // Crear un cliente básico que no cause errores
    return createSupabaseServerClient(); // Esto lanzará un error si las variables no están definidas
  }
}

/**
 * Obtiene una instancia de cliente de Supabase con permisos de servicio
 * @returns Cliente de Supabase con permisos de servicio
 */
function getSupabaseServiceClient(): SupabaseClient {
  try {
    return createSupabaseServiceClient();
  } catch (error) {
    console.error('Faltan variables de entorno requeridas para Supabase Service Client:', error);
    // Crear un cliente básico que no cause errores
    return createSupabaseServiceClient(); // Esto lanzará un error si las variables no están definidas
  }
}

/**
 * Incrementa el contador de intentos fallidos para un correo electrónico
 * @param email El correo electrónico que intenta iniciar sesión
 * @returns El número actual de intentos fallidos
 */
export async function incrementFailedLoginAttempts(email: string): Promise<number> {
  // En el cliente, usar una API para incrementar el contador de intentos fallidos
  // para evitar exponer la clave de servicio directamente en el navegador
  try {
    const response = await fetch('/api/increment-failed-attempts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      console.error('Error al incrementar intentos fallidos:', response.statusText);
      // En caso de error, retornar un valor seguro
      return 1;
    }

    const data = await response.json();
    return data.attempts;
  } catch (error) {
    console.error('Error al incrementar intentos fallidos:', error);
    // En caso de error, retornar un valor seguro
    return 1;
  }
}

/**
 * Verifica si un correo electrónico está bloqueado por intentos fallidos
 * @param email El correo electrónico para verificar
 * @returns true si está bloqueado, false si no lo está
 */
export async function isEmailBlocked(email: string): Promise<{ isBlocked: boolean; remainingTime: number }> {
  // En el cliente, usar una API para verificar si el correo está bloqueado
  // para evitar exponer la clave de servicio directamente en el navegador
  try {
    const response = await fetch(`/api/check-email-blocked?email=${encodeURIComponent(email)}`);
    
    if (!response.ok) {
      console.error('Error al verificar estado de bloqueo:', response.statusText);
      // En caso de error, retornar false para evitar bloquear innecesariamente
      return { isBlocked: false, remainingTime: 0 };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al verificar estado de bloqueo:', error);
    // En caso de error, retornar false para evitar bloquear innecesariamente
    return { isBlocked: false, remainingTime: 0 };
  }
}

/**
 * Desbloquea un correo electrónico (para cuando expire el periodo de bloqueo)
 * @param email El correo electrónico para desbloquear
 * @returns true si se desbloqueó exitosamente
 */
async function unblockEmail(email: string): Promise<boolean> {
  const supabase = getSupabaseServiceClient();

  const { error } = await supabase
    .from('failed_login_attempts')
    .update({ 
      is_blocked: false, 
      attempts: 0 
    })
    .eq('email', email);

  if (error) {
    console.error('Error desbloqueando correo:', error);
    return false;
  }

  return true;
}

/**
 * Limpia registros antiguos de intentos fallidos que ya han expirado
 * (Útil para mantener limpia la base de datos)
 */
export async function cleanupExpiredAttempts(): Promise<void> {
  const supabase = getSupabaseServiceClient();

  const cutoffTime = new Date(Date.now() - BLOCK_DURATION).toISOString();

  const { error } = await supabase
    .from('failed_login_attempts')
    .delete()
    .lt('last_attempt', cutoffTime) // Eliminar los registros más antiguos que el tiempo de bloqueo
    .or('attempts.eq.0,and(is_blocked.eq.false,last_attempt.lt.current_timestamp - interval \'5 minutes\')'); // Opcional: también eliminar registros no bloqueados antiguos

  if (error) {
    console.error('Error limpiando intentos expirados:', error);
  }
}