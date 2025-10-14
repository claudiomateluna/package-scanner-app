import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Verificar que las variables no estén vacías
if (!supabaseUrl || supabaseUrl.trim() === '' || !supabaseAnonKey || supabaseAnonKey.trim() === '') {
  console.error('Missing Supabase URL or Anon Key');
  // En lugar de lanzar un error que rompería la aplicación, crear un cliente vacío o con valores por defecto
  // Esto previene el error "supabaseKey is required" que se da cuando se llama a funciones con claves vacías
}

export const supabase = createClient(
  supabaseUrl || 'https://example.supabase.co', 
  supabaseAnonKey || 'your-anon-key', 
  {
    auth: {
      persistSession: true, // Asegura que la sesión se guarde y se cargue automáticamente
      autoRefreshToken: true, // Refresca el token automáticamente
      detectSessionInUrl: true, // Detecta la sesión en la URL (útil para callbacks de auth)
      flowType: 'pkce', // Tipo de flujo recomendado para aplicaciones cliente
    },
  }
);
