// Script de diagnóstico avanzado para la aplicación de gestión de usuarios
// Copia y pega este código completo en la consola del navegador

console.log('=== Diagnóstico Avanzado de la Aplicación ===');

// Verificar contexto del navegador
if (typeof window === 'undefined') {
  console.log('❌ Este script debe ejecutarse en un navegador');
  return;
}

console.log('✅ Contexto del navegador detectado');

// Verificar objetos globales importantes
console.log('\n=== Verificación de Objetos Globales ===');

// Verificar si el objeto supabase está disponible
try {
  if (typeof supabase !== 'undefined') {
    console.log('✅ Objeto supabase encontrado en el ámbito global');
    console.log('   URL:', supabase?.rest?.url || 'No disponible');
  } else {
    console.log('ℹ Objeto supabase no encontrado en el ámbito global');
  }
} catch (e) {
  console.log('❌ Error al verificar supabase en el ámbito global:', e.message);
}

// Verificar si hay una instancia de Supabase en window
if (window.supabase) {
  console.log('✅ Objeto supabase encontrado en window.supabase');
} else {
  console.log('ℹ Objeto supabase no encontrado en window.supabase');
}

// Verificar elementos del DOM
console.log('\n=== Análisis del DOM ===');
const allButtons = document.querySelectorAll('button');
console.log(`Se encontraron ${allButtons.length} botones en total`);

// Buscar botones de eliminación específicos
const deleteButtons = Array.from(allButtons).filter(button => 
  button.textContent.includes('Eliminar') || 
  button.textContent.includes('Delete') ||
  button.innerText.includes('Eliminar') ||
  button.innerText.includes('Delete')
);

console.log(`Se encontraron ${deleteButtons.length} botones de eliminación`);

if (deleteButtons.length > 0) {
  deleteButtons.forEach((button, index) => {
    console.log(`\nBotón de eliminación #${index + 1}:`);
    console.log('  Texto:', button.textContent.trim());
    console.log('  Clases:', button.className);
    console.log('  ID:', button.id || 'No tiene ID');
    console.log('  Tiene onclick:', !!button.onclick);
    console.log('  Event listeners:', getEventListeners ? 'Sí (usa getEventListeners(button) para ver)' : 'No disponible');
  });
} else {
  console.log('ℹ No se encontraron botones con texto "Eliminar" o "Delete"');
}

// Verificar la estructura de la tabla de usuarios
console.log('\n=== Análisis de la Tabla de Usuarios ===');
const userRows = document.querySelectorAll('div[style*="border"]'); // Buscar divs con bordes (estilo de tarjetas de usuario)
console.log(`Se encontraron ${userRows.length} posibles filas de usuarios`);

// Buscar elementos con información de usuario
const emailElements = document.querySelectorAll('*:not(script):not(style):not(link):not(meta):not(title)');
const emails = Array.from(emailElements)
  .filter(el => {
    const text = el.textContent || el.innerText || '';
    return text.includes('@') && text.includes('.') && !text.includes(' ') && text.length > 5;
  })
  .map(el => el.textContent || el.innerText)
  .filter(text => text.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)); // Filtrar solo emails válidos

console.log(`Se encontraron ${emails.length} posibles direcciones de email`);
if (emails.length > 0) {
  console.log('  Emails encontrados:', [...new Set(emails)].slice(0, 5)); // Mostrar máximo 5 emails únicos
}

// Probar conexión con la API
console.log('\n=== Pruebas de Conexión con la API ===');

// Prueba 1: Diagnóstico básico
console.log('1. Probando diagnóstico básico...');
fetch('/api/diagnostic', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('   Respuesta diagnóstico:', response.status, response.statusText);
  return response.json();
})
.then(data => {
  console.log('   Datos diagnóstico:', data);
})
.catch(error => {
  console.log('   Error diagnóstico:', error);
});

// Prueba 2: Verificar sesión
console.log('2. Probando verificación de sesión...');
fetch('/api/session-test', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('   Respuesta sesión:', response.status, response.statusText);
  return response.json();
})
.then(data => {
  console.log('   Datos sesión:', data);
})
.catch(error => {
  console.log('   Error sesión:', error);
});

// Prueba 3: Simular llamada de eliminación (sin eliminar realmente)
console.log('3. Probando llamada de eliminación (simulación)...');
fetch('/api/delete-user-test', {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ id: 'test-id' })
})
.then(response => {
  console.log('   Respuesta eliminación (test):', response.status, response.statusText);
  return response.json();
})
.then(data => {
  console.log('   Datos eliminación (test):', data);
})
.catch(error => {
  console.log('   Error eliminación (test):', error);
});

console.log('\n=== Diagnóstico completado ===');
console.log('Para obtener más información, puedes ejecutar manualmente:');
console.log('- getEventListeners(element) en un botón de eliminación (en Chrome)');
console.log('- Verificar la consola para errores adicionales');

// Función auxiliar para verificar si un elemento tiene event listeners (solo en Chrome)
function checkEventListeners(element) {
  if (typeof getEventListeners === 'function') {
    const listeners = getEventListeners(element);
    console.log('Event listeners encontrados:', Object.keys(listeners));
    return listeners;
  } else {
    console.log('getEventListeners no está disponible en este navegador');
    return null;
  }
}

// Exportar funciones útiles para uso manual
window.diagnosticUtils = {
  checkEventListeners: checkEventListeners,
  findDeleteButtons: () => deleteButtons
};

console.log('\n💡 Herramientas disponibles en window.diagnosticUtils:');
console.log('   - checkEventListeners(element): Verificar event listeners de un elemento');
console.log('   - findDeleteButtons(): Encontrar todos los botones de eliminación');