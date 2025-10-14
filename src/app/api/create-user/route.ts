import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabaseServerClient'

export async function POST(request: Request) {
  // Extraer todos los campos del cuerpo de la petición
  const { email, password, role, local_asignado, first_name, last_name, assigned_locals } = await request.json()

  // Validar que los campos requeridos no estén vacíos
  if (!email || !password || !role) {
    return NextResponse.json({ error: 'Email, password y role son campos requeridos.' }, { status: 400 });
  }

  // Crear un cliente de Supabase especial para tareas de admin
  const supabaseAdmin = createSupabaseServiceClient()

  // Crear el nuevo usuario en el sistema de autenticación
  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true, // Lo marcamos como confirmado ya que lo crea un admin
  })

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 400 })
  }

  if (!userData.user) {
    return NextResponse.json({ error: 'No se pudo crear el usuario en el sistema de autenticación.' }, { status: 500 })
  }

  // Actualizar la tabla de perfiles con todos los datos, incluyendo nombre, apellido y email
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ 
      role: role,
      local_asignado: local_asignado,
      first_name: first_name, // Campo añadido
      last_name: last_name,   // Campo añadido
      email: email,            // Campo añadido
      must_change_password: true  // Nuevo campo para forzar cambio de contraseña en primer login
    })
    .eq('id', userData.user.id)

  if (profileError) {
    // Si falla la actualización del perfil, se borra el usuario recién creado para evitar inconsistencias
    await supabaseAdmin.auth.admin.deleteUser(userData.user.id)
    return NextResponse.json({ error: `Error al actualizar el perfil: ${profileError.message}` }, { status: 500 })
  }

  // Si se proporcionaron locales asignados, crear las entradas en la tabla user_locals
  if (assigned_locals && Array.isArray(assigned_locals) && assigned_locals.length > 0) {
    const userLocalsData = assigned_locals.map(local => ({
      user_id: userData.user.id,
      local_name: local
    }));
    
    const { error: userLocalsError } = await supabaseAdmin
      .from('user_locals')
      .insert(userLocalsData);
      
    if (userLocalsError) {
      // Si falla la asignación de locales, mostramos un warning pero no fallamos la creación
      console.warn(`Warning: Error al asignar locales al usuario: ${userLocalsError.message}`);
    }
  }

  return NextResponse.json({ message: 'Usuario creado exitosamente' })
}