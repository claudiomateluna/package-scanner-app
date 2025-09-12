import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Helper function to get user role
async function getUserRole(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()
  
  if (error) return null
  return data.role
}

// Helper function to check if user can manage locales
async function canUserManageLocales(supabase: SupabaseClient, userId: string) {
  const userRole = await getUserRole(supabase, userId)
  return userRole === 'administrador' || userRole === 'Warehouse Supervisor' || userRole === 'Warehouse Operator'
}

export async function GET(request: Request) {
  // Obtener el token de autorización del encabezado
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const token = authHeader.substring(7) // Remover 'Bearer ' del inicio

  // Crear un cliente de Supabase con el token del usuario
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
  )

  // Verificar la sesión del usuario
  const { data: { user }, error: sessionError } = await supabase.auth.getUser(token)
  
  if (sessionError || !user) {
    return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })
  }

  // Verificar si el usuario puede gestionar locales
  const canManage = await canUserManageLocales(supabase, user.id)
  if (!canManage) {
    return NextResponse.json({ error: 'No tienes permisos para gestionar locales' }, { status: 403 })
  }

  // Crear un cliente de Supabase especial para tareas de admin
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  // Obtener todos los locales
  const { data, error } = await supabaseAdmin
    .from('locales')
    .select('*')
    .order('nombre_local')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const { nombre_local, tipo_local } = await request.json()

  // Obtener el token de autorización del encabezado
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const token = authHeader.substring(7) // Remover 'Bearer ' del inicio

  // Crear un cliente de Supabase con el token del usuario
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
  )

  // Verificar la sesión del usuario
  const { data: { user }, error: sessionError } = await supabase.auth.getUser(token)
  
  if (sessionError || !user) {
    return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })
  }

  // Verificar si el usuario puede gestionar locales
  const canManage = await canUserManageLocales(supabase, user.id)
  if (!canManage) {
    return NextResponse.json({ error: 'No tienes permisos para gestionar locales' }, { status: 403 })
  }

  // Validaciones
  if (!nombre_local || !tipo_local) {
    return NextResponse.json({ error: 'Nombre y tipo de local son requeridos' }, { status: 400 })
  }

  // Crear un cliente de Supabase especial para tareas de admin
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  // Crear el nuevo local
  const { data, error } = await supabaseAdmin
    .from('locales')
    .insert([
      {
        nombre_local: nombre_local.trim(),
        tipo_local
      }
    ])
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Local creado exitosamente', data })
}

export async function PUT(request: Request) {
  const { id, nombre_local, tipo_local } = await request.json()

  // Obtener el token de autorización del encabezado
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const token = authHeader.substring(7) // Remover 'Bearer ' del inicio

  // Crear un cliente de Supabase con el token del usuario
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
  )

  // Verificar la sesión del usuario
  const { data: { user }, error: sessionError } = await supabase.auth.getUser(token)
  
  if (sessionError || !user) {
    return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })
  }

  // Verificar si el usuario puede gestionar locales
  const canManage = await canUserManageLocales(supabase, user.id)
  if (!canManage) {
    return NextResponse.json({ error: 'No tienes permisos para gestionar locales' }, { status: 403 })
  }

  // Validaciones
  if (!id || !nombre_local || !tipo_local) {
    return NextResponse.json({ error: 'ID, nombre y tipo de local son requeridos' }, { status: 400 })
  }

  // Crear un cliente de Supabase especial para tareas de admin
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  // Actualizar el local
  const { data: _, error } = await supabaseAdmin
    .from('locales')
    .update({
      nombre_local: nombre_local.trim(),
      tipo_local
    })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Local actualizado exitosamente' })
}

export async function DELETE(request: Request) {
  const { id } = await request.json()

  // Obtener el token de autorización del encabezado
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const token = authHeader.substring(7) // Remover 'Bearer ' del inicio

  // Crear un cliente de Supabase con el token del usuario
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
  )

  // Verificar la sesión del usuario
  const { data: { user }, error: sessionError } = await supabase.auth.getUser(token)
  
  if (sessionError || !user) {
    return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })
  }

  // Verificar si el usuario puede gestionar locales
  const canManage = await canUserManageLocales(supabase, user.id)
  if (!canManage) {
    return NextResponse.json({ error: 'No tienes permisos para gestionar locales' }, { status: 403 })
  }

  // Validaciones
  if (!id) {
    return NextResponse.json({ error: 'ID del local es requerido' }, { status: 400 })
  }

  // Crear un cliente de Supabase especial para tareas de admin
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  // Obtener el nombre del local antes de eliminarlo
  const { data: localData, error: localError } = await supabaseAdmin
    .from('locales')
    .select('nombre_local')
    .eq('id', id)
    .single()

  if (localError || !localData) {
    return NextResponse.json({ error: 'Error al obtener información del local: ' + (localError?.message || 'Local no encontrado') }, { status: 500 })
  }

  const nombre_local = localData.nombre_local

  // Verificar si el local está siendo usado
  const { data: userData, error: userError } = await supabaseAdmin
    .from('user_locals')
    .select('user_id')
    .eq('local_name', nombre_local)
    .limit(1)
  
  if (userError) {
    return NextResponse.json({ error: 'Error al verificar referencias: ' + userError.message }, { status: 500 })
  }
  
  if (userData && userData.length > 0) {
    return NextResponse.json({ error: 'No se puede eliminar el local porque está asignado a uno o más usuarios' }, { status: 400 })
  }
  
  // Verificar si el local está en la tabla data
  const { data: dataData, error: dataError } = await supabaseAdmin
    .from('data')
    .select('id')
    .eq('Local', nombre_local)
    .limit(1)
  
  if (dataError) {
    return NextResponse.json({ error: 'Error al verificar referencias: ' + dataError.message }, { status: 500 })
  }
  
  if (dataData && dataData.length > 0) {
    return NextResponse.json({ error: 'No se puede eliminar el local porque está en uso en los datos de recepción' }, { status: 400 })
  }
  
  // Verificar si el local está en recepciones_completadas
  const { data: recepcionData, error: recepcionError } = await supabaseAdmin
    .from('recepciones_completadas')
    .select('id')
    .eq('local', nombre_local)
    .limit(1)
  
  if (recepcionError) {
    return NextResponse.json({ error: 'Error al verificar referencias: ' + recepcionError.message }, { status: 500 })
  }
  
  if (recepcionData && recepcionData.length > 0) {
    return NextResponse.json({ error: 'No se puede eliminar el local porque está en uso en recepciones completadas' }, { status: 400 })
  }

  // Eliminar el local
  const { error } = await supabaseAdmin
    .from('locales')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Local eliminado exitosamente' })
}