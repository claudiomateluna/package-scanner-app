// src/lib/serverPasswordUtils.ts

// Server-side functions for password hashing - these should only be used in API routes or server components
export async function serverHashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcrypt');
  const saltRounds = 12;
  return await bcrypt.default.hash(password, saltRounds);
}