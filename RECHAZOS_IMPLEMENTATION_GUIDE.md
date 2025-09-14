# Implementación de Gestión de Rechazos

## Archivos Creados

1. **RECHAZOS_TABLE_SCHEMA.sql** - Esquema de la tabla `rechazos` para almacenar reportes de rechazos
2. **TICKET_COUNTERS_RECHAZOS_SCHEMA.sql** - Esquema de la tabla `ticket_counters_rechazos` para manejar contadores incrementales de tickets
3. **src/app/rechazos/page.tsx** - Página principal de rechazos
4. **src/app/components/RechazosView.tsx** - Componente de vista principal con pestañas
5. **src/app/components/RechazoForm.tsx** - Formulario de ingreso de rechazos
6. **src/app/components/RechazosAdminView.tsx** - Panel de administración de rechazos
7. **src/app/api/rechazos/ticket/route.ts** - API para generación de ticket IDs

## Características Implementadas

### 1. Tabla de Rechazos
- Estructura completa con todos los campos requeridos
- Índices para búsquedas rápidas
- Políticas de seguridad RLS para control de acceso
- Soporte para auditoría con usuario e ID
- Generación automática de ticket ID con prefijo REC

### 2. Generación de Ticket ID
- Sistema de contador incremental por prefijo (REC)
- Formato: REC<9 dígitos con ceros a la izquierda>
- Generación automática solo en creación, no en edición

### 3. Formulario de Ingreso
- Precarga automática de fecha, hora y mes
- Selector de locales con búsqueda en vivo
- Autocompletado de tipo_local según nombre_local
- Validación de campos requeridos
- Validación de archivos JPG
- Subida de archivos al storage de Supabase
- Modal de confirmación con ticket ID generado

### 4. Panel de Administración
- Listado completo de rechazos con todas las columnas
- Edición inline de campos administrativos
- Búsqueda en vivo con filtros múltiples
- Visualización de imágenes con lightbox
- Paginación para mejor rendimiento

### 5. Estadísticas
- Botón de acceso desde el panel de administración
- Pendiente de implementación completa

### 6. Navegación y Accesos
- Botón "Gestión de Rechazos" en el menú principal
- Pestañas según permisos de usuario:
  - Ingresar Rechazo: SKA Operator, Store Operator, Store Supervisor, Administrador
  - Administración: Warehouse Operator, Warehouse Supervisor, Administrador
- Botón "Reportar Rechazo" en SelectionScreen

### 7. Seguridad y Permisos
- Validación de roles en frontend y backend
- Campos condicionales según rol del usuario
- Auditoría completa con ID y nombre de usuario
- Políticas RLS para control de acceso a datos

## Flujo de Trabajo

1. Usuario accede a "Gestión de Rechazos" desde el menú
2. Sistema muestra la pestaña adecuada según permisos
3. En "Ingresar Rechazo":
   - Usuario completa el formulario
   - Sistema genera ticket ID automáticamente
   - Usuario guarda el rechazo
   - Sistema muestra modal de confirmación con ticket ID
4. En "Administración":
   - Usuario ve listado de rechazos
   - Puede filtrar y buscar
   - Puede editar campos administrativos
   - Puede ver imágenes en lightbox

## Consideraciones Técnicas

- Compatible con todos los tipos de locales
- Etiquetas de campos cambian según tipo de usuario
- Validación de extensiones de archivo JPG (.jpg / .jpeg)
- Manejo adecuado de errores y estados de carga
- Diseño responsivo para todos los dispositivos
- Uso de Supabase para almacenamiento y autenticación
- Generación de ticket ID en el servidor para garantizar unicidad