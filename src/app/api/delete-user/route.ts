import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { canUserManageRole } from '@/lib/roleHierarchy'

interface DeleteUserData {
  id: string;
}

// Validador de entradas para eliminación de usuario
function validateDeleteInput(data: DeleteUserData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validar ID de usuario
  if (!data.id || typeof data.id !== 'string' || data.id.trim() === '') {
    errors.push('ID de usuario es requerido y debe ser una cadena no vacía');
  }

  return { isValid: errors.length === 0, errors };
}

export async function DELETE(request: Request) {
  const requestData = await request.json();
  
  // Validar los datos entrantes
  const validation = validateDeleteInput(requestData);
  if (!validation.isValid) {
    return NextResponse.json({ error: 'Error de validación', details: validation.errors }, { status: 400 });
  }
  
  const { id } = requestData;

  if (!id) {
    return NextResponse.json({ error: 'Se requiere el ID del usuario.' }, { status: 400 })
  }

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

  // Obtener el rol del usuario que hace la petición
  const { data: currentUserProfile, error: currentUserError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (currentUserError || !currentUserProfile) {
    return NextResponse.json({ error: 'Perfil de usuario no encontrado' }, { status: 404 })
  }

  // Obtener los locales asignados del usuario que hace la petición
  const { data: currentUserLocals } = await supabase
    .from('user_locals')
    .select('local_name')
    .eq('user_id', user.id)
  
  const currentUserLocalNames = currentUserLocals?.map(item => item.local_name) || []
  const currentUserMainLocal = currentUserLocalNames.length > 0 ? currentUserLocalNames[0] : null

  // Obtener el rol del usuario que se quiere eliminar
  const { data: targetUserProfile, error: targetUserError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', id)
    .single()

  if (targetUserError || !targetUserProfile) {
    return NextResponse.json({ error: 'Usuario objetivo no encontrado' }, { status: 404 })
  }

  // Obtener los locales asignados del usuario que se quiere eliminar
  const { data: targetUserLocals } = await supabase
    .from('user_locals')
    .select('local_name')
    .eq('user_id', id)
  
  const targetUserLocalNames = targetUserLocals?.map(item => item.local_name) || []
  const targetUserMainLocal = targetUserLocalNames.length > 0 ? targetUserLocalNames[0] : null

  // Verificar si el usuario actual puede eliminar al usuario objetivo
  if (!canUserManageRole(currentUserProfile.role || '', targetUserProfile.role || '', currentUserMainLocal, targetUserMainLocal)) {
    return NextResponse.json({ error: 'No tienes permisos para eliminar usuarios con ese rol' }, { status: 403 })
  }

  // Crear un cliente de Supabase especial para tareas de admin
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  // Eliminar las asignaciones de locales del usuario
  await supabaseAdmin.from('user_locals').delete().eq('user_id', id);

  // Eliminar el usuario del sistema de autenticación
  const { error: userError } = await supabaseAdmin.auth.admin.deleteUser(id)
  
  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 400 })
  }

  // Eliminar el perfil del usuario
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .delete()
    .eq('id', id)

  if (profileError) {
    return NextResponse.json({ error: `Error al eliminar el perfil: ${profileError.message}` }, { status: 500 })
  }

  return NextResponse.json({ message: 'Usuario eliminado exitosamente' })
}