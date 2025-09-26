import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Anon Key');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Asegura que la sesión se guarde y se cargue automáticamente
    autoRefreshToken: true, // Refresca el token automáticamente
    detectSessionInUrl: true, // Detecta la sesión en la URL (útil para callbacks de auth)
    flowType: 'pkce', // Tipo de flujo recomendado para aplicaciones cliente
  },
});
