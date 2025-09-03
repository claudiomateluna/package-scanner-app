```javascript
// Script para probar la eliminación de usuarios
// Copia y pega este código en la consola del navegador

async function testUserDeletion() {
  console.log('=== Prueba de Eliminación de Usuario ===');
  
  try {
    // Primero, obtener la sesión actual
    console.log('Obteniendo sesión...');
    const sessionResponse = await fetch('/api/session-test');
    const sessionData = await sessionResponse.json();
    console.log('Datos de sesión:', sessionData);
    
    if (sessionData.status !== 'success') {
      console.error('No se pudo obtener la sesión');
      return;
    }
    
    // Ahora, probar la eliminación
    console.log('\nProbando eliminación...');
    const deleteResponse = await fetch('/api/delete-user-test', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: 'test-user-id' })
    });
    
    console.log('Respuesta de eliminación:', deleteResponse.status, deleteResponse.statusText);
    
    if (deleteResponse.ok) {
      const result = await deleteResponse.json();
      console.log('Resultado:', result);
    } else {
      console.error('Error en eliminación:', deleteResponse.status);
    }
  } catch (error) {
    console.error('Error en prueba:', error);
  }
}

// Para ejecutar la prueba:
// testUserDeletion();

console.log('Para ejecutar la prueba, escribe: testUserDeletion()');
```