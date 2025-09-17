// src/lib/ticketPermissions.ts
import { supabase } from '@/lib/supabaseClient';
import { Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  role: string | null;
  first_name?: string | null;
  last_name?: string | null;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, role, first_name, last_name')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

// Todos los usuarios autenticados pueden ver faltantes (después de actualizar las políticas)
export function canViewAnyFaltantes(profile: UserProfile | null): boolean {
  return !!profile; // Cualquier usuario autenticado
}

// Todos los usuarios autenticados pueden ver rechazos
export function canViewAnyRechazos(profile: UserProfile | null): boolean {
  return !!profile; // Cualquier usuario autenticado
}

// Cualquier usuario autenticado puede ver un ticket de faltante
export async function canViewFaltanteTicket(userId: string, ticketCreatorId: string): Promise<boolean> {
  // Después de actualizar las políticas, todos los usuarios autenticados pueden ver
  const profile = await getUserProfile(userId);
  return canViewAnyFaltantes(profile);
}

// Cualquier usuario autenticado puede ver un ticket de rechazo
export async function canViewRechazoTicket(userId: string): Promise<boolean> {
  // Todos los usuarios autenticados pueden ver rechazos
  const profile = await getUserProfile(userId);
  return canViewAnyRechazos(profile);
}