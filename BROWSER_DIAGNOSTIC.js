```javascript
// Script de diagnóstico para ejecutar en la consola del navegador
// Copia y pega este código completo en la consola del navegador

console.log('=== Diagnóstico de Autenticación ===');

// Verificar si estamos en el contexto correcto de la aplicación
if (typeof window !== 'undefined') {
  console.log('Contexto de ventana disponible');
  
  // Intentar acceder a la sesión a través de una llamada fetch
  fetch('/api/diagnostic', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('Respuesta del diagnóstico:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('Datos del diagnóstico:', data);
  })
  .catch(error => {
    console.error('Error en diagnóstico:', error);
  });
  
  // Verificar elementos del DOM
  console.log('Elementos de botón de eliminación encontrados:', document.querySelectorAll('button').length);
  
  // Buscar botones con texto "Eliminar"
  const deleteButtons = Array.from(document.querySelectorAll('button')).filter(button => 
    button.textContent.includes('Eliminar')
  );
  console.log('Botones de eliminación:', deleteButtons.length);
  
  if (deleteButtons.length > 0) {
    console.log('Primer botón de eliminación:', deleteButtons[0]);
    console.log('Evento click del primer botón:', deleteButtons[0].onclick);
  }
} else {
  console.log('No estamos en un contexto de ventana');
}

// Función para simular una llamada a la API de eliminación
async function testDeleteApi() {
  console.log('\n=== Prueba de API de Eliminación ===');
  
  try {
    // Primero, obtener la sesión
    const sessionResponse = await fetch('/api/session-test');
    const sessionData = await sessionResponse.json();
    console.log('Datos de sesión:', sessionData);
    
    // Luego, probar la API de eliminación
    const deleteResponse = await fetch('/api/delete-user', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: 'test-id' })
    });
    
    console.log('Respuesta de eliminación:', deleteResponse.status, deleteResponse.statusText);
    
    if (deleteResponse.ok) {
      console.log('Eliminación exitosa');
    } else {
      const errorData = await deleteResponse.json();
      console.log('Error en eliminación:', errorData);
    }
  } catch (error) {
    console.error('Error en prueba de eliminación:', error);
  }
}

// Para ejecutar la prueba:
// testDeleteApi();

console.log('\nPara probar la API de eliminación, ejecuta: testDeleteApi()');
```