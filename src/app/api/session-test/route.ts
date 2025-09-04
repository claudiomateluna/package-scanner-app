import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Obtener el token de autorización del encabezado
  const authHeader = request.headers.get('authorization')
  
  // Crear un cliente de Supabase con o sin token de autenticación
  let supabaseOptions = {}
  let token = null
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7) // Remover 'Bearer ' del inicio
    supabaseOptions = {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    }
  }
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    supabaseOptions
  )

  // Obtener la sesión del usuario
  let session
  let sessionError
  
  if (token) {
    // Si tenemos un token, verificar la sesión con ese token
    const result = await supabase.auth.getUser(token)
    session = result.data?.user ? { user: result.data.user } : null
    sessionError = result.error
  } else {
    // Si no tenemos token, intentar obtener la sesión de las cookies
    const result = await supabase.auth.getSession()
    session = result.data?.session
    sessionError = result.error
  }
  
  if (sessionError) {
    return NextResponse.json({ 
      status: 'error', 
      message: 'Error al obtener sesión',
      error: sessionError.message 
    })
  }

  if (!session || !session.user) {
    return NextResponse.json({ 
      status: 'no-session', 
      message: 'No hay sesión activa' 
    })
  }

  return NextResponse.json({ 
    status: 'success',
    message: 'Sesión encontrada',
    session: {
      user: {
        id: session.user.id,
        email: session.user.email
      },
      expires_at: 'expires_at' in session ? session.expires_at : null
    }
  })
}