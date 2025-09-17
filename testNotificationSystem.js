// testNotificationSystem.js
// Script para probar el sistema de notificaciones

const { createReceptionCompletedNotification } = require('./src/lib/notificationService');

async function testNotificationSystem() {
  console.log('Testing notification system...');
  
  // Crear una notificación de prueba
  const payload = {
    recepcion_id: 'test-123',
    olpn: 'OLPN-TEST-001',
    delivery_note: 'DN-TEST-001',
    nombre_local: 'Local de Prueba',
    tipo_local: 'Bodega',
    unidades: 100,
    bultos: 10,
    completada_por: 'Usuario de Prueba',
    completada_por_id: 'user-test-123',
    timestamp: new Date().toISOString()
  };
  
  try {
    console.log('Creating notification...');
    const notification = await createReceptionCompletedNotification(payload);
    
    if (notification) {
      console.log('Notification created successfully:');
      console.log('- ID:', notification.id);
      console.log('- Title:', notification.title);
      console.log('- Body:', notification.body);
      console.log('- Created at:', notification.created_at);
    } else {
      console.log('Failed to create notification');
    }
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

// Ejecutar la prueba si el script se ejecuta directamente
if (require.main === module) {
  testNotificationSystem();
}

module.exports = { testNotificationSystem };