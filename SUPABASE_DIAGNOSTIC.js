// Script de diagnóstico para verificar la disponibilidad del objeto supabase
// Copia y pega este código en la consola del navegador

console.log('=== Diagnóstico de Supabase ===');

// Verificar si el objeto supabase está definido
if (typeof window !== 'undefined') {
  console.log('Contexto del navegador detectado');
  
  // Verificar si supabase está disponible en window
  if (window.supabase) {
    console.log('✓ Objeto supabase encontrado en window.supabase');
  } else {
    console.log('✗ Objeto supabase NO encontrado en window.supabase');
  }
  
  // Verificar si supabase está disponible en el ámbito global
  try {
    if (typeof supabase !== 'undefined') {
      console.log('✓ Objeto supabase encontrado en el ámbito global');
    } else {
      console.log('✗ Objeto supabase NO encontrado en el ámbito global');
    }
  } catch (e) {
    console.log('✗ Error al verificar supabase en el ámbito global:', e.message);
  }
  
  // Verificar si hay alguna referencia a supabase en el DOM
  const scripts = document.querySelectorAll('script');
  let supabaseInScripts = false;
  scripts.forEach(script => {
    if (script.src && script.src.includes('supabase')) {
      console.log('✓ Script de Supabase encontrado:', script.src);
      supabaseInScripts = true;
    }
  });
  
  if (!supabaseInScripts) {
    console.log('ℹ No se encontraron scripts de Supabase en el DOM');
  }
  
  // Verificar si hay elementos del DOM relacionados con la administración
  const adminButtons = document.querySelectorAll('button');
  console.log(`Se encontraron ${adminButtons.length} botones en la página`);
  
  const deleteButtons = Array.from(adminButtons).filter(button => 
    button.textContent.includes('Eliminar') || button.textContent.includes('Delete')
  );
  console.log(`Se encontraron ${deleteButtons.length} botones de eliminación`);
  
  if (deleteButtons.length > 0) {
    console.log('Primer botón de eliminación:', deleteButtons[0]);
    console.log('Evento onclick del primer botón:', typeof deleteButtons[0].onclick);
    
    // Verificar si tiene event listeners
    if (deleteButtons[0].onclick) {
      console.log('✓ El botón de eliminación tiene un evento onclick asignado');
    } else {
      console.log('ℹ El botón de eliminación no tiene un evento onclick asignado');
    }
  }
  
  // Probar una llamada a la API de diagnóstico
  console.log('\n=== Prueba de API de Diagnóstico ===');
  fetch('/api/diagnostic')
    .then(response => {
      console.log('Respuesta del diagnóstico:', response.status, response.statusText);
      return response.json();
    })
    .then(data => {
      console.log('Datos del diagnóstico:', data);
    })
    .catch(error => {
      console.error('Error en diagnóstico:', error);
    });
} else {
  console.log('No estamos en un contexto de navegador');
}

console.log('\n=== Fin del diagnóstico ===');