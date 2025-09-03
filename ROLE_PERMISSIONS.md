# Sistema de Permisos y Roles

## Jerarquía de Roles

La aplicación utiliza una jerarquía de roles basada en niveles numéricos donde **números más bajos indican mayor privilegio**:

1. **administrador** (nivel 1) - Máximo privilegio
2. **Warehouse Supervisor** (nivel 2) - Gestiona operaciones de almacén
3. **Warehouse Operator** (nivel 3) - Opera en almacén
4. **Store Supervisor** (nivel 4) - Gestiona operaciones de tienda
5. **Store Operator** (nivel 5) - Opera en tienda

## Permisos por Rol

### administrador (nivel 1)
- **Acceso completo** a todas las funcionalidades
- Puede gestionar todos los usuarios
- Puede asignar cualquier local
- Puede ver y editar todos los datos

### Warehouse Supervisor (nivel 2)
- Puede gestionar usuarios de nivel 3 y 4
- Puede asignar cualquier local
- Puede ver y editar datos de almacén
- Acceso a funciones de administración

### Warehouse Operator (nivel 3)
- Puede operar en almacén
- Puede escanear paquetes
- Puede ver datos de su local asignado
- Acceso limitado a funciones de administración

### Store Supervisor (nivel 4)
- Puede gestionar usuarios de nivel 5
- Puede asignar locales específicos
- Puede ver y editar datos de su local asignado
- **Nuevo**: Acceso a funciones de administración limitadas

### Store Operator (nivel 5)
- Puede operar en tienda
- Puede escanear paquetes
- Puede ver datos de su local asignado
- Acceso muy limitado

## Cambios Recientes

### Acceso a Administración para Store Supervisor
Se ha actualizado el sistema para permitir que los usuarios con rol **Store Supervisor** tengan acceso a las funciones de administración:

1. **Botón de Administración**: Visible en la barra de navegación
2. **Pantalla de Administración**: Acceso completo a funciones de gestión de usuarios
3. **Gestión de Usuarios**: Puede crear, editar y eliminar usuarios de nivel 5 (Store Operator)
4. **Asignación de Locales**: Puede asignar locales a usuarios que gestiona

## Funcionalidades Específicas

### Detección de Dispositivos
- **iPad/iPhone/Android**: Interfaz optimizada para dispositivos móviles
- **Escáner de código de barras**: Utiliza la cámara del dispositivo
- **Selección táctil**: Botones y controles optimizados para touch

### Pantalla de Selección
- Todos los usuarios pueden seleccionar **cualquier local** del sistema
- Selección de fecha flexible
- Sin restricciones basadas en el rol del usuario

### Pantalla de Escaneo
- Muestra datos del **local seleccionado** en la **fecha seleccionada**
- Independiente del local asignado en el perfil del usuario
- Interfaz adaptativa según el dispositivo

### Cuadro Resumen
- **Fecha seleccionada**: Formato DD-MM-YYYY
- **Totales**: DN/Facturas, OLPN/Bultos, Unidades (X / Y)
- **Estado**: "Pendiente" o "Recepción Completada"
- **Visible en todos los dispositivos**

## Seguridad

### Protección contra Intentos Fallidos
- Bloqueo temporal después de 3 intentos fallidos
- Temporizador de 5 minutos de bloqueo
- Persistencia de intentos en localStorage

### Verificación de Permisos
- Validación en frontend y backend
- Chequeo de jerarquía de roles
- Verificación de locales asignados

## Experiencia de Usuario

### Adaptación por Dispositivo
- **Escritorio**: Interfaz completa con todas las funcionalidades
- **Tablet**: Interfaz optimizada con controles táctiles
- **Móvil**: Interfaz simplificada con escáner de cámara

### Feedback Visual
- **Colores del tema**: #233D4D (fondo), #FE7F2D (acentos), #A1C181 (progreso)
- **Indicadores de estado**: Colores que reflejan el progreso
- **Mensajes de error**: Claros y descriptivos en español

## Actualizaciones Recientes

### 1. Corrección de Filtros
- **Antes**: Los filtros dependían del rol del usuario
- **Ahora**: Siempre muestra datos del local seleccionado en la fecha seleccionada

### 2. Acceso Ampliado para Store Supervisor
- **Antes**: Solo Warehouse Supervisor/Operator tenían acceso a administración
- **Ahora**: Store Supervisor también tiene acceso limitado a administración

### 3. Interfaz Responsiva
- **Antes**: Diseño fijo para todos los dispositivos
- **Ahora**: Adaptación automática según el dispositivo

### 4. Mejoras Visuales
- **Cuadro resumen**: Información clara y concisa
- **Indicadores de progreso**: Visualización mejorada
- **Botones táctiles**: Tamaño y espaciado optimizados

Esta documentación refleja la configuración actual del sistema de permisos y roles, asegurando que todos los usuarios tengan la experiencia adecuada según su nivel de acceso y responsabilidades.