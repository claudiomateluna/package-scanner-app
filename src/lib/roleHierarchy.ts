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
  
  // Administrador puede gestionar cualquier rol
  if (userRole === 'administrador') {
    return true;
  }
  
  // Warehouse Supervisor puede gestionar cualquier rol excepto administrador
  if (userRole === 'Warehouse Supervisor' && targetRole !== 'administrador') {
    return rankCheck;
  }
  
  // Store Supervisor puede gestionar usuarios de niveles inferiores (ranks más altos)
  if (userRole === 'Store Supervisor') {
    // Solo puede gestionar roles con rank mayor (nivel inferior) y debe ser en su mismo local
    const localCheck = userLocal !== null && targetLocal !== null && userLocal === targetLocal;
    return rankCheck && targetRank > userRank && localCheck;
  }
  
  // Warehouse Operator puede gestionar Store Supervisor, Store Operator y SKA Operator
  if (userRole === 'Warehouse Operator') {
    const allowedTargetRoles = ['Store Supervisor', 'Store Operator', 'SKA Operator'];
    if (!allowedTargetRoles.includes(targetRole)) {
      return false;
    }
    return rankCheck;
  }
  
  // Para otros roles, verificar jerarquía y local
  // Por defecto, un usuario solo puede gestionar roles de igual o menor rango en su mismo local
  if (userRole === targetRole) {
    // Mismo rol - permitir solo en el mismo local
    return userLocal !== null && targetLocal !== null && userLocal === targetLocal;
  }
  
  // Otros casos de jerarquía - verificar local si está especificado
  if (userLocal !== null && targetLocal !== null) {
    // Ambos locales están definidos - deben coincidir
    return rankCheck && userLocal === targetLocal;
  } else if (userLocal === null && targetLocal === null) {
    // Ambos locales no están definidos - usar solo jerarquía
    return rankCheck;
  }
  
  // Un local está definido y el otro no - no permitido
  return false;
}

// Función para obtener roles que un usuario puede asignar
export function getAssignableRoles(userRole: string): string[] {
  const userRank = roleHierarchy[userRole];
  
  if (userRank === undefined) return [];
  
  // Para Store Supervisor, puede asignar roles de nivel inferior
  if (userRole === 'Store Supervisor') {
    return Object.entries(roleHierarchy)
      .filter(([role, rank]) => {
        // Acknowledge unused role
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _role = role;
        return rank > userRank; // Solo roles con rank mayor (nivel inferior)
      })
      .map(([role, _rank]) => {
        // Acknowledge unused rank variable to prevent ESLint warning
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const __rank = _rank;
        return role;
      });
  }
  
  // Para otros roles, usar la jerarquía normal
  return Object.entries(roleHierarchy)
    .filter(([role, rank]) => {
      // Acknowledge unused role
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _role = role;
      return rank >= userRank;
    })
    .map(([role, _rank]) => {
      // Acknowledge unused rank variable to prevent ESLint warning
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const __rank = _rank;
      return role;
    });
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