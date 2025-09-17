-- Script de migración para el sistema de notificaciones
-- Este script crea las tablas necesarias para el sistema de notificaciones

-- Crear tabla de notificaciones
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

-- Crear tabla de lecturas de notificaciones
CREATE TABLE IF NOT EXISTS notification_reads (
  notification_id INTEGER REFERENCES notifications(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  read_at TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY (notification_id, user_id)
);

-- Crear tabla de suscripciones push (opcional)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  endpoint TEXT NOT NULL,
  p256dh VARCHAR(255) NOT NULL,
  auth VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_nombre_local ON notifications(nombre_local);
CREATE INDEX IF NOT EXISTS idx_notification_reads_user ON notification_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_reads_read_at ON notification_reads(read_at);
CREATE INDEX IF NOT EXISTS idx_notification_reads_notification ON notification_reads(notification_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(user_id) WHERE revoked_at IS NULL;

-- Habilitar RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad

-- Política para permitir a los usuarios leer sus propias notificaciones
CREATE POLICY "Usuarios pueden leer sus propias notificaciones"
ON notifications FOR SELECT
TO authenticated
USING (
  -- Los usuarios pueden ver notificaciones que fueron creadas para ellos
  -- Verificamos si existe una entrada en notification_reads para este usuario y notificación
  EXISTS (
    SELECT 1 
    FROM notification_reads nr 
    WHERE nr.notification_id = notifications.id 
    AND nr.user_id = auth.uid()
  )
);

-- Política para permitir a los usuarios insertar lecturas de notificaciones
CREATE POLICY "Usuarios pueden registrar lecturas de notificaciones"
ON notification_reads FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Política para permitir a los usuarios actualizar lecturas de notificaciones
CREATE POLICY "Usuarios pueden actualizar sus lecturas de notificaciones"
ON notification_reads FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Política para permitir a los usuarios leer sus propias lecturas de notificaciones
CREATE POLICY "Usuarios pueden leer sus lecturas de notificaciones"
ON notification_reads FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Política para permitir a los usuarios insertar suscripciones push
CREATE POLICY "Usuarios pueden registrar suscripciones push"
ON push_subscriptions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Política para permitir a los usuarios leer sus propias suscripciones push
CREATE POLICY "Usuarios pueden leer sus suscripciones push"
ON push_subscriptions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Política para permitir a los usuarios actualizar sus suscripciones push
CREATE POLICY "Usuarios pueden actualizar sus suscripciones push"
ON push_subscriptions FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Crear funciones auxiliares

-- Función para obtener el conteo de notificaciones no leídas por usuario
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

-- Función para marcar una notificación como leída
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

-- Función para marcar todas las notificaciones como leídas
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE notification_reads
  SET read_at = NOW()
  WHERE notification_reads.user_id = mark_all_notifications_as_read.user_id
  AND read_at IS NULL;
END;
$$;