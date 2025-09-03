```javascript
// Script de verificación de autenticación para ejecutar en la consola del navegador

// Primero, verifica que el objeto supabase está disponible
if (typeof supabase === 'undefined') {
  console.log('Objeto supabase no encontrado. Asegúrate de estar en la aplicación correctamente.');
} else {
  console.log('=== Verificación de Autenticación ===');
  
  // Verificar sesión actual
  supabase.auth.getSession().then(({ data: { session }, error }) => {
    if (error) {
      console.error('Error al obtener sesión:', error);
      return;
    }
    
    if (!session) {
      console.log('No hay sesión activa');
      return;
    }
    
    console.log('Sesión encontrada:');
    console.log('Usuario ID:', session.user.id);
    console.log('Email:', session.user.email);
    
    // Verificar perfil del usuario
    supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data: profile, error: profileError }) => {
      if (profileError) {
        console.error('Error al obtener perfil:', profileError);
        return;
      }
      
      console.log('Perfil encontrado:');
      console.log('Rol:', profile.role);
      console.log('Nombre:', profile.first_name, profile.last_name);
      
      // Verificar locales asignados
      supabase.from('user_locals').select('*').eq('user_id', session.user.id).then(({ data: locals, error: localsError }) => {
        if (localsError) {
          console.error('Error al obtener locales:', localsError);
          return;
        }
        
        console.log('Locales asignados:', locals);
        
        // Probar acceso a todos los perfiles (para verificar permisos de administrador)
        console.log('\n=== Prueba de Acceso Total ===');
        supabase.from('profiles').select('*').then(({ data: allProfiles, error: allProfilesError }) => {
          if (allProfilesError) {
            console.log('Acceso restringido a perfiles (esto es normal si no eres admin):', allProfilesError.message);
          } else {
            console.log('Acceso total a perfiles: OK');
            console.log('Total de perfiles:', allProfiles.length);
          }
        });
      });
    });
  });
}

// Función para probar una llamada directa a la API
async function testApiCall() {
  console.log('\n=== Prueba de Llamada API ===');
  
  try {
    const response = await fetch('/api/delete-user', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: 'test-id' }),
    });
    
    console.log('Respuesta de API:', response.status, response.statusText);
    
    if (response.ok) {
      console.log('Llamada API exitosa');
    } else {
      const errorText = await response.text();
      console.log('Error en llamada API:', errorText);
    }
  } catch (error) {
    console.error('Error al hacer llamada API:', error);
  }
}

// Para ejecutar la prueba de API, llama a:
// testApiCall();
```