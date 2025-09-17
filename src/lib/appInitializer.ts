// src/lib/appInitializer.ts
import { supabase } from '@/lib/supabaseClient'

/**
 * Inicializa la aplicación y limpia estados inconsistentes
 */
export async function initializeApp() {
  try {
    // Verificar si hay una sesión activa
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      // Verificar que la sesión sea válida
      const { data, error } = await supabase.auth.getUser()
      
      if (error || !data?.user) {
        console.warn('Sesión inválida detectada, cerrando sesión...')
        await supabase.auth.signOut()
      }
    }
    
    // Limpiar cualquier estado de loading persistente
    localStorage.removeItem('app_loading_state')
    
    console.log('Aplicación inicializada correctamente')
    return true
  } catch (error) {
    console.error('Error al inicializar la aplicación:', error)
    return false
  }
}

/**
 * Limpia todos los caches y estados de la aplicación
 */
export async function clearAppCache() {
  try {
    // Limpiar caches del navegador
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(name => caches.delete(name)))
    }
    
    // Limpiar localStorage y sessionStorage
    localStorage.clear()
    sessionStorage.clear()
    
    // Limpiar cookies de la aplicación (opcional)
    // document.cookie.split(";").forEach(cookie => {
    //   const eqPos = cookie.indexOf("=");
    //   const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    //   document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    // });
    
    console.log('Caches y estados limpiados correctamente')
    return true
  } catch (error) {
    console.error('Error al limpiar caches:', error)
    return false
  }
}

/**
 * Verifica si la aplicación necesita un refresco forzado
 */
export function needsForcedRefresh(): boolean {
  // Verificar si hay una versión más reciente disponible
  const lastVersion = localStorage.getItem('app_version')
  const currentVersion = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
  
  if (lastVersion && lastVersion !== currentVersion) {
    return true
  }
  
  // Verificar si han pasado más de 24 horas desde el último refresco
  const lastRefresh = localStorage.getItem('last_app_refresh')
  if (lastRefresh) {
    const lastRefreshTime = parseInt(lastRefresh)
    const now = Date.now()
    const oneDay = 24 * 60 * 60 * 1000 // 24 horas en milisegundos
    
    if (now - lastRefreshTime > oneDay) {
      return true
    }
  }
  
  return false
}

/**
 * Refresca la aplicación forzadamente
 */
export function forceAppRefresh() {
  // Guardar timestamp del refresco
  localStorage.setItem('last_app_refresh', Date.now().toString())
  
  // Guardar versión actual
  const currentVersion = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
  localStorage.setItem('app_version', currentVersion)
  
  // Limpiar caches y refrescar
  clearAppCache().then(() => {
    window.location.href = window.location.href + (window.location.href.includes('?') ? '&' : '?') + 'refresh=' + Date.now()
  })
}