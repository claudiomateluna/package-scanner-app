# Historial de Recepciones Completadas

## Descripción
Componente que permite visualizar el historial completo de recepciones completadas con la misma funcionalidad que los componentes de administración de faltantes y rechazos.

## Características
- Vista de tabla con información detallada de recepciones completadas
- Desglose del JSONB `detalles` para mostrar cada OLPN en una fila separada
- Filtros por local, fechas y búsqueda general
- Vista de detalle expandible para cada recepción
- Exportación a CSV
- Contador en tiempo real de notificaciones

## Campos Mostrados
- ID de la recepción
- Local
- Fecha de recepción
- Contadores: OLPN (escaneadas/esperadas), DNs, Unidades
- Unidades faltantes
- Estado de la recepción
- Fecha y hora de completado
- Detalles desglosados (OLPN, DN, unidades, escaneado, faltantes)

## Filtros Disponibles
- Búsqueda por local
- Selección de local específico
- Rango de fechas (desde/hasta)

## Permisos
- Accesible para: administrador, Warehouse Supervisor, Store Supervisor, Warehouse Operator
- Exportación CSV disponible para todos los usuarios con acceso

## Componentes Relacionados
- `ReceptionView.tsx` - Vista combinada con lógica de permisos y funcionalidades
- Integrado en `AppLayout.tsx` y `SlidingMenu.tsx`
- Accesible desde el menú lateral como "Historial Recepciones"

## Funcionalidades
- Filtrado en tiempo real
- Desglose de detalles de recepción
- Expansión de filas para ver más información
- Exportación de datos a CSV
- Contador de elementos en tiempo real