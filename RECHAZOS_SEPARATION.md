# Separación de Funcionalidades de Rechazos

## Descripción

Se han implementado cambios para separar las funcionalidades de reporte y administración de rechazos en la aplicación. Ahora existen dos flujos distintos:

1. **Reportar Rechazo**: Accesible para usuarios con roles 'SKA Operator', 'Store Operator', 'Store Supervisor', 'Warehouse Operator' y 'administrador'
2. **Administración de Rechazos**: Accesible solo para usuarios con roles 'Warehouse Operator', 'Warehouse Supervisor' y 'administrador'

## Cambios Realizados

### 1. SlidingMenu.tsx
- Agregado botón "Reportar Rechazo" que aparece solo para usuarios autorizados
- Mantenido botón "Gestión de Rechazos" para administración
- Añadidas nuevas props para manejar la funcionalidad del nuevo botón

### 2. AppLayout.tsx
- Importado componente RechazoForm
- Añadido estado para controlar la visibilidad del formulario de rechazos en modal
- Añadida lógica para verificar permisos de reporte de rechazos
- Implementado renderizado del formulario RechazoForm en un modal cuando se activa desde el menú

### 3. RechazosView.tsx
- Simplificado para mostrar solo la administración de rechazos
- Eliminadas pestañas de ingreso y administración
- Añadida verificación de permisos para acceder a la administración
- Añadido mensaje de acceso denegado para usuarios sin permisos

## Roles y Permisos

### Reportar Rechazo (formulario RechazoForm en modal)
- SKA Operator
- Store Operator
- Store Supervisor
- Warehouse Operator
- administrador

### Administración de Rechazos (RechazosAdminView)
- Warehouse Operator
- Warehouse Supervisor
- administrador

## Implementación Técnica

### Modal para Reportar Rechazo
El formulario RechazoForm se muestra en un modal sobre la interfaz actual cuando el usuario selecciona "Reportar Rechazo" desde el menú. El modal:
- Tiene un fondo semitransparente
- Se centra en la pantalla
- Incluye un botón de cierre (×)
- Se cierra automáticamente al completar el reporte

### Verificación de Permisos
Las verificaciones de permisos se realizan en:
- AppLayout: Para mostrar/ocultar el botón en el menú
- RechazosView: Para controlar el acceso a la administración

## Beneficios

1. **Separación clara de responsabilidades**: Los operadores pueden reportar rechazos sin acceder a la administración
2. **Mejor experiencia de usuario**: Formulario accesible directamente desde el menú en un modal
3. **Seguridad mejorada**: La administración solo es accesible para usuarios autorizados
4. **Interfaz más limpia**: Eliminación de pestañas innecesarias en la vista de rechazos