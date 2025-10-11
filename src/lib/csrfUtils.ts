import { v4 as uuidv4 } from 'uuid';

// Duración del token CSRF en milisegundos (24 horas)
const CSRF_TOKEN_DURATION = 24 * 60 * 60 * 1000;

// Genera un token CSRF
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

// Valida la solicitud contra CSRF
export async function validateCSRF(request: Request, sessionToken: string): Promise<boolean> {
  const csrfToken = request.headers.get('x-csrf-token');
  if (!csrfToken) {
    console.error('Falta el token CSRF');
    return false;
  }

  return validateCSRFToken(csrfToken, sessionToken);
}