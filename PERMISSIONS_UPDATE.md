# Actualización de Permisos de Usuario

## Cambios Realizados

### 1. Jerarquía de Roles
La jerarquía de roles permanece igual:
1. **administrador** (nivel 1) - Mayor privilegio
2. **Warehouse Supervisor** (nivel 2)
3. **Warehouse Operator** (nivel 3)
4. **Store Supervisor** (nivel 4)
5. **Store Operator** (nivel 5) - Menor privilegio

### 2. Cambios en la Función `canUserManageRole`
Se modificó la función para permitir que los Store Supervisors gestionen usuarios de niveles inferiores:

```typescript
// Para Store Supervisor, puede gestionar usuarios de niveles inferiores (ranks más altos)
if (userRole === 'Store Supervisor') {
  return rankCheck && targetRank > userRank; // Solo puede gestionar roles con rank mayor (nivel inferior)
}
```

### 3. Cambios en la Función `getAssignableRoles`
Se actualizó para permitir que los Store Supervisors asignen roles de nivel inferior:

```typescript
// Para Store Supervisor, puede asignar roles de nivel inferior
if (userRole === 'Store Supervisor') {
  return Object.entries(roleHierarchy)
    .filter(([role, rank]) => rank > userRank) // Solo roles con rank mayor (nivel inferior)
    .map(([role, rank]) => role);
}
```

### 4. Cambios en Permisos de Eliminación
Se actualizó la lógica de permisos para permitir que los Store Supervisors eliminen usuarios:

```typescript
const canDeleteUsers = userRole === 'administrador' || userRole === 'Warehouse Supervisor' || userRole === 'Store Supervisor';
```

## Nuevos Permisos

### Store Supervisor
- **Puede crear usuarios**: Solo puede crear usuarios de nivel inferior (Store Operators)
- **Puede editar usuarios**: Solo puede editar usuarios de nivel inferior (Store Operators)
- **Puede eliminar usuarios**: Solo puede eliminar usuarios de nivel inferior (Store Operators)
- **Puede cambiar su propia contraseña**: Sí (ya estaba implementado)
- **Puede asignar locales**: Solo puede asignar sus propios locales a Store Operators

### Todos los Usuarios
- **Pueden cambiar su propia contraseña**: Sí, a través del formulario en el encabezado de la aplicación

## Verificación de los Cambios

Para verificar que los cambios funcionan correctamente:

1. Inicie sesión con una cuenta de Store Supervisor
2. Vaya a la sección de administración
3. Verifique que pueda:
   - Crear nuevos Store Operators
   - Editar Store Operators existentes
   - Eliminar Store Operators existentes
   - Cambiar su propia contraseña

4. Verifique que NO pueda:
   - Crear, editar o eliminar usuarios de nivel superior
   - Gestionar usuarios que no sean Store Operators