import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Middleware para verificar la autenticación
export async function authenticateUser() {
  // Crear un cliente de Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )

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