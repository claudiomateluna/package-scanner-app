// src/lib/serverAuthWrapper.ts

import { createSupabaseServiceClient } from './supabaseServerClient';

/**
 * Crea un cliente de Supabase seguro para uso en operaciones del lado del servidor
 * @param token El token de sesión del usuario
 * @returns Cliente de Supabase autenticado o null si no hay sesión válida
 */
export async function createServerSupabaseClientFromToken(token: string | undefined) {
  if (!token) {
    console.error('No se proporcionó token de autenticación');
    return null;
  }

  // Crear cliente con el token del usuario
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    }
  );

  return supabase;
}

/**
 * Verifica si un usuario tiene permiso para realizar una acción específica
 * @param userId El ID del usuario
 * @param action La acción que se desea realizar
 * @returns true si tiene permiso, false si no
 */
export async function checkUserPermission(userId: string, action: string): Promise<boolean> {
  // Crear cliente de Supabase con permisos de servicio para consultas de perfil
  const supabase = createSupabaseServiceClient();

  // Obtener el rol del usuario
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    console.error('No se pudo obtener el perfil del usuario:', error?.message);
    return false;
  }

  // Definir permisos basados en roles
  const rolePermissions: Record<string, string[]> = {
    'administrador': ['create', 'read', 'update', 'delete', 'admin'],
    'Warehouse Supervisor': ['create', 'read', 'update', 'delete', 'admin'],
    'Warehouse Operator': ['create', 'read', 'update', 'delete'],
    'Store Supervisor': ['read', 'update'],
    'Store Operator': ['read'],
    'SKA Operator': ['read']
  };

  const userPermissions = rolePermissions[profile.role] || [];
  return userPermissions.includes(action);
}

/**
 * Middleware de autenticación para operaciones del lado del servidor
 * @param token El token de sesión del usuario
 * @param action La acción que se desea realizar
 * @returns Un objeto con el cliente de Supabase, el usuario y permisos, o null si no autorizado
 */
export async function serverAuthMiddleware(token: string | undefined, action: string) {
  // Crear cliente de Supabase del lado del servidor
  const supabase = await createServerSupabaseClientFromToken(token);
  
  if (!supabase) {
    return null;
  }
  
  // Verificar que la sesión sea válida
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    console.error('Sesión inválida:', error?.message);
    return null;
  }
  
  // Verificar permisos
  const hasPermission = await checkUserPermission(user.id, action);
  
  if (!hasPermission) {
    console.error(`Usuario ${user.id} no tiene permiso para ${action}`);
    return null;
  }
  
  return { supabase, user, hasPermission: true };
}