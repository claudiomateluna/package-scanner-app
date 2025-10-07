-- Crear función para crear notificaciones de recepción completada
CREATE OR REPLACE FUNCTION create_recepcion_completada_notification(
    p_type TEXT,
    p_title TEXT,
    p_body TEXT,
    p_entity_type TEXT,
    p_entity_id BIGINT,
    p_nombre_local TEXT,
    p_created_by_user_id UUID,
    p_created_by_user_name TEXT,
    p_dedup_key TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER -- Esto permite que la función ejecute con privilegios elevados
AS $$
DECLARE
    new_notification_id INTEGER;
    recipient_id UUID;
BEGIN
    -- Insertar la notificación
    INSERT INTO public.notifications (type, title, body, entity_type, entity_id, nombre_local, created_by_user_id, created_by_user_name, dedup_key)
    VALUES (p_type, p_title, p_body, p_entity_type, p_entity_id, p_nombre_local, p_created_by_user_id, p_created_by_user_name, p_dedup_key)
    ON CONFLICT (dedup_key) DO NOTHING
    RETURNING id INTO new_notification_id;

    -- Si no se insertó (ya existía), salir
    IF new_notification_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Insertar registros de lectura para usuarios con roles específicos
    FOR recipient_id IN
        SELECT id
        FROM auth.users
        WHERE raw_user_meta_data->>'role' IN ('Warehouse Operator', 'Warehouse Supervisor', 'administrador')
    LOOP
        INSERT INTO public.notification_reads (notification_id, user_id)
        VALUES (new_notification_id, recipient_id)
        ON CONFLICT (notification_id, user_id) DO NOTHING;
    END LOOP;

    RETURN new_notification_id;
END;
$$;

-- Dar permisos a la función
GRANT EXECUTE ON FUNCTION create_recepcion_completada_notification TO authenticated;