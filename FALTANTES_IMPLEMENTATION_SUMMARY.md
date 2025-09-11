# Resumen de Implementación: Reporte de Faltantes/Sobrantes

## Archivos Creados

1. **FALTANTES_TABLE_SCHEMA.sql** - Esquema de la tabla `faltantes` para almacenar reportes de faltantes/sobrantes
2. **TICKET_COUNTERS_SCHEMA.sql** - Esquema de la tabla `ticket_counters` para manejar contadores incrementales de tickets por tipo de local
3. **FALTANTES_IMPLEMENTATION_GUIDE.md** - Guía de implementación completa
4. **src/app/components/MissingReportForm.tsx** - Componente del formulario de reporte de faltantes/sobrantes

## Archivos Modificados

1. **src/app/components/SelectionScreenWithLocales.tsx** - Actualizado para mostrar todos los locales sin filtro para usuarios administradores y warehouse, y solo locales asignados para Store Supervisor/Operator y SKA Operator
2. **src/app/components/ScannerView.tsx** - Reemplazado el input de faltantes con un botón "Reportar Faltante/Sobrante" e integrado el formulario de reporte
3. **ROLE_PERMISSIONS.md** - Actualizado para incluir el rol SKA Operator y sus permisos

## Características Implementadas

### 1. Tabla de Faltantes
- Estructura completa con todos los campos requeridos
- Índices para búsquedas rápidas
- Políticas de seguridad RLS para control de acceso
- Soporte para auditoría con usuario e ID

### 2. Generación de Ticket ID
- Sistema de contador incremental por tipo de local (FRA, RTL, SKA, WHS)
- Formato: <PREFIJO><9 dígitos con ceros a la izquierda>
- Generación automática solo en creación, no en edición

### 3. Formulario de Reporte
- Precarga automática de datos del paquete
- Detección de reportes existentes por OLPN
- Campos condicionales según tipo de local (SKA vs otros)
- Validación de campos requeridos
- Validación de archivos JPG
- Subida de archivos al storage de Supabase

### 4. Pantalla de Selección
- Usuarios administradores y warehouse ven todos los locales
- Usuarios Store Supervisor/Operator y SKA Operator ven solo sus locales asignados
- Eliminado el filtro por tipo de locales para la mayoría de usuarios

### 5. Pantalla de Escaneo
- Reemplazado el input de faltantes con botón "Reportar Faltante/Sobrante"
- Integración completa del formulario de reporte

### 6. Seguridad y Permisos
- SKA Operator solo puede ver y trabajar con locales SKA
- Auditoría completa con ID y nombre de usuario
- Políticas RLS para control de acceso a datos

## Flujo de Trabajo

1. Usuario selecciona local y fecha en SelectionScreen
2. En ScannerView, usuario presiona "Reportar Faltante/Sobrante" en un paquete
3. Sistema verifica si ya existe un reporte para esa OLPN
4. Si existe, carga el formulario en modo edición
5. Si no existe, carga el formulario en modo creación con datos precargados
6. Usuario completa el formulario y lo guarda
7. Sistema genera ticket ID si es nuevo reporte
8. Sistema guarda datos en tabla faltantes con auditoría
9. Sistema sube archivos al storage si se proporcionan

## Consideraciones Técnicas

- Compatible con todos los tipos de locales (FRA, RTL, SKA, WHS)
- Etiquetas de campos cambian según tipo de local
- Validación de extensiones de archivo JPG (.jpg / .jpeg)
- Manejo adecuado de errores y estados de carga
- Diseño responsivo para todos los dispositivos