# Cómo solucionar el error de notificaciones

## Problema
Estás viendo este error porque las tablas de la base de datos para el sistema de notificaciones no existen aún:

```
Failed to load resource: the server responded with a status of 404 ()
Error getting unread notifications count: {}
```

## Solución

### Opción 1: Aplicar la migración manualmente (Recomendado)

Sigue los pasos en el archivo `manual-migration-steps.md`:

1. **Abre tu dashboard de Supabase**
2. **Ve a la sección SQL Editor**
3. **Copia y pega cada sección del archivo `manual-migration-steps.md` en orden**
4. **Ejecuta cada sección haciendo clic en "RUN"**
5. **Verifica que no haya errores**

### Opción 2: Usar el archivo SQL directamente

1. **Abre tu dashboard de Supabase**
2. **Ve a la sección SQL Editor**
3. **Abre el archivo `DATABASE_MIGRATION_NOTIFICATIONS.sql`**
4. **Copia todo el contenido**
5. **Pégalo en el editor de SQL de Supabase**
6. **Haz clic en "RUN"**

## Mejoras en el código

He realizado mejoras en el código para manejar mejor los casos donde las tablas no existen:

1. **Mejor manejo de errores** en `notificationService.ts` para detectar cuando las tablas no existen
2. **Mensajes de advertencia** en la consola en lugar de errores críticos
3. **Valores por defecto** cuando las tablas no existen

## Verificación

Después de aplicar la migración:

1. **Reinicia tu aplicación** Next.js
2. **Inicia sesión con un usuario válido**
3. **Deberías ver el ícono de notificaciones sin errores en la consola**
4. **Completa una recepción para probar el sistema de notificaciones**

## Notas adicionales

- Si estás en desarrollo, puedes ejecutar `npm run dev` para reiniciar el servidor
- Asegúrate de tener una conexión a internet estable al aplicar la migración
- Si encuentras algún error al aplicar la migración, verifica que tu usuario tenga los permisos adecuados en Supabase