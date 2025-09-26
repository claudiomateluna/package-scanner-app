-- AÑADIR POLÍTICA RLS EXPLÍCITA PARA SELECT EN notification_reads
-- Esto asegura que las suscripciones Realtime puedan leer los datos del usuario.

CREATE POLICY "Allow authenticated users to read their own notification_reads"
ON public.notification_reads FOR SELECT
USING (auth.uid() = user_id);
