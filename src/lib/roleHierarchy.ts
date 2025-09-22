// Definir la jerarquía de roles (número más bajo = mayor privilegio)
export const roleHierarchy: { [key: string]: number } = {
  'administrador': 1,
  'Warehouse Supervisor': 2,
  'Warehouse Operator': 3,
  'Store Supervisor': 4,
  'Store Operator': 5,
  'SKA Operator': 6
};

// Función para verificar si un usuario puede editar/eliminar a otro usuario
export function canUserManageRole(userRole: string, targetRole: string, userLocal: string | null, targetLocal: string | null): boolean {
  const userRank = roleHierarchy[userRole];
  const targetRank = roleHierarchy[targetRole];
  
  // Si el rol del usuario no está definido, no puede gestionar a nadie
  if (userRank === undefined) return false;
  
  // Si el rol del objetivo no está definido, no se puede gestionar
  if (targetRank === undefined) return false;
  
  // Verificar la jerarquía de roles
  const rankCheck = userRank <= targetRank;
  
  // Para Store Supervisor, puede gestionar usuarios de niveles inferiores (ranks más altos)
  if (userRole === 'Store Supervisor') {
    return rankCheck && targetRank > userRank; // Solo puede gestionar roles con rank mayor (nivel inferior)
  }
  
  // Para otros roles, solo verificar la jerarquía
  return rankCheck;
}

// Función para obtener roles que un usuario puede asignar
export function getAssignableRoles(userRole: string): string[] {
  const userRank = roleHierarchy[userRole];
  
  if (userRank === undefined) return [];
  
  // Para Store Supervisor, puede asignar roles de nivel inferior
  if (userRole === 'Store Supervisor') {
    return Object.entries(roleHierarchy)
      .filter(([role, rank]) => rank > userRank) // Solo roles con rank mayor (nivel inferior)
      .map(([role, rank]) => role);
  }
  
  // Para otros roles, usar la jerarquía normal
  return Object.entries(roleHierarchy)
    .filter(([role, rank]) => rank >= userRank)
    .map(([role, rank]) => role);
}

// Función para verificar si un usuario puede asignar un local específico
export function canUserAssignLocal(userRole: string, userLocal: string | null, targetLocal: string | null): boolean {
  // Administrador y Warehouse Supervisor pueden asignar cualquier local
  if (userRole === 'administrador' || userRole === 'Warehouse Supervisor') {
    return true;
  }
  
  // Store Supervisor puede asignar sus propios locales
  if (userRole === 'Store Supervisor') {
    return userLocal !== null && targetLocal !== null && userLocal === targetLocal;
  }
  
  // Otros roles no pueden asignar locales
  return false;
}