-- PASO 2: LÓGICA DE BACKEND (FUNCIÓN Y TRIGGERS)

-- 1. CREACIÓN DE LA FUNCIÓN DE TRIGGER
-- Esta función se activa con cada cambio en `faltantes` y `rechazos`.

CREATE OR REPLACE FUNCTION public.handle_ticket_change_and_notify()
RETURNS TRIGGER AS $$
DECLARE
    -- Variables para la notificación
    notification_type public.notification_type;
    notification_title TEXT;
    notification_body TEXT;
    dedup_key TEXT;
    new_notification_id BIGINT;

    -- Variables del ticket (comunes a faltantes y rechazos)
    ticket_record RECORD;
    entity_type_str TEXT := TG_TABLE_NAME; -- 'faltantes' o 'rechazos'
    entity_type_enum public.notification_entity_type;
    actor_name TEXT;

BEGIN
    -- Asignar el registro correcto (NEW para INSERT/UPDATE)
    ticket_record := NEW;
    entity_type_enum := TG_TABLE_NAME::public.notification_entity_type;

    -- Obtener el nombre del usuario que realiza la acción (si está disponible)
    BEGIN
        SELECT raw_user_meta_data->>'first_name' || ' ' || raw_user_meta_data->>'last_name'
        INTO actor_name
        FROM auth.users
        WHERE id = auth.uid();
    EXCEPTION WHEN OTHERS THEN
        actor_name := 'Sistema';
    END;
    IF actor_name IS NULL OR actor_name = ' ' THEN
        actor_name := 'Sistema';
    END IF;

    -- Determinar el tipo de evento y construir la notificación
    IF TG_OP = 'INSERT' THEN
        -- EVENTO: CREACIÓN DE TICKET
        notification_type := (entity_type_str || '_creado')::public.notification_type;
        notification_title := 'Nuevo Ticket de ' || INITCAP(REPLACE(entity_type_str, 's', '')) || ' Creado';
        notification_body := 'El ticket ' || ticket_record.ticket_id || ' ha sido creado en el local ' || ticket_record.nombre_local || ' por ' || actor_name || '.';
        dedup_key := entity_type_str || '_creado:' || ticket_record.id;

    ELSIF TG_OP = 'UPDATE' THEN
        -- EVENTO: ACTUALIZACIÓN DE TICKET
        IF NEW.gestionado IS DISTINCT FROM OLD.gestionado THEN
            -- SUB-EVENTO: CAMBIO DE ESTADO (gestionado/pendiente)
            notification_type := (entity_type_str || '_estado_cambiado')::public.notification_type;
            notification_title := 'Ticket ' || ticket_record.ticket_id || ' ha sido ' || (CASE WHEN NEW.gestionado THEN 'Gestionado' ELSE 'Marcado como Pendiente' END);
            notification_body := 'El estado del ticket ' || ticket_record.ticket_id || ' del local ' || ticket_record.nombre_local || ' fue cambiado a ' || (CASE WHEN NEW.gestionado THEN 'GESTIONADO' ELSE 'PENDIENTE' END) || ' por ' || actor_name || '.';
            dedup_key := entity_type_str || '_estado_cambiado:' || ticket_record.id || ':' || NEW.gestionado::text || ':' || extract(epoch from now())::text;
        ELSE
            -- SUB-EVENTO: MODIFICACIÓN GENERAL
            notification_type := (entity_type_str || '_actualizado')::public.notification_type;
            notification_title := 'Ticket de ' || INITCAP(REPLACE(entity_type_str, 's', '')) || ' Modificado';
            notification_body := 'El ticket ' || ticket_record.ticket_id || ' del local ' || ticket_record.nombre_local || ' ha sido modificado por ' || actor_name || '.';
            dedup_key := entity_type_str || '_actualizado:' || ticket_record.id || ':' || extract(epoch from now())::text;
        END IF;
    END IF;

    -- Si no se pudo determinar un tipo de notificación, salir.
    IF notification_type IS NULL THEN
        RETURN NEW;
    END IF;

    -- Insertar la notificación global (con clave de idempotencia)
    INSERT INTO public.notifications (type, title, body, entity_type, entity_id, ticket_id, nombre_local, delivery_note, olpn, tipo_reporte, created_by_user_id, created_by_user_name, dedup_key)
    VALUES (notification_type, notification_title, notification_body, entity_type_enum, ticket_record.id, ticket_record.ticket_id, ticket_record.nombre_local, ticket_record.delivery_note, ticket_record.olpn, ticket_record.tipo_reporte, auth.uid(), actor_name, dedup_key)
    ON CONFLICT (dedup_key) DO NOTHING
    RETURNING id INTO new_notification_id;

    -- Si la notificación ya existía (dedup_key), no hacer nada más.
    IF new_notification_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Insertar los registros de lectura para los usuarios destinatarios
    INSERT INTO public.notification_reads (notification_id, user_id)
    SELECT new_notification_id, id
    FROM auth.users
    WHERE 
        -- Condición 1: Roles que reciben TODAS las notificaciones
        (raw_user_meta_data->>'role' IN ('administrador', 'Warehouse Supervisor', 'Warehouse Operator'))
        OR
        -- Condición 2: Roles de tienda que reciben notificaciones SOLO de su local
        (
            raw_user_meta_data->>'role' IN ('Store Supervisor', 'Store Operator', 'SKA Operator')
            AND
            -- Asumimos que el local del usuario está en sus metadatos. Ajustar si está en otra tabla (ej. `profiles`).
            raw_user_meta_data->>'nombre_local' = ticket_record.nombre_local
        )
    ON CONFLICT (notification_id, user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. CREACIÓN DE LOS TRIGGERS
-- Asocian la función a los eventos de las tablas.

-- Trigger para la tabla `faltantes`
CREATE TRIGGER on_faltantes_change
    AFTER INSERT OR UPDATE ON public.faltantes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_ticket_change_and_notify();

-- Trigger para la tabla `rechazos`
CREATE TRIGGER on_rechazos_change
    AFTER INSERT OR UPDATE ON public.rechazos
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_ticket_change_and_notify();

