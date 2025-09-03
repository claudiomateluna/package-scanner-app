// Script de diagnóstico simple para ejecutar en la consola del navegador

console.log('=== Diagnóstico de Tabla de Datos ===');

// Verificar si supabase está disponible
if (typeof supabase === 'undefined') {
  console.log('❌ Objeto supabase no disponible');
} else {
  console.log('✅ Objeto supabase disponible');
  
  // Probar consulta a la tabla data
  console.log('\nConsultando tabla "data"...');
  supabase.from('data').select('Local').limit(5)
    .then(({ data, error }) => {
      if (error) {
        console.log('❌ Error al consultar tabla "data":', error);
      } else {
        console.log('✅ Consulta exitosa a tabla "data"');
        console.log('   Registros obtenidos:', data?.length || 0);
        if (data && data.length > 0) {
          console.log('   Primeros registros:', data.slice(0, 3));
          
          // Extraer locales únicos
          const locales = [...new Set(data.map(item => item.Local).filter(local => local))].sort();
          console.log('   Locales únicos encontrados:', locales);
        }
      }
    })
    .catch(error => {
      console.log('❌ Error en la promesa:', error);
    });
  
  // Probar consulta a la tabla user_locals
  console.log('\nConsultando tabla "user_locals"...');
  supabase.from('user_locals').select('local_name').limit(5)
    .then(({ data, error }) => {
      if (error) {
        console.log('❌ Error al consultar tabla "user_locals":', error);
      } else {
        console.log('✅ Consulta exitosa a tabla "user_locals"');
        console.log('   Registros obtenidos:', data?.length || 0);
        if (data && data.length > 0) {
          console.log('   Primeros registros:', data.slice(0, 3));
          
          // Extraer locales únicos
          const locales = [...new Set(data.map(item => item.local_name).filter(local => local))].sort();
          console.log('   Locales únicos encontrados:', locales);
        }
      }
    })
    .catch(error => {
      console.log('❌ Error en la promesa:', error);
    });
}

console.log('\n=== Fin del diagnóstico ===');