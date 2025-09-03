// Script de verificación final para la eliminación de usuarios
// Este script verifica todo el flujo de eliminación de usuarios

console.log('=== Script de Verificación Final de Eliminación de Usuarios ===');

async function verifyUserDeletionFlow() {
  console.log('\nIniciando verificación del flujo de eliminación de usuarios...\n');
  
  try {
    // Paso 1: Verificar autenticación
    console.log('1. Verificando autenticación...');
    const sessionResponse = await fetch('/api/session-test');
    const sessionData = await sessionResponse.json();
    
    if (sessionData.status !== 'success') {
      console.log('   ❌ No se pudo verificar la autenticación');
      console.log('   Mensaje:', sessionData.message);
      return;
    }
    
    console.log('   ✅ Autenticación verificada');
    console.log('   Usuario:', sessionData.session.user.email);
    
    // Paso 2: Verificar perfil de usuario
    console.log('\n2. Verificando perfil de usuario...');
    const { supabase } = await import('@/lib/supabaseClient');
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sessionData.session.user.id)
      .single();
    
    if (profileError) {
      console.log('   ❌ Error al obtener perfil:', profileError.message);
      return;
    }
    
    console.log('   ✅ Perfil obtenido');
    console.log('   Rol:', profile.role);
    
    // Paso 3: Verificar permisos de eliminación
    console.log('\n3. Verificando permisos de eliminación...');
    const canDeleteUsers = profile.role === 'administrador' || profile.role === 'Warehouse Supervisor';
    
    if (!canDeleteUsers) {
      console.log('   ℹ El usuario no tiene permisos para eliminar usuarios');
      console.log('   Rol requerido: administrador o Warehouse Supervisor');
      return;
    }
    
    console.log('   ✅ Usuario tiene permisos para eliminar usuarios');
    
    // Paso 4: Obtener lista de usuarios
    console.log('\n4. Obteniendo lista de usuarios...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (profilesError) {
      console.log('   ❌ Error al obtener lista de usuarios:', profilesError.message);
      return;
    }
    
    console.log('   ✅ Lista de usuarios obtenida');
    console.log('   Total de usuarios:', profiles.length);
    
    // Mostrar algunos usuarios para referencia
    console.log('\n   Primeros 3 usuarios:');
    profiles.slice(0, 3).forEach((p, index) => {
      console.log('     ' + (index + 1) + '. ' + (p.email || 'Sin email') + ' (' + p.role + ')');
    });
    
    // Paso 5: Verificar API de eliminación (sin eliminar realmente)
    console.log('\n5. Verificando API de eliminación (prueba)...');
    const testDeleteResponse = await fetch('/api/delete-user-test', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: 'test-user-id' })
    });
    
    if (testDeleteResponse.ok) {
      const testData = await testDeleteResponse.json();
      console.log('   ✅ API de eliminación responde correctamente');
      console.log('   Datos recibidos:', testData);
    } else {
      console.log('   ❌ Error en API de eliminación (test):', testDeleteResponse.status);
      const errorText = await testDeleteResponse.text();
      console.log('   Detalles:', errorText);
    }
    
    console.log('\n=== Verificación completada ===');
    console.log('\nPara eliminar un usuario real, sigue estos pasos:');
    console.log('1. Selecciona un usuario de la lista anterior');
    console.log('2. Copia su ID (campo "id" en el objeto del usuario)');
    console.log('3. Ejecuta la función deleteUserById("ID_DEL_USUARIO")');
    
  } catch (error) {
    console.log('   ❌ Error en verificación:', error);
  }
}

// Función para eliminar un usuario por ID
async function deleteUserById(userId) {
  if (!userId) {
    console.log('❌ Se requiere un ID de usuario');
    return;
  }
  
  console.log('\n=== Eliminando usuario con ID:', userId, '===');
  
  try {
    // Confirmar eliminación
    const confirmDelete = confirm(`¿Estás seguro de que quieres eliminar al usuario con ID: ${userId}? Esta acción no se puede deshacer.`);
    
    if (!confirmDelete) {
      console.log('❌ Eliminación cancelada por el usuario');
      return;
    }
    
    // Obtener token de sesión
    console.log('Obteniendo token de autenticación...');
    const { supabase } = await import('@/lib/supabaseClient');
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    if (!token) {
      console.log('❌ No se pudo obtener el token de autenticación');
      return;
    }
    
    console.log('✅ Token de autenticación obtenido');
    
    // Realizar eliminación
    console.log('Enviando solicitud de eliminación...');
    const deleteResponse = await fetch('/api/delete-user', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ id: userId })
    });
    
    if (deleteResponse.ok) {
      const result = await deleteResponse.json();
      console.log('✅ Usuario eliminado exitosamente');
      console.log('Mensaje:', result.message);
    } else {
      const errorData = await deleteResponse.json();
      console.log('❌ Error al eliminar usuario:', errorData.error);
    }
    
  } catch (error) {
    console.log('❌ Error al eliminar usuario:', error);
  }
}

// Exportar funciones
window.userDeletionVerification = {
  verifyUserDeletionFlow: verifyUserDeletionFlow,
  deleteUserById: deleteUserById
};

console.log('\n💡 Herramientas disponibles en window.userDeletionVerification:');
console.log('   - verifyUserDeletionFlow(): Verificar todo el flujo de eliminación');
console.log('   - deleteUserById(userId): Eliminar un usuario específico por ID');

console.log('\nPara ejecutar la verificación completa, escribe:');
console.log('   await window.userDeletionVerification.verifyUserDeletionFlow()');