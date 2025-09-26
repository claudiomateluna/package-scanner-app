-- CORRECCIÓN FINAL: Manejo de campos específicos de tabla en el trigger
-- Se añade lógica condicional para `delivery_note`, `olpn` y `tipo_reporte`
-- para evitar errores cuando la tabla de origen (ej. `rechazos`) no tiene esos campos.

CREATE OR REPLACE FUNCTION public.handle_ticket_change_and_notify()
RETURNS TRIGGER AS $$
DECLARE
    notification_type public.notification_type;
    notification_title TEXT;
    notification_body TEXT;
    v_dedup_key TEXT;
    new_notification_id BIGINT;
    ticket_record RECORD;
    entity_type_str TEXT := TG_TABLE_NAME;
    entity_type_enum public.notification_entity_type;
    actor_name TEXT;

BEGIN
    ticket_record := NEW;
    entity_type_enum := REPLACE(TG_TABLE_NAME, 's', '')::public.notification_entity_type;

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

    IF TG_OP = 'INSERT' THEN
        notification_type := (REPLACE(entity_type_str, 's', '') || '_creado')::public.notification_type;
        notification_title := 'Nuevo Ticket de ' || INITCAP(REPLACE(entity_type_str, 's', '')) || ' Creado';
        notification_body := 'El ticket ' || ticket_record.ticket_id || ' ha sido creado en el local ' || ticket_record.nombre_local || ' por ' || actor_name || '.';
        v_dedup_key := entity_type_str || '_creado:' || ticket_record.id;

    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.gestionado IS DISTINCT FROM OLD.gestionado THEN
            notification_type := (REPLACE(entity_type_str, 's', '') || '_estado_cambiado')::public.notification_type;
            notification_title := 'Ticket ' || ticket_record.ticket_id || ' ha sido ' || (CASE WHEN NEW.gestionado THEN 'Gestionado' ELSE 'Marcado como Pendiente' END);
            notification_body := 'El estado del ticket ' || ticket_record.ticket_id || ' del local ' || ticket_record.nombre_local || ' fue cambiado a ' || (CASE WHEN NEW.gestionado THEN 'GESTIONADO' ELSE 'PENDIENTE' END) || ' por ' || actor_name || '.';
            v_dedup_key := entity_type_str || '_estado_cambiado:' || ticket_record.id || ':' || NEW.gestionado::text || ':' || extract(epoch from now())::text;
        ELSE
            notification_type := (REPLACE(entity_type_str, 's', '') || '_actualizado')::public.notification_type;
            notification_title := 'Ticket de ' || INITCAP(REPLACE(entity_type_str, 's', '')) || ' Modificado';
            notification_body := 'El ticket ' || ticket_record.ticket_id || ' del local ' || ticket_record.nombre_local || ' ha sido modificado por ' || actor_name || '.';
            v_dedup_key := entity_type_str || '_actualizado:' || ticket_record.id || ':' || extract(epoch from now())::text;
        END IF;
    END IF;

    IF notification_type IS NULL THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.notifications (
        type, title, body, entity_type, entity_id, ticket_id, nombre_local,
        delivery_note, olpn, tipo_reporte, -- Columnas que pueden variar
        created_by_user_id, created_by_user_name, dedup_key
    )
    VALUES (
        notification_type,
        notification_title,
        notification_body,
        entity_type_enum,
        ticket_record.id,
        ticket_record.ticket_id,
        ticket_record.nombre_local,
        -- Lógica condicional para campos específicos de cada tabla
        CASE WHEN TG_TABLE_NAME = 'faltantes' THEN ticket_record.delivery_note ELSE NULL END,
        CASE WHEN TG_TABLE_NAME = 'faltantes' THEN ticket_record.olpn ELSE NULL END,
        CASE WHEN TG_TABLE_NAME = 'faltantes' THEN ticket_record.tipo_reporte ELSE NULL END,
        auth.uid(),
        actor_name,
        v_dedup_key
    )
    ON CONFLICT (dedup_key) DO NOTHING
    RETURNING id INTO new_notification_id;

    IF new_notification_id IS NULL THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.notification_reads (notification_id, user_id)
    SELECT new_notification_id, p.id
    FROM public.profiles p
    WHERE 
        p.role IN ('administrador', 'Warehouse Supervisor', 'Warehouse Operator')
        OR
        (
            p.role IN ('Store Supervisor', 'Store Operator', 'SKA Operator')
            AND EXISTS (
                SELECT 1
                FROM public.user_locals ul
                WHERE ul.user_id = p.id AND ul.local_name = ticket_record.nombre_local
            )
        )
    ON CONFLICT (notification_id, user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
