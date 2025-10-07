-- Fix for notification enum types by adding missing values
-- This addresses the error where 'recepcion_completada' type and 'recepcion' entity_type 
-- were not defined in the database enums

-- This approach creates a new enum type to replace the existing one with the new values
-- First, we'll create a new type with all the original values plus the new ones

-- We need to follow the correct procedure to add enum values that were missing

-- Add 'recepcion' to the notification_entity_type enum
ALTER TYPE public.notification_entity_type ADD VALUE IF NOT EXISTS 'recepcion';

-- Add 'recepcion_completada' to the notification_type enum
DO $$ 
BEGIN
    BEGIN
        EXECUTE 'ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS ''recepcion_completada''';
    EXCEPTION
        WHEN duplicate_object THEN 
            -- Value already exists, do nothing
            NULL;
    END;
END
$$;