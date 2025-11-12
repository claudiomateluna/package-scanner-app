// ESTA ES UNA VERSIÓN MODIFICADA DE LA API PARA PROBAR UN ENFOQUE DIFERENTE DE AUTENTICACIÓN

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createSupabaseServiceClient } from '@/lib/supabaseServerClient'

export async function POST(request: Request) {
  try {
    const newData = await request.json()
    
    // Intentar obtener las cookies de manera más explícita
    const cookieStore = cookies()
    
    // Verificar que existen cookies relacionadas con Supabase
    const refreshToken = cookieStore.get('sb-gkqebmqtmjeinjuoivvu-auth-token')
    console.log('Refresh token exists:', !!refreshToken)
    
    // Crear cliente de supabase con manejo de cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name)
            return cookie?.value
          },
          set(name: string, value: string, options: { [key: string]: unknown }) {
            cookieStore.set(name, value, options)
          },
          remove(name: string, options: { [key: string]: unknown }) {
            cookieStore.delete(name)
          },
        },
      }
    )

    // 1. Verificar la sesión del usuario que hace la petición
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.json({ error: `Error de sesión: ${sessionError.message}` }, { status: 401 })
    }
    
    if (!session) {
      console.error('No session found')
      // Agregar más información de depuración
      const allCookies = cookieStore.getAll()
      console.log('All cookies:', allCookies)
      return NextResponse.json({ error: 'No autorizado - no hay sesión activa' }, { status: 401 })
    }

    console.log('Session found for user:', session.user.id)

    // 2. Obtener el perfil del usuario para verificar su rol
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profileError) {
      console.error('Profile error:', profileError)
      return NextResponse.json({ error: `Error al obtener perfil: ${profileError.message}` }, { status: 500 })
    }

    const allowedRoles = ['administrador', 'Warehouse Supervisor', 'Warehouse Operator']
    if (!profile || !profile.role || !allowedRoles.includes(profile.role)) {
      console.log('User role not allowed:', profile?.role)
      return NextResponse.json({ error: 'Permiso denegado. Rol no autorizado.' }, { status: 403 })
    }

    console.log('User authorized, starting upsert')

    // 3. Si el rol es correcto, usar el cliente de admin para hacer el upsert
    const supabaseAdmin = createSupabaseServiceClient()

    const { error: upsertError } = await supabaseAdmin
      .from('data')
      .upsert(newData, { onConflict: 'OLPN' })

    if (upsertError) {
      console.error('Error en Upsert:', upsertError)
      return NextResponse.json({ error: `Error al guardar los datos: ${upsertError.message}` }, { status: 500 })
    }

    console.log('Data uploaded successfully')
    return NextResponse.json({ message: 'Datos cargados exitosamente' })
  } catch (error: any) {
    console.error('Unexpected error in upload API:', error)
    return NextResponse.json({ error: `Error inesperado: ${error.message}` }, { status: 500 })
  }
}