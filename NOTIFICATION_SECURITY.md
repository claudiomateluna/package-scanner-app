# Seguridad del Sistema de Notificaciones

## 1. Row Level Security (RLS)

Hemos implementado políticas RLS en todas las tablas de notificaciones para garantizar que los usuarios solo puedan acceder a los datos que les corresponden.

### 1.1 Políticas en la tabla `notifications`

```sql
CREATE POLICY "Usuarios pueden leer sus propias notificaciones"
ON notifications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM notification_reads nr 
    WHERE nr.notification_id = notifications.id 
    AND nr.user_id = auth.uid()
  )
);
```

Esta política garantiza que los usuarios solo puedan leer notificaciones para las que tienen un registro en la tabla `notification_reads`.

### 1.2 Políticas en la tabla `notification_reads`

```sql
-- Política para insertar lecturas de notificaciones
CREATE POLICY "Usuarios pueden registrar lecturas de notificaciones"
ON notification_reads FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Política para actualizar lecturas de notificaciones
CREATE POLICY "Usuarios pueden actualizar sus lecturas de notificaciones"
ON notification_reads FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Política para leer lecturas de notificaciones
CREATE POLICY "Usuarios pueden leer sus lecturas de notificaciones"
ON notification_reads FOR SELECT
TO authenticated
USING (user_id = auth.uid());
```

Estas políticas garantizan que los usuarios solo pueden:
- Insertar registros de lectura para sí mismos
- Actualizar registros de lectura que les pertenecen
- Leer registros de lectura que les pertenecen

### 1.3 Políticas en la tabla `push_subscriptions`

```sql
-- Política para insertar suscripciones push
CREATE POLICY "Usuarios pueden registrar suscripciones push"
ON push_subscriptions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Política para leer suscripciones push
CREATE POLICY "Usuarios pueden leer sus suscripciones push"
ON push_subscriptions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Política para actualizar suscripciones push
CREATE POLICY "Usuarios pueden actualizar sus suscripciones push"
ON push_subscriptions FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

## 2. Verificación de Roles

En el servicio de notificaciones, verificamos los roles de los usuarios antes de enviarles notificaciones:

```typescript
// Obtener usuarios destinatarios (Warehouse Operator y Warehouse Supervisor)
const recipientRoles = ['Warehouse Operator', 'Warehouse Supervisor'];
const recipients = await getUsersByRoles(recipientRoles);
```

Esto garantiza que solo los usuarios con los roles adecuados reciban notificaciones de recepciones completadas.

## 3. Protección de Datos Sensibles

Hemos tomado las siguientes medidas para proteger los datos sensibles:

1. **No exponemos datos innecesarios**: Solo incluimos la información necesaria en las notificaciones
2. **Validación server-side**: Todas las operaciones se validan en el servidor
3. **Uso de RLS**: Las políticas de seguridad se aplican a nivel de base de datos
4. **Autenticación**: Todas las operaciones requieren que el usuario esté autenticado

## 4. Auditoría

Hemos implementado funciones para auditoría:

```sql
-- Función para obtener el conteo de notificaciones no leídas
CREATE OR REPLACE FUNCTION get_unread_notifications_count(user_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
AS $$
  SELECT COUNT(*)
  FROM notifications n
  JOIN notification_reads nr ON n.id = nr.notification_id
  WHERE nr.user_id = get_unread_notifications_count.user_id
  AND nr.read_at IS NULL
$$;

-- Función para marcar notificaciones como leídas
CREATE OR REPLACE FUNCTION mark_notification_as_read(notification_id INTEGER, user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE notification_reads
  SET read_at = NOW()
  WHERE notification_reads.notification_id = mark_notification_as_read.notification_id
  AND notification_reads.user_id = mark_notification_as_read.user_id
  AND read_at IS NULL;
END;
$$;
```

Estas funciones permiten rastrear cuándo se leen las notificaciones, proporcionando una forma básica de auditoría.