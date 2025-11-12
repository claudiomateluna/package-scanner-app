import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServiceClient } from '@/lib/supabaseServerClient'

export async function POST(request: Request) {
  try {
    const newData = await request.json()
    
    // Obtener el token de autorización del header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado - falta token de autenticación' }, { status: 401 })
    }
    
    const token = authHeader.substring(7) // Remover 'Bearer ' del principio
    
    // Usar el token directamente para crear un cliente autenticado
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        },
        auth: {
          persistSession: false // No persistir sesión en el servidor
        }
      }
    )

    // Verificar la sesión usando el token proporcionado
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError) {
      console.error('User verification error:', userError)
      return NextResponse.json({ error: 'No autorizado - token inválido' }, { status: 401 })
    }
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado - usuario no válido' }, { status: 401 })
    }

    // Obtener el perfil del usuario para verificar su rol
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json({ error: 'Error al verificar permisos de usuario' }, { status: 500 })
    }

    const allowedRoles = ['administrador', 'Warehouse Supervisor', 'Warehouse Operator']
    if (!profile || !profile.role || !allowedRoles.includes(profile.role)) {
      console.log('Unauthorized role:', profile?.role)
      return NextResponse.json({ error: 'Permiso denegado. Rol no autorizado.' }, { status: 403 })
    }

    // Si el rol es correcto, usar el cliente de servicio para hacer el upsert
    const supabaseAdmin = createSupabaseServiceClient()

    const { error: upsertError } = await supabaseAdmin
      .from('data')
      .upsert(newData, { onConflict: 'OLPN' })

    if (upsertError) {
      console.error('Error en Upsert:', upsertError)
      return NextResponse.json({ error: `Error al guardar los datos: ${upsertError.message}` }, { status: 500 })
    }

    return NextResponse.json({ message: 'Datos cargados exitosamente' })
  } catch (error: any) {
    console.error('Error in upload-data API (token-based):', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}