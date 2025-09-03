import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const newData = await request.json()
  const supabase = createServerComponentClient({ cookies })

  // 1. Verificar la sesión del usuario que hace la petición
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // 2. Obtener el perfil del usuario para verificar su rol
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  const allowedRoles = ['administrador', 'Warehouse Operator']
  if (!profile || !profile.role || !allowedRoles.includes(profile.role)) {
    return NextResponse.json({ error: 'Permiso denegado. Rol no autorizado.' }, { status: 403 })
  }

  // 3. Si el rol es correcto, usar el cliente de admin para hacer el upsert
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  const { error } = await supabaseAdmin
    .from('data')
    .upsert(newData, { onConflict: 'OLPN' })

  if (error) {
    console.error('Error en Upsert:', error)
    return NextResponse.json({ error: `Error al guardar los datos: ${error.message}` }, { status: 500 })
  }

  return NextResponse.json({ message: 'Datos cargados exitosamente' })
}
