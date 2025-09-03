// Script para verificar la estructura de la tabla 'data'
// Copia y pega este código en la consola del navegador

async function verificarEstructuraTabla() {
  console.log('=== Verificación de Estructura de Tabla ===');
  
  try {
    // Verificar si supabase está disponible
    if (typeof supabase === 'undefined') {
      console.log('❌ Objeto supabase no disponible');
      return;
    }
    
    console.log('✅ Objeto supabase disponible');
    
    // 1. Obtener información de la tabla con diferentes variaciones
    console.log('\n1. Probando diferentes variaciones de nombres de campo...');
    
    const variaciones = ['Local', 'local', 'LOCAL', '"Local"'];
    
    for (const campo of variaciones) {
      try {
        console.log(`   Probando campo: ${campo}`);
        const { data, error } = await supabase
          .from('data')
          .select(campo)
          .limit(3);
        
        if (error) {
          console.log(`   ❌ Error con campo ${campo}:`, error.message);
        } else {
          console.log(`   ✅ Éxito con campo ${campo}`);
          if (data && data.length > 0) {
            console.log(`      Datos:`, data);
          }
        }
      } catch (error) {
        console.log(`   ❌ Excepción con campo ${campo}:`, error.message);
      }
    }
    
    // 2. Obtener la estructura completa de un registro
    console.log('\n2. Obteniendo estructura completa de registros...');
    try {
      const { data, error } = await supabase
        .from('data')
        .select('*')
        .limit(2);
      
      if (error) {
        console.log('   ❌ Error obteniendo estructura:', error.message);
      } else {
        console.log('   ✅ Estructura obtenida exitosamente');
        if (data && data.length > 0) {
          console.log('   Primer registro:', data[0]);
          console.log('   Campos disponibles:', Object.keys(data[0]));
        }
      }
    } catch (error) {
      console.log('   ❌ Excepción obteniendo estructura:', error.message);
    }
    
    // 3. Verificar si hay registros en la tabla
    console.log('\n3. Contando registros en la tabla...');
    try {
      const { count, error } = await supabase
        .from('data')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log('   ❌ Error contando registros:', error.message);
      } else {
        console.log(`   ✅ Total de registros: ${count || 0}`);
      }
    } catch (error) {
      console.log('   ❌ Excepción contando registros:', error.message);
    }
    
    console.log('\n=== Fin de la verificación ===');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar verificación
console.log('Para ejecutar la verificación, escribe: await verificarEstructuraTabla()');