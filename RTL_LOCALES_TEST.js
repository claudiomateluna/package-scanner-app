// Script de prueba para verificar locales tipo RTL
// Copia y pega este código en la consola del navegador

async function testRTLLocales() {
  console.log('=== Prueba de Locales Tipo RTL ===');
  
  try {
    // Importar el cliente de Supabase
    const { supabase } = await import('./src/lib/supabaseClient');
    
    // Verificar tabla 'locales' para tipo RTL
    console.log('\n1. Verificando locales tipo RTL...');
    const { data: rtlLocals, error: rtlError } = await supabase
      .from('locales')
      .select('*')
      .eq('tipo_local', 'RTL')
      .limit(10);
    
    if (rtlError) {
      console.error('Error al acceder a la tabla \'locales\' con tipo RTL:', rtlError);
    } else {
      console.log('Locales tipo RTL encontrados:', rtlLocals?.length || 0);
      if (rtlLocals && rtlLocals.length > 0) {
        console.log('Primeros locales tipo RTL:', rtlLocals);
      }
    }
    
    // Verificar tabla 'locales' para todos los tipos
    console.log('\n2. Verificando todos los tipos de locales...');
    const { data: allLocals, error: allError } = await supabase
      .from('locales')
      .select('tipo_local')
      .order('tipo_local');
    
    if (allError) {
      console.error('Error al acceder a la tabla \'locales\':', allError);
    } else {
      console.log('Todos los locales encontrados:', allLocals?.length || 0);
      if (allLocals && allLocals.length > 0) {
        // Contar por tipo
        const typeCount = {};
        allLocals.forEach(local => {
          typeCount[local.tipo_local] = (typeCount[local.tipo_local] || 0) + 1;
        });
        console.log('Distribución por tipo:', typeCount);
      }
    }
    
    console.log('\n=== Fin de la prueba ===');
  } catch (error) {
    console.error('Error en la prueba:', error);
  }
}

console.log('Para ejecutar la prueba, escribe: await testRTLLocales()');