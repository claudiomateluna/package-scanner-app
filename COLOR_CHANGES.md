# Aplicación de Colores Globales

Se han realizado los siguientes cambios para aplicar consistentemente las variables de color definidas en `globals.css` a toda la aplicación:

## 1. CustomLogin.module.css
- Actualizado `background-color` del contenedor para usar `var(--color-background)`
- Actualizado `background-color` de la caja de login para usar `rgba(255, 255, 255, 0.75)` en lugar de `#ffffffbe`
- Actualizado `border-color` de la caja de login para usar `var(--color-border)`
- Actualizado `border` del input para usar `var(--color-border)`
- Actualizado `color` del footer para usar `var(--color-text-primary)`

## 2. AppLayout.module.css
- Actualizado `border` del formContainer para usar `var(--color-border-dark)` en lugar de `#555`

## 3. ScannerView.module.css
- Actualizado `background-color` de progressBarContainer para usar `var(--color-background)` en lugar de `#e0e0e0`
- Añadido `border` a progressBarContainer usando `var(--color-border)`

## 4. RechazosAdminView.tsx
- Actualizado color de error para usar `var(--color-error)` en lugar de `red`
- Actualizado estilos en el bloque `<style>` para usar variables CSS
- Actualizado `color` del título para usar `var(--color-text-primary)` en lugar de `#233D4D`
- Actualizado `border` e `input` de búsqueda para usar `var(--color-border)`
- Actualizado `backgroundColor` e `input` de búsqueda para usar `var(--color-card-background)`
- Actualizado `color` e `input` de búsqueda para usar `var(--color-text-primary)`
- Actualizado `backgroundColor` del encabezado de tabla para usar `var(--color-background)`
- Actualizado `color` del encabezado de tabla para usar `var(--color-text-primary)`
- Actualizado `border` del input de filtrado para usar `var(--color-border)`
- Actualizado `backgroundColor` del input de filtrado para usar `var(--color-card-background)`
- Actualizado `color` del input de filtrado para usar `var(--color-text-primary)`
- Actualizado `borderBottom` de las filas para usar `var(--color-border)` en lugar de `#eee`
- Actualizado `backgroundColor` del modal-content para usar `var(--color-card-background)`
- Actualizado estilos de inputs en el modal para usar variables CSS
- Actualizado `backgroundColor` del botón Cancelar para usar `var(--color-text-tertiary)`
- Actualizado `color` del botón Cancelar para usar `var(--color-text-primary)`
- Actualizado `backgroundColor` del botón Guardar para usar `var(--color-success)`
- Actualizado `color` del botón Guardar para usar `var(--color-card-background)`

## 5. FaltantesAdminView.tsx
- Actualizado color de error para usar `var(--color-error)` en lugar de `red`
- Actualizado `backgroundColor` e `input` de búsqueda para usar `var(--color-card-background)`
- Actualizado `color` e `input` de búsqueda para usar `var(--color-text-primary)`
- Actualizado `border` e `input` de búsqueda para usar `var(--color-border)`
- Actualizado `backgroundColor` del encabezado de tabla para usar `var(--color-background)` en lugar de `white`
- Actualizado `border` de los encabezados de tabla para usar `var(--color-border)` en lugar de `#FFF`
- Actualizado `backgroundColor` de los encabezados de tabla para usar `var(--color-accent)` en lugar de `#000`
- Actualizado `color` de los encabezados de tabla para usar `var(--color-card-background)` en lugar de `white`
- Actualizado `backgroundColor` del botón Cargar más para usar `var(--color-accent)`
- Actualizado `color` del botón Cargar más para usar `var(--color-card-background)`
- Actualizado `border` del botón Cargar más para usar `none`
- Actualizado `borderRadius` del botón Cargar más para usar `4px`
- Actualizado `cursor` del botón Cargar más para usar `pointer`
- Actualizado `color` del mensaje "Fin de los resultados" para usar `var(--color-text-tertiary)` en lugar de `#888`
- Actualizado `color` del mensaje "No se encontraron resultados" para usar `var(--color-text-tertiary)` en lugar de `#888`

Estos cambios aseguran que toda la aplicación utilice consistentemente la paleta de colores definida en `globals.css`, lo que facilita el mantenimiento y la personalización del tema de la aplicación.