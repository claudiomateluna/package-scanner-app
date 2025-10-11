-- Índices para mejorar el rendimiento de consultas en la base de datos

-- Índice para la tabla 'data' en las columnas Local y Fecha, usadas frecuentemente en consultas
CREATE INDEX IF NOT EXISTS idx_data_local_fecha ON data (Local, Fecha);

-- Índice para la tabla 'recepcion' en las columnas Local y Fecha, usadas frecuentemente en consultas
CREATE INDEX IF NOT EXISTS idx_recepcion_local_fecha ON recepcion (Local, Fecha);

-- Índice para la tabla 'recepcion' en la columna OLPN para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_recepcion_olpn ON recepcion (OLPN);

-- Índice para la tabla 'recepciones_completadas' en las columnas local y fecha_recepcion
CREATE INDEX IF NOT EXISTS idx_recepciones_completadas_local_fecha ON recepciones_completadas (local, fecha_recepcion);

-- Índice para la tabla 'profiles' en la columna role para consultas de autorización
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (role);

-- Índice para la tabla 'user_locals' en la columna user_id para consultas rápidas de locales asignados
CREATE INDEX IF NOT EXISTS idx_user_locals_user_id ON user_locals (user_id);

-- Índice para la tabla 'faltantes' en la columna gestionado para filtrar rápidamente registros
CREATE INDEX IF NOT EXISTS idx_faltantes_gestionado ON faltantes (gestionado);

-- Índice para la tabla 'rechazos' en la columna gestionado para filtrar rápidamente registros
CREATE INDEX IF NOT EXISTS idx_rechazos_gestionado ON rechazos (gestionado);