# Aplicación de Colores Globales - Segunda Ronda

Se han realizado los siguientes cambios adicionales para aplicar consistentemente las variables de color definidas en `globals.css` a toda la aplicación:

## 1. ToggleSwitch.css
- Actualizado `background-color` del slider para usar `var(--color-text-tertiary)` en lugar de `#ccc`
- Actualizado `background-color` del slider:before para usar `var(--color-card-background)` en lugar de `white`
- Actualizado `background-color` del slider cuando está checked para usar `var(--color-accent)` en lugar de `#2196F3`
- Actualizado `box-shadow` del slider cuando está focused para usar `var(--color-accent)` en lugar de `#2196F3`

## 2. scrollbarStyles.css
- Actualizado `background` del scrollbar-track para usar `var(--color-background)` en lugar de `#ffffff`
- Actualizado `background` del scrollbar-thumb para usar `var(--color-accent)` en lugar de `#000000`
- Actualizado `background` del scrollbar-thumb:hover para usar `var(--color-accent-hover)` en lugar de `#333333`
- Actualizado `scrollbar-color` para usar `var(--color-accent) var(--color-background)` en lugar de `#000000 #ffffff`
- Actualizado estilos específicos para contenedores scroll-container para usar variables CSS

## 3. FaltanteRow.tsx
- Actualizado `border` del tdStyle para usar `var(--color-border)` en lugar de `#000`

## 4. RechazoForm.tsx
- Actualizado `border` de todos los inputs para usar `var(--color-border)` en lugar de `#ccc`
- Actualizado `backgroundColor` de todos los inputs para usar `var(--color-card-background)`
- Actualizado `color` de todos los inputs para usar `var(--color-text-primary)`
- Actualizado `color` del mensaje de error para usar `var(--color-error)` en lugar de `red`
- Actualizado `backgroundColor` del botón de submit para usar `var(--color-accent)` en lugar de `#FE7F2D`
- Actualizado `color` del botón de submit para usar `var(--color-card-background)` en lugar de `white`
- Actualizado `backgroundColor` del botón de cancelar para usar `var(--color-text-tertiary)` en lugar de `#ccc`
- Actualizado `color` del botón de cancelar para usar `var(--color-text-primary)` en lugar de `black`
- Actualizado `border` de la imagen de preview para usar `var(--color-border)` en lugar de `#ccc`

## 5. BarcodeScannerZXing.tsx
- Actualizado `color` del mensaje de error para usar `var(--color-error)` en lugar de `#ef4444`
- Actualizado `color` del mensaje de información para usar `var(--color-text-secondary)` en lugar de `#4b5563`
- Actualizado `color` del título para usar `var(--color-text-primary)` en lugar de `#1f2937`
- Actualizado `border` del canvas para usar `var(--color-accent)` en lugar de `#3b82f6`
- Actualizado `color` del mensaje de información secundario para usar `var(--color-text-tertiary)` en lugar de `#9ca3af`
- Actualizado `border` del contenedor de resultado para usar `var(--color-success)` en lugar de `#10b981`
- Actualizado `backgroundColor` del contenedor de resultado para usar `var(--color-card-background)` en lugar de `#ecfdf5`
- Actualizado `color` del contenedor de resultado para usar `var(--color-text-primary)` en lugar de `#065f46`

## 6. SelectionScreen.tsx
- Actualizado `backgroundColor` del formContainer para usar `var(--color-card-background)` en lugar de `#ffffff`
- Actualizado `border` del formContainer para usar `var(--color-border)` en lugar de `#dddddd`
- Actualizado `color` del título para usar `var(--color-text-primary)` en lugar de `#000000`
- Actualizado `backgroundColor` del botón primario para usar `var(--color-accent)` en lugar de `#000000`
- Actualizado `color` del botón primario para usar `var(--color-card-background)` en lugar de `#ffffff`
- Actualizado `backgroundColor` del input para usar `var(--color-card-background)` en lugar de `#ffffff`
- Actualizado `color` del input para usar `var(--color-text-primary)` en lugar de `#000000`
- Actualizado bordes del input para usar `var(--color-border)` en lugar de `#dddddd`
- Actualizado `color` del label para usar `var(--color-text-primary)` en lugar de `#000000`

Estos cambios aseguran que toda la aplicación utilice consistentemente la paleta de colores definida en `globals.css`, lo que facilita el mantenimiento y la personalización del tema de la aplicación.