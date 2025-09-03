import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { canUserManageRole } from '@/lib/roleHierarchy'

export async function POST(request: Request) {
  const { user_id, locals } = await request.json()

  if (!user_id || !locals || !Array.isArray(locals)) {
    return NextResponse.json({ error: 'Se requiere user_id y un array de locales.' }, { status: 400 })
  }

  // Crear un cliente de Supabase para obtener el rol del usuario que hace la petición
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )

  // Obtener la sesión del usuario que hace la petición
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Obtener el rol del usuario que hace la petición
  const { data: currentUserProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!currentUserProfile) {
    return NextResponse.json({ error: 'Perfil de usuario no encontrado' }, { status: 404 })
  }

  // Obtener los locales asignados del usuario que hace la petición
  const { data: currentUserLocals } = await supabase
    .from('user_locals')
    .select('local_name')
    .eq('user_id', session.user.id)
  
  const currentUserLocalNames = currentUserLocals?.map(item => item.local_name) || []
  const currentUserMainLocal = currentUserLocalNames.length > 0 ? currentUserLocalNames[0] : null

  // Obtener el rol del usuario que se quiere actualizar
  const { data: targetUserProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user_id)
    .single()

  if (!targetUserProfile) {
    return NextResponse.json({ error: 'Usuario objetivo no encontrado' }, { status: 404 })
  }

  // Obtener los locales asignados del usuario que se quiere actualizar
  const { data: targetUserLocals } = await supabase
    .from('user_locals')
    .select('local_name')
    .eq('user_id', user_id)
  
  const targetUserLocalNames = targetUserLocals?.map(item => item.local_name) || []
  const targetUserMainLocal = targetUserLocalNames.length > 0 ? targetUserLocalNames[0] : null

  // Verificar si el usuario actual puede gestionar al usuario objetivo
  if (!canUserManageRole(currentUserProfile.role || '', targetUserProfile.role || '', currentUserMainLocal, targetUserMainLocal)) {
    return NextResponse.json({ error: 'No tienes permisos para asignar locales a este usuario' }, { status: 403 })
  }

  // Crear un cliente de Supabase especial para tareas de admin
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  // Eliminar las asignaciones existentes
  await supabaseAdmin.from('user_locals').delete().eq('user_id', user_id);
  
  // Insertar las nuevas asignaciones
  if (locals.length > 0) {
    const userLocalsData = locals.map(local => ({
      user_id: user_id,
      local_name: local
    }));
    
    const { error: insertError } = await supabaseAdmin
      .from('user_locals')
      .insert(userLocalsData);
      
    if (insertError) {
      return NextResponse.json({ error: `Error al asignar locales: ${insertError.message}` }, { status: 500 })
    }
  }

  return NextResponse.json({ message: 'Locales asignados exitosamente' })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const user_id = searchParams.get('user_id')

  if (!user_id) {
    return NextResponse.json({ error: 'Se requiere user_id.' }, { status: 400 })
  }

  // Crear un cliente de Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )

  // Obtener la sesión del usuario que hace la petición
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Obtener las asignaciones de locales del usuario
  const { data, error } = await supabase
    .from('user_locals')
    .select('local_name')
    .eq('user_id', user_id)

  if (error) {
    return NextResponse.json({ error: `Error al obtener locales: ${error.message}` }, { status: 500 })
  }

  return NextResponse.json({ locals: data.map(item => item.local_name) })
}