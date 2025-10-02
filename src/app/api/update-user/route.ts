import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { canUserManageRole } from '@/lib/roleHierarchy'
import { hashPassword } from '@/lib/passwordUtils'

export async function PATCH(request: Request) {
  const { id, email, password, role, first_name, last_name, assigned_locals } = await request.json()

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

  // Obtener el rol del usuario que se quiere actualizar
  const { data: targetUserProfile, error: targetUserError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', id)
    .single()

  if (targetUserError || !targetUserProfile) {
    return NextResponse.json({ error: 'Usuario objetivo no encontrado' }, { status: 404 })
  }

  // Obtener los locales asignados del usuario que se quiere actualizar
  const { data: targetUserLocals } = await supabase
    .from('user_locals')
    .select('local_name')
    .eq('user_id', id)
  
  const targetUserLocalNames = targetUserLocals?.map(item => item.local_name) || []
  const targetUserMainLocal = targetUserLocalNames.length > 0 ? targetUserLocalNames[0] : null

  // Verificar si el usuario actual puede actualizar al usuario objetivo
  if (!canUserManageRole(currentUserProfile.role || '', targetUserProfile.role || '', currentUserMainLocal, targetUserMainLocal)) {
    return NextResponse.json({ error: 'No tienes permisos para actualizar usuarios con ese rol' }, { status: 403 })
  }

  // Si se está intentando asignar un rol, verificar que el usuario actual puede asignarlo
  if (role && !canUserManageRole(currentUserProfile.role || '', role, currentUserMainLocal, targetUserMainLocal)) {
    return NextResponse.json({ error: 'No tienes permisos para asignar ese rol' }, { status: 403 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  // --- Actualizar datos de Autenticación (email/contraseña) ---
  const authDataToUpdate: { email?: string; password?: string } = {}
  if (email) authDataToUpdate.email = email
  if (password) authDataToUpdate.password = password // La contraseña debe tener al menos 6 caracteres

  if (Object.keys(authDataToUpdate).length > 0) {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      id,
      authDataToUpdate
    )
    if (authError) {
      return NextResponse.json({ error: `Error de autenticación: ${authError.message}` }, { status: 500 })
    }
  }

  // --- Actualizar datos del Perfil (rol, nombre, email, contraseña, historial de contraseñas) ---
  const profileDataToUpdate: { 
    role?: string; 
    first_name?: string; 
    last_name?: string; 
    email?: string; 
    must_change_password?: boolean;
    password_last_changed?: string;
    password_history?: string[];
  } = {}
  if (role) profileDataToUpdate.role = role;
  if (first_name !== undefined) profileDataToUpdate.first_name = first_name;
  if (last_name !== undefined) profileDataToUpdate.last_name = last_name;
  if (email !== undefined) profileDataToUpdate.email = email;

  // Si se está actualizando la contraseña, actualizar también la fecha y el historial
  if (password) {
    // Obtener el perfil actual para obtener el historial de contraseñas
    const { data: currentProfile, error: profileFetchError } = await supabaseAdmin
      .from('profiles')
      .select('password_history')
      .eq('id', id)
      .single();

    if (profileFetchError) {
      return NextResponse.json({ error: `Error al obtener el perfil actual: ${profileFetchError.message}` }, { status: 500 });
    }

    // Obtener el historial actual y añadir la nueva contraseña (hash)
    let currentPasswordHistory = currentProfile?.password_history || [];
    
    // Limitar el historial a las últimas 5 contraseñas
    if (currentPasswordHistory.length >= 5) {
      currentPasswordHistory = currentPasswordHistory.slice(-4); // Mantener solo las últimas 4
    }
    
    // Añadir la nueva contraseña al historial
    const hashedNewPassword = hashPassword(password);
    currentPasswordHistory.push(hashedNewPassword);

    profileDataToUpdate.password_history = currentPasswordHistory;
    profileDataToUpdate.password_last_changed = new Date().toISOString();
    profileDataToUpdate.must_change_password = false; // Resetear el flag si se cambia la contraseña
  }

  if (Object.keys(profileDataToUpdate).length > 0) {
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(profileDataToUpdate)
      .eq('id', id)

    if (profileError) {
      return NextResponse.json({ error: `Error de perfil: ${profileError.message}` }, { status: 500 })
    }
  }

  // Si se proporcionaron locales asignados, actualizar las entradas en la tabla user_locals
  if (assigned_locals && Array.isArray(assigned_locals)) {
    // Primero eliminamos todas las asignaciones existentes
    await supabaseAdmin.from('user_locals').delete().eq('user_id', id);
    
    // Luego insertamos las nuevas asignaciones
    if (assigned_locals.length > 0) {
      const userLocalsData = assigned_locals.map(local => ({
        user_id: id,
        local_name: local
      }));
      
      const { error: userLocalsError } = await supabaseAdmin
        .from('user_locals')
        .insert(userLocalsData);
        
      if (userLocalsError) {
        return NextResponse.json({ error: `Error al asignar locales: ${userLocalsError.message}` }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ message: 'Usuario actualizado exitosamente' })
}