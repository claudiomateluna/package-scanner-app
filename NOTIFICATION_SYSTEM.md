# Sistema de Notificaciones

## Descripción General

El sistema de notificaciones permite informar a los usuarios con roles "Warehouse Operator" y "Warehouse Supervisor" cuando se completa una recepción. Las notificaciones se entregan a través de múltiples canales:

1. Toasts in-app (notificaciones emergentes dentro de la aplicación)
2. Centro de notificaciones accesible desde el sitio
3. Notificaciones push (opcional)

## Características

- **Idempotencia**: Evita notificaciones duplicadas usando una clave de deduplicación
- **Entrega en tiempo real**: Usa canales de Supabase para entregar notificaciones instantáneamente
- **Conteo de no leídas**: Muestra un badge con el número de notificaciones no leídas
- **Historial persistente**: Almacena notificaciones en la base de datos
- **Seguridad**: Implementa Row Level Security (RLS) para proteger los datos

## Componentes

### Backend

1. **notificationService.ts**: Servicio principal para manejar notificaciones
2. **pushNotificationService.ts**: Servicio para notificaciones push (opcional)
3. **Base de datos**: Tablas `notifications`, `notification_reads`, y `push_subscriptions`

### Frontend

1. **NotificationBell.tsx**: Icono de campana con badge de notificaciones no leídas
2. **NotificationCenter.tsx**: Centro de notificaciones con lista paginada
3. **NotificationToast.tsx**: Componente para mostrar toasts in-app
4. **AppLayout.tsx**: Integración de los componentes de notificación en la interfaz

## Flujo de Trabajo

1. Cuando se completa una recepción:
   - Se dispara el evento `RecepcionCompletada`
   - Se construye el payload con los datos requeridos
   - Se verifica idempotencia usando `dedup_key`
   - Se crea la notificación en la base de datos
   - Se identifican los destinatarios (Warehouse Operator, Warehouse Supervisor)
   - Se registran lecturas pendientes para cada destinatario
   - Se envían notificaciones en tiempo real a través de canales de Supabase
   - Se envían notificaciones push a usuarios suscritos (opcional)

2. Cuando un usuario recibe una notificación:
   - Se muestra un toast in-app
   - Se actualiza el badge de notificaciones no leídas
   - La notificación se almacena en el historial

3. Cuando un usuario interactúa con las notificaciones:
   - Puede abrir el centro de notificaciones para ver el historial
   - Puede marcar notificaciones individuales o todas como leídas
   - El badge de notificaciones no leídas se actualiza en tiempo real

## API

### Funciones del Servicio de Notificaciones

#### `createReceptionCompletedNotification(payload)`
Crea una notificación cuando se completa una recepción.

**Parámetros:**
- `payload`: Objeto con los datos de la recepción completada

**Retorna:**
- `Notification`: La notificación creada o existente

#### `getUserNotifications(userId, limit, offset)`
Obtiene las notificaciones para un usuario específico.

**Parámetros:**
- `userId`: ID del usuario
- `limit`: Número máximo de notificaciones a obtener
- `offset`: Desplazamiento para paginación

**Retorna:**
- Objeto con `notifications` y `totalCount`

#### `getUnreadNotificationsCount(userId)`
Obtiene el conteo de notificaciones no leídas para un usuario.

**Parámetros:**
- `userId`: ID del usuario

**Retorna:**
- `number`: Número de notificaciones no leídas

#### `markNotificationAsRead(notificationId, userId)`
Marca una notificación como leída.

**Parámetros:**
- `notificationId`: ID de la notificación
- `userId`: ID del usuario

**Retorna:**
- `boolean`: true si se marcó correctamente

#### `markAllNotificationsAsRead(userId)`
Marca todas las notificaciones como leídas.

**Parámetros:**
- `userId`: ID del usuario

**Retorna:**
- `boolean`: true si se marcaron correctamente

## Seguridad

El sistema implementa las siguientes medidas de seguridad:

1. **Row Level Security (RLS)**: Los usuarios solo pueden acceder a sus propias notificaciones
2. **Verificación de roles**: Solo los usuarios con roles "Warehouse Operator" y "Warehouse Supervisor" reciben notificaciones
3. **Validación server-side**: Todas las operaciones se validan en el servidor
4. **Protección de datos**: Solo se exponen los datos necesarios en las notificaciones

## Configuración

Para habilitar las notificaciones push, es necesario:

1. Configurar las claves VAPID en las variables de entorno:
   ```
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=tu_clave_publica
   VAPID_PRIVATE_KEY=tu_clave_privada
   ```

2. Implementar un service worker para manejar las notificaciones push

## Pruebas

Para probar el sistema de notificaciones, ejecuta:

```bash
node testNotificationSystem.js
```

## Mantenimiento

Las tablas de notificaciones se limpian automáticamente mediante políticas de retención. Se recomienda:

1. Monitorear el rendimiento de las consultas
2. Verificar que las notificaciones se entreguen correctamente
3. Revisar los logs de errores regularmente