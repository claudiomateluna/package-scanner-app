# Solución al problema de "No autorizado" en carga de CSV

## Análisis del problema

Después de una exhaustiva investigación, identificamos que el error "No autorizado" (status 401) ocurre en la primera verificación de sesión:

```typescript
const { data: { session } } = await supabase.auth.getSession()
if (!session) {
  return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
}
```

Esto indica que el problema no está en las políticas RLS ni en las operaciones de base de datos, sino en la **incapacidad de obtener una sesión válida** en la ruta API.

## Posibles causas

1. **Problemas con el manejo de cookies en Next.js App Router**
   - Las rutas API pueden no tener acceso adecuado a las cookies de sesión
   - Las políticas de seguridad de cookies pueden impedir la lectura en ciertos contextos

2. **Problemas con SameSite o Secure en las cookies de Supabase**
   - Esto es especialmente común en entornos de producción o con HTTPS

3. **Desincronización entre el cliente y el servidor en la gestión de sesiones**

## Soluciones recomendadas

### Solución 1: Actualizar la ruta API con manejo mejorado de cookies

Reemplaza el contenido de `src/app/api/upload-data/route.ts` con:

```typescript
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createSupabaseServiceClient } from '@/lib/supabaseServerClient'

export async function POST(request: Request) {
  try {
    const newData = await request.json()
    const cookieStore = cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Verificar la sesión del usuario
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Error getting session:', sessionError)
      return NextResponse.json({ error: 'Error de autenticación' }, { status: 401 })
    }
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado - sesión no válida' }, { status: 401 })
    }

    // Obtener el perfil del usuario para verificar su rol
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json({ error: 'Error al verificar permisos' }, { status: 500 })
    }

    const allowedRoles = ['administrador', 'Warehouse Supervisor', 'Warehouse Operator']
    if (!profile || !profile.role || !allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Permiso denegado. Rol no autorizado.' }, { status: 403 })
    }

    // Realizar la operación de upsert con el cliente de servicio
    const supabaseAdmin = createSupabaseServiceClient()

    const { error: upsertError } = await supabaseAdmin
      .from('data')
      .upsert(newData, { onConflict: 'OLPN' })

    if (upsertError) {
      console.error('Error en Upsert:', upsertError)
      return NextResponse.json({ error: `Error al guardar los datos: ${upsertError.message}` }, { status: 500 })
    }

    return NextResponse.json({ message: 'Datos cargados exitosamente' })
  } catch (error: any) {
    console.error('Error in upload API:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
```

### Solución 2: Revisar la configuración de autenticación en el cliente

Verifica que la autenticación esté correctamente configurada en `src/lib/supabaseClient.ts`. La implementación actual se ve correcta, pero asegúrate de que las variables de entorno estén bien configuradas.

### Solución 3: Probar con un enfoque de autenticación basado en tokens

Si persiste el problema con las cookies, podríamos necesitar usar un enfoque diferente que pase el token como header:

```typescript
// En el frontend (AdminView.tsx), modifica la llamada:
const token = session.access_token; // Obtener el token de sesión
const response = await fetch('/api/upload-data', { 
  method: 'POST', 
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`  // Añadir el token como header
  }, 
  body: JSON.stringify(results.data) 
});
```

Y en la API, usar el token directamente en lugar de obtener la sesión a través de cookies.

## Pasos a seguir

1. Implementa la Solución 1 actualizando la ruta API
2. Prueba la carga de CSV nuevamente
3. Si aún hay problemas, considera implementar la Solución 3 (autenticación por token)