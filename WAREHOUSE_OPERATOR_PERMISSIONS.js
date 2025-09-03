// Script para verificar qué usuarios puede gestionar un Warehouse Operator
// Copia y pega este código en la consola del navegador

console.log('=== Verificación de Permisos para Warehouse Operator ===');

// Función para simular la verificación de permisos
function checkPermissions() {
  // Jerarquía de roles
  const roleHierarchy = {
    'administrador': 1,
    'Warehouse Supervisor': 2,
    'Warehouse Operator': 3,
    'Store Supervisor': 4,
    'Store Operator': 5
  };

  const warehouseOperatorRole = 'Warehouse Operator';
  const warehouseOperatorRank = roleHierarchy[warehouseOperatorRole];

  console.log('Rol del usuario:', warehouseOperatorRole);
  console.log('Nivel en jerarquía:', warehouseOperatorRank);

  // Verificar qué roles puede gestionar según la función canUserManageRole
  console.log('\n=== Roles que puede gestionar ===');
  Object.keys(roleHierarchy).forEach(targetRole => {
    const targetRank = roleHierarchy[targetRole];
    const rankCheck = warehouseOperatorRank <= targetRank;
    
    // Aplicar la lógica de la función canUserManageRole
    let canManage = false;
    if (warehouseOperatorRole === 'Store Supervisor') {
      canManage = rankCheck && targetRank > warehouseOperatorRank;
    } else {
      canManage = rankCheck;
    }
    
    console.log(`${targetRole}: ${canManage ? '✅ Sí' : '❌ No'}`);
  });

  // Verificar qué roles puede asignar según la función getAssignableRoles
  console.log('\n=== Roles que puede asignar ===');
  const assignableRoles = Object.entries(roleHierarchy)
    .filter(([role, rank]) => rank >= warehouseOperatorRank)
    .map(([role, rank]) => role);
    
  assignableRoles.forEach(role => {
    console.log(`- ${role}`);
  });
}

// Ejecutar la verificación
checkPermissions();

console.log('\n💡 Nota: Los permisos reales también dependen de las políticas de Supabase y la configuración en el backend.');