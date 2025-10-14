import { v4 as uuidv4 } from 'uuid';
import { createSupabaseServiceClient } from './supabaseServerClient';
import { createSupabaseServerClient } from './supabaseServerClient';

// Duración del token CSRF en milisegundos (24 horas)
const CSRF_TOKEN_DURATION = 24 * 60 * 60 * 1000;

// Genera un token CSRF único
export function generateCSRFToken(): string {
  return uuidv4();
}

// Valida un token CSRF
export function validateCSRFToken(
  token: string | undefined, 
  expectedToken: string
): boolean {
  if (!token) return false;
  return token === expectedToken;
}

// Verifica si un token CSRF ha expirado
export function isCSRFTokenExpired(timestamp: number): boolean {
  return Date.now() - timestamp > CSRF_TOKEN_DURATION;
}

// Almacena el token CSRF en la base de datos
export async function storeCSRFToken(userId: string, token: string): Promise<boolean> {
  const supabase = createSupabaseServiceClient();

  // Insertar o actualizar el token CSRF en la tabla profiles
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      csrf_token: token,
      csrf_token_created_at: new Date().toISOString()
    }, {
      onConflict: 'id'
    });

  if (error) {
    console.error('Error storing CSRF token:', error);
    return false;
  }

  return true;
}

// Obtiene el token CSRF del usuario desde la base de datos
export async function getCSRFToken(userId: string): Promise<{ token: string | null; createdAt: string | null }> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('csrf_token, csrf_token_created_at')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching CSRF token:', error);
    return { token: null, createdAt: null };
  }

  return { 
    token: data?.csrf_token || null, 
    createdAt: data?.csrf_token_created_at || null 
  };
}

// Valida la solicitud contra CSRF usando el token almacenado
export async function validateCSRF(request: Request, userId: string): Promise<boolean> {
  const csrfToken = request.headers.get('x-csrf-token');
  if (!csrfToken) {
    console.error('Falta el token CSRF');
    return false;
  }

  const { token: storedToken, createdAt } = await getCSRFToken(userId);
  
  if (!storedToken) {
    console.error('No se encontró token CSRF almacenado para el usuario');
    return false;
  }

  // Verificar si el token ha expirado
  if (createdAt) {
    const creationTime = new Date(createdAt).getTime();
    if (isCSRFTokenExpired(creationTime)) {
      console.error('Token CSRF ha expirado');
      // Opcional: eliminar el token expirado
      await storeCSRFToken(userId, ''); // Almacenar token vacío para invalidar
      return false;
    }
  }

  // Validar el token
  return validateCSRFToken(csrfToken, storedToken);
}

// Genera y almacena un nuevo token CSRF para el usuario
export async function generateAndStoreCSRFToken(userId: string): Promise<string | null> {
  const newToken = generateCSRFToken();
  const success = await storeCSRFToken(userId, newToken);
  
  if (!success) {
    return null;
  }
  
  return newToken;
}