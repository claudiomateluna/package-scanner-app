# Ejemplo de Notificaciones Actualizadas

## Vista previa de 3 tipos de notificaciones

### 1. Ticket Creado (faltante_creado o rechazo_creado)

```
🔔
[FALTANTES] [12345]
Ticket Creado
Nuevo ticket de faltante creado para el local...
02/04/2024 10:30
✓ ✖
```

### 2. Ticket Gestionado (faltante_estado_cambiado o rechazo_estado_cambiado con estado gestionado)

```
🔔
[RECHAZO] [12346]
Ticket Gestionado
El ticket ha sido gestionado por el supervisor...
02/04/2024 11:15
✓ ✖
```

### 3. Ticket Estado Cambiado (faltante_estado_cambiado o rechazo_estado_cambiado con otro cambio de estado)

```
🔔
[FALTANTES] [12347]
Ticket Estado Cambiado
El estado del ticket ha sido actualizado...
02/04/2024 12:45
✓ ✖
```

### 4. Ticket Actualizado (faltante_actualizado o rechazo_actualizado)

```
🔔
[RECHAZO] [12348]
Ticket Actualizado
El ticket ha sido modificado con nueva información...
02/04/2024 13:20
✓ ✖
```

## Cambios Implementados

1. **Títulos dinámicos**: Basados en el tipo de notificación real del backend (faltante_creado, rechazo_estado_cambiado, etc.)
2. **Acciones como íconos**: ✓ para marcar como leída, ✖ para eliminar
3. **Diseño más compacto**: Menos espacio vertical por notificación
4. **Paleta de colores consistente**: Usa variables CSS definidas en `globals.css`
5. **Accesibilidad mejorada**: ARIA labels, focus states y semántica apropiada
6. **Estructura reorganizada**: Icono de notificación y botones de acción colocados a la izquierda