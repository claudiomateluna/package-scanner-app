// Script de prueba completo para verificar las correcciones
// Copia y pega este código en la consola del navegador

console.log('=== Script de Prueba Completo ===');

// Función para ejecutar todas las pruebas
async function runAllTests() {
  console.log('\nIniciando todas las pruebas...\n');
  
  // Prueba 1: Verificar sesión
  console.log('1. Probando verificación de sesión...');
  try {
    const sessionResponse = await fetch('/api/session-test', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const sessionData = await sessionResponse.json();
    console.log('   Resultado sesión:', sessionData);
    
    if (sessionData.status === 'success') {
      console.log('   ✅ Sesión verificada correctamente');
    } else {
      console.log('   ❌ Error en verificación de sesión:', sessionData.message);
    }
  } catch (error) {
    console.log('   ❌ Error en verificación de sesión:', error);
  }
  
  // Prueba 2: Diagnóstico completo
  console.log('\n2. Probando diagnóstico completo...');
  try {
    const diagResponse = await fetch('/api/diagnostic', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const diagData = await diagResponse.json();
    console.log('   Resultado diagnóstico:', diagData);
    
    if (diagData.status === 'success') {
      console.log('   ✅ Diagnóstico completado correctamente');
    } else {
      console.log('   ❌ Error en diagnóstico:', diagData.message);
    }
  } catch (error) {
    console.log('   ❌ Error en diagnóstico:', error);
  }
  
  // Prueba 3: Prueba de eliminación (simulación)
  console.log('\n3. Probando llamada de eliminación (simulación)...');
  try {
    const deleteResponse = await fetch('/api/delete-user-test', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: 'test-user-id' })
    });
    
    const deleteData = await deleteResponse.json();
    console.log('   Resultado eliminación (test):', deleteData);
    
    if (deleteData.receivedId) {
      console.log('   ✅ Llamada de eliminación funciona correctamente');
    } else {
      console.log('   ❌ Error en llamada de eliminación');
    }
  } catch (error) {
    console.log('   ❌ Error en llamada de eliminación:', error);
  }
  
  // Prueba 4: Verificar elementos del DOM
  console.log('\n4. Verificando elementos del DOM...');
  const deleteButtons = Array.from(document.querySelectorAll('button')).filter(button => 
    button.textContent.includes('Eliminar') || 
    button.textContent.includes('Delete')
  );
  
  console.log('   Botones de eliminación encontrados:', deleteButtons.length);
  
  if (deleteButtons.length > 0) {
    console.log('   ✅ Se encontraron botones de eliminación');
    deleteButtons.forEach((button, index) => {
      console.log('     Botón #' + (index + 1) + ':', button.textContent.trim());
    });
  } else {
    console.log('   ℹ No se encontraron botones de eliminación');
  }
  
  // Prueba 5: Verificar objeto supabase
  console.log('\n5. Verificando objeto supabase...');
  try {
    if (typeof supabase !== 'undefined') {
      console.log('   ✅ Objeto supabase disponible en el ámbito global');
      console.log('   URL:', supabase?.rest?.url || 'No disponible');
    } else {
      console.log('   ℹ Objeto supabase no encontrado en el ámbito global');
    }
  } catch (e) {
    console.log('   ❌ Error al verificar supabase:', e.message);
  }
  
  console.log('\n=== Todas las pruebas completadas ===');
}

// Función para probar la eliminación real de un usuario (con confirmación)
async function testRealUserDeletion() {
  console.log('\n=== Prueba de Eliminación Real de Usuario ===');
  
  // Primero, obtener la sesión
  console.log('Obteniendo sesión...');
  try {
    const sessionResponse = await fetch('/api/session-test', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const sessionData = await sessionResponse.json();
    
    if (sessionData.status !== 'success') {
      console.log('❌ No se pudo obtener la sesión');
      return;
    }
    
    console.log('✅ Sesión obtenida:', sessionData.session.user.email);
    
    // Solicitar ID de usuario a eliminar
    const userId = prompt('Introduce el ID del usuario a eliminar (o "cancel" para cancelar):');
    
    if (!userId || userId === 'cancel') {
      console.log('❌ Operación cancelada por el usuario');
      return;
    }
    
    // Confirmar eliminación
    const confirmDelete = confirm(`¿Estás seguro de que quieres eliminar al usuario con ID: ${userId}? Esta acción no se puede deshacer.`);
    
    if (!confirmDelete) {
      console.log('❌ Eliminación cancelada por el usuario');
      return;
    }
    
    // Realizar la eliminación
    console.log('Enviando solicitud de eliminación...');
    const deleteResponse = await fetch('/api/delete-user', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: userId })
    });
    
    console.log('Respuesta de eliminación:', deleteResponse.status, deleteResponse.statusText);
    
    if (deleteResponse.ok) {
      const result = await deleteResponse.json();
      console.log('✅ Resultado de eliminación:', result);
    } else {
      const errorData = await deleteResponse.json();
      console.log('❌ Error en eliminación:', errorData);
    }
  } catch (error) {
    console.log('❌ Error en prueba de eliminación:', error);
  }
}

// Exportar funciones para uso manual
window.testUtils = {
  runAllTests: runAllTests,
  testRealUserDeletion: testRealUserDeletion
};

console.log('\n💡 Herramientas disponibles en window.testUtils:');
console.log('   - runAllTests(): Ejecutar todas las pruebas automáticamente');
console.log('   - testRealUserDeletion(): Probar eliminación real de usuario (con confirmaciones)');

console.log('\nPara ejecutar todas las pruebas, escribe:');
console.log('   await window.testUtils.runAllTests()');

console.log('\nPara probar la eliminación real de un usuario, escribe:');
console.log('   await window.testUtils.testRealUserDeletion()');