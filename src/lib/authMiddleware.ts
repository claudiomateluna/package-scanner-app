import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from './supabaseServerClient'

// Acknowledge unused NextResponse to prevent ESLint warning
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _NextResponse = NextResponse;

// Middleware para verificar la autenticación
export async function authenticateUser() {
  // Crear un cliente de Supabase
  const supabase = createSupabaseServerClient()

  // Obtener la sesión del usuario
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return { error: 'No autorizado', session: null, user: null }
  }

  // Obtener el perfil del usuario
  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profileError || !userProfile) {
    return { error: 'Perfil de usuario no encontrado', session: null, user: null }
  }

  return { error: null, session, user: { ...session.user, profile: userProfile } }
}