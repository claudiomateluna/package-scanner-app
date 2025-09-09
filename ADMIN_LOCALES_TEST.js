// Script de prueba para verificar locales en la administración de usuarios
// Copia y pega este código en la consola del navegador

async function testAdminLocals() {
  console.log('=== Prueba de Locales en Administración ===');
  
  try {
    // Importar el cliente de Supabase
    const { supabase } = await import('./src/lib/supabaseClient');
    
    // Verificar tabla 'locales'
    console.log('\n1. Verificando tabla \'locales\'...');
    const { data: allLocals, error: localsError } = await supabase
      .from('locales')
      .select('*')
      .limit(10);
    
    if (localsError) {
      console.error('Error al acceder a la tabla \'locales\':', localsError);
    } else {
      console.log('Locales encontrados:', allLocals?.length || 0);
      if (allLocals && allLocals.length > 0) {
        console.log('Primeros locales:', allLocals);
      }
    }
    
    // Verificar tabla 'user_locals'
    console.log('\n2. Verificando tabla \'user_locals\'...');
    const { data: userLocals, error: userLocalsError } = await supabase
      .from('user_locals')
      .select('*')
      .limit(5);
    
    if (userLocalsError) {
      console.error('Error al acceder a la tabla \'user_locals\':', userLocalsError);
    } else {
      console.log('Asignaciones de locales a usuarios encontradas:', userLocals?.length || 0);
      if (userLocals && userLocals.length > 0) {
        console.log('Primeras asignaciones:', userLocals);
      }
    }
    
    // Verificar tabla 'profiles'
    console.log('\n3. Verificando tabla \'profiles\'...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    if (profilesError) {
      console.error('Error al acceder a la tabla \'profiles\':', profilesError);
    } else {
      console.log('Perfiles encontrados:', profiles?.length || 0);
      if (profiles && profiles.length > 0) {
        console.log('Primeros perfiles:', profiles);
      }
    }
    
    console.log('\n=== Fin de la prueba ===');
  } catch (error) {
    console.error('Error en la prueba:', error);
  }
}

console.log('Para ejecutar la prueba, escribe: await testAdminLocals()');