# Verificación de Autenticación de Usuario

## Script para verificar la autenticación actual

```javascript
import { createClient } from '@supabase/supabase-js'

// Configurar el cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Función para verificar el estado de autenticación
async function checkAuthStatus() {
  try {
    // Obtener la sesión actual
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error al obtener la sesión:', error)
      return
    }
    
    if (!session) {
      console.log('No hay sesión activa')
      return
    }
    
    console.log('=== Información de Sesión ===')
    console.log('Usuario ID:', session.user.id)
    console.log('Email:', session.user.email)
    console.log('Proveedor:', session.user.app_metadata.provider)
    console.log('Token expira en:', new Date(session.expires_at * 1000))
    
    // Obtener el perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    if (profileError) {
      console.error('Error al obtener el perfil:', profileError)
      return
    }
    
    console.log('\n=== Información de Perfil ===')
    console.log('Rol:', profile.role)
    console.log('Nombre:', profile.first_name)
    console.log('Apellido:', profile.last_name)
    
    // Obtener los locales asignados
    const { data: userLocals, error: localsError } = await supabase
      .from('user_locals')
      .select('*')
      .eq('user_id', session.user.id)
    
    if (localsError) {
      console.error('Error al obtener locales asignados:', localsError)
      return
    }
    
    console.log('\n=== Locales Asignados ===')
    if (userLocals.length === 0) {
      console.log('No hay locales asignados')
    } else {
      userLocals.forEach(local => {
        console.log('- Local:', local.local_name)
      })
    }
    
    // Verificar permisos
    console.log('\n=== Verificación de Permisos ===')
    const isAdmin = profile.role === 'administrador'
    const isWarehouseSupervisor = profile.role === 'Warehouse Supervisor'
    const isStoreSupervisor = profile.role === 'Store Supervisor'
    
    console.log('Es administrador:', isAdmin)
    console.log('Es Warehouse Supervisor:', isWarehouseSupervisor)
    console.log('Es Store Supervisor:', isStoreSupervisor)
    
    // Prueba de acceso a perfiles
    console.log('\n=== Prueba de Acceso a Perfiles ===')
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .limit(5)
    
    if (allProfilesError) {
      console.error('Error al acceder a perfiles:', allProfilesError.message)
    } else {
      console.log('Acceso a perfiles: OK')
      console.log('Número de perfiles encontrados:', allProfiles.length)
    }
    
  } catch (error) {
    console.error('Error inesperado:', error)
  }
}

// Ejecutar la verificación
checkAuthStatus()
```

## Cómo ejecutar la verificación

1. Guarda el script como `auth-check.js`
2. Asegúrate de tener las variables de entorno configuradas
3. Ejecuta el script con:

```bash
node auth-check.js
```

## Verificación manual desde el navegador

Abre la consola del navegador (F12) y ejecuta:

```javascript
// Verificar sesión actual
const { data: { session } } = await supabase.auth.getSession()
console.log('Sesión:', session)

// Verificar perfil
const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
console.log('Perfil:', profile)

// Verificar locales asignados
const { data: locals } = await supabase.from('user_locals').select('*').eq('user_id', session.user.id)
console.log('Locales asignados:', locals)
```