// Script de prueba para verificar la funcionalidad de búsqueda en locales
// Copia y pega este código en la consola del navegador

async function testSearchLocals() {
  console.log('=== Prueba de Búsqueda de Locales ===');
  
  try {
    // Importar el cliente de Supabase
    const { supabase } = await import('./src/lib/supabaseClient');
    
    // Verificar tabla 'locales'
    console.log('\n1. Verificando tabla \'locales\'...');
    const { data: allLocals, error: localsError } = await supabase
      .from('locales')
      .select('*')
      .limit(20);
    
    if (localsError) {
      console.error('Error al acceder a la tabla \'locales\':', localsError);
    } else {
      console.log('Locales encontrados:', allLocals?.length || 0);
      if (allLocals && allLocals.length > 0) {
        console.log('Primeros locales:', allLocals.slice(0, 5));
      }
    }
    
    // Simular búsqueda de locales
    console.log('\n2. Simulando búsqueda de locales...');
    const searchTerm = 'ADIDAS'; // Término de búsqueda de ejemplo
    const { data: filteredLocals, error: filteredError } = await supabase
      .from('locales')
      .select('nombre_local')
      .ilike('nombre_local', `%${searchTerm}%`)
      .limit(10);
    
    if (filteredError) {
      console.error('Error al buscar locales:', filteredError);
    } else {
      console.log(`Locales que contienen "${searchTerm}":`, filteredLocals?.length || 0);
      if (filteredLocals && filteredLocals.length > 0) {
        console.log('Resultados de búsqueda:', filteredLocals);
      }
    }
    
    console.log('\n=== Fin de la prueba ===');
    console.log('Para probar la funcionalidad en la interfaz, ve a la sección de administración y escribe en los campos de búsqueda de locales.');
  } catch (error) {
    console.error('Error en la prueba:', error);
  }
}

console.log('Para ejecutar la prueba, escribe: await testSearchLocals()');