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
  let sessionData
  let sessionError
  
  if (token) {
    // Si tenemos un token, verificar la sesión con ese token
    const result = await supabase.auth.getUser(token)
    sessionData = result.data
    sessionError = result.error
  } else {
    // Si no tenemos token, intentar obtener la sesión de las cookies
    const result = await supabase.auth.getSession()
    sessionData = result.data
    sessionError = result.error
  }
  
  const { session } = sessionData || {}
  
  if (sessionError) {
    return NextResponse.json({ 
      status: 'error', 
      message: 'Error al obtener sesión',
      error: sessionError.message 
    })
  }

  if (!session) {
    return NextResponse.json({ 
      status: 'no-session', 
      message: 'No hay sesión activa' 
    })
  }

  // Obtener el perfil del usuario
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (profileError) {
    return NextResponse.json({ 
      status: 'error', 
      message: 'Error al obtener perfil',
      error: profileError.message,
      userId: session.user.id
    })
  }

  // Obtener los locales asignados
  const { data: userLocals, error: localsError } = await supabase
    .from('user_locals')
    .select('*')
    .eq('user_id', session.user.id)

  if (localsError) {
    return NextResponse.json({ 
      status: 'error', 
      message: 'Error al obtener locales',
      error: localsError.message,
      userId: session.user.id
    })
  }

  return NextResponse.json({ 
    status: 'success',
    message: 'Diagnóstico completado',
    session: {
      user: {
        id: session.user.id,
        email: session.user.email
      }
    },
    profile: {
      role: profile.role,
      first_name: profile.first_name,
      last_name: profile.last_name
    },
    locals: userLocals.map(local => local.local_name)
  })
}