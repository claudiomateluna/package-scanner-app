# Sistema de Notificaciones - Diseño Técnico

## 1. Descripción General

El sistema de notificaciones tiene como objetivo informar a los usuarios con roles "Warehouse Operator" y "Warehouse Supervisor" cuando se complete una recepción. Las notificaciones se entregarán a través de múltiples canales:
- Toasts in-app (usando react-hot-toast)
- Centro de notificaciones accesible desde el sitio
- Notificaciones push (opcional)

## 2. Arquitectura del Sistema

### 2.1 Componentes Principales

1. **Modelo de Datos**: Tablas en Supabase para persistir notificaciones
2. **Backend Service**: Lógica para crear y distribuir notificaciones
3. **Frontend Components**: 
   - Toast notifications
   - Icono de notificación con badge
   - Centro de notificaciones
4. **Real-time Delivery**: Uso de canales de Supabase para entrega inmediata

### 2.2 Flujo de Datos

1. Cuando se completa una recepción:
   - Se dispara un evento `RecepcionCompletada`
   - Se construye el payload con los datos requeridos
   - Se verifica idempotencia usando `dedup_key`
   - Se crea la notificación en la base de datos
   - Se identifican los destinatarios (Warehouse Operator, Warehouse Supervisor)
   - Se registran lecturas pendientes para cada destinatario
   - Se envían notificaciones en tiempo real a través de canales de Supabase
   - Se envían notificaciones push a usuarios suscritos (opcional)

## 3. Modelo de Datos

### 3.1 Tabla `notifications`

```sql
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL, -- 'recepcion_completada'
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- 'recepcion'
  entity_id VARCHAR(255) NOT NULL, -- recepcion_id
  olpn VARCHAR(255), -- nullable
  delivery_note VARCHAR(255), -- nullable
  nombre_local VARCHAR(255) NOT NULL,
  tipo_local VARCHAR(50),
  unidades INTEGER, -- nullable
  bultos INTEGER, -- nullable
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by_user_id UUID REFERENCES auth.users(id),
  created_by_user_name VARCHAR(255),
  dedup_key VARCHAR(255) UNIQUE NOT NULL -- 'recepcion_completada:{recepcion_id}'
);
```

### 3.2 Tabla `notification_reads`

```sql
CREATE TABLE IF NOT EXISTS notification_reads (
  notification_id INTEGER REFERENCES notifications(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  read_at TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY (notification_id, user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notification_reads_user ON notification_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_reads_read_at ON notification_reads(read_at);
```

### 3.3 Tabla `push_subscriptions` (opcional)

```sql
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  endpoint TEXT NOT NULL,
  p256dh VARCHAR(255) NOT NULL,
  auth VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(user_id) WHERE revoked_at IS NULL;
```

## 4. Backend Implementation

### 4.1 Servicio de Notificaciones

Crear un servicio en `/src/lib/notificationService.ts` que maneje:
- Creación de notificaciones
- Distribución a destinatarios
- Verificación de idempotencia
- Envío de notificaciones en tiempo real

### 4.2 Integración con Recepción Completada

Modificar la función `handleReceptionCompleted` en `ScannerView.tsx` para:
- Llamar al servicio de notificaciones después de guardar la recepción
- Pasar el payload requerido

## 5. Frontend Implementation

### 5.1 Componentes

1. **NotificationBell**: Icono con badge en la barra superior
2. **NotificationCenter**: Centro de notificaciones con lista paginada
3. **NotificationToast**: Componente para toasts in-app

### 5.2 Estado Global

Usar contexto de React o estado local en AppLayout para:
- Contar notificaciones no leídas
- Manejar apertura/cierre del centro de notificaciones
- Marcar notificaciones como leídas

## 6. Entrega en Tiempo Real

### 6.1 Canales de Supabase

Crear un canal por usuario para recibir notificaciones:
- Canal nombrado: `notifications-{user_id}`
- Escuchar eventos de inserción en `notifications`

### 6.2 Actualización de UI

- Actualizar badge de notificaciones no leídas en tiempo real
- Mostrar toasts cuando llegan nuevas notificaciones
- Actualizar lista en el centro de notificaciones

## 7. Seguridad

### 7.1 Políticas RLS

- Usuarios solo pueden leer sus propias notificaciones
- Usuarios solo pueden marcar como leídas sus propias notificaciones
- Solo usuarios autorizados pueden crear notificaciones

### 7.2 Validación de Permisos

- Verificar roles al entregar notificaciones
- Validar acceso al detalle de recepciones

## 8. Internacionalización

- Textos en español
- Fechas formateadas en es-CL (DD-MM-YYYY HH:mm)