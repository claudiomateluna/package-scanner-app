// Script de diagnóstico simple para verificar la estructura de los tickets
// Este script se puede ejecutar desde la consola del navegador

async function diagnosticarTickets() {
  try {
    // Verificar la estructura de las tablas
    console.log('=== DIAGNÓSTICO DE ESTRUCTURA DE TABLAS ===');
    
    // Verificar tabla faltantes
    console.log('\n1. Verificando tabla faltantes...');
    const faltantesResponse = await fetch('/api/diagnostic-faltantes', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (faltantesResponse.ok) {
      const faltantesData = await faltantesResponse.json();
      console.log('Estructura de faltantes:', faltantesData);
    } else {
      console.log('No se pudo acceder a la tabla faltantes');
    }
    
    // Verificar tabla rechazos
    console.log('\n2. Verificando tabla rechazos...');
    const rechazosResponse = await fetch('/api/diagnostic-rechazos', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (rechazosResponse.ok) {
      const rechazosData = await rechazosResponse.json();
      console.log('Estructura de rechazos:', rechazosData);
    } else {
      console.log('No se pudo acceder a la tabla rechazos');
    }
    
  } catch (error) {
    console.error('Error en diagnóstico:', error);
  }
}

// Ejecutar diagnóstico
diagnosticarTickets();