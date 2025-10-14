import { createClient } from '@supabase/supabase-js';

/**
 * Crea un cliente de Supabase para uso en el servidor con permisos de anon
 * @returns Cliente de Supabase con permisos de anon
 */
export function createSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase URL or Anon Key');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Crea un cliente de Supabase para uso en el servidor con permisos de service role
 * @returns Cliente de Supabase con permisos de service role o null si no se puede crear
 */
export function createSupabaseServiceClient() {
  // Verificar si estamos en el servidor o cliente
  // En el cliente, las variables de entorno que no son NEXT_PUBLIC no están disponibles
  if (typeof window !== 'undefined') {
    // Estamos en el cliente - solo usar cliente público
    console.warn('Advertencia: Intentando crear cliente de servicio en el cliente. Usando cliente anónimo.');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase URL or Anon Key');
    }

    return createClient(supabaseUrl, supabaseAnonKey);
  }

  // Estamos en el servidor - usar cliente de servicio
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase URL or Service Role Key');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}