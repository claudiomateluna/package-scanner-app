// src/app/components/AppVersionChecker.tsx
'use client'

import { useEffect } from 'react'
import { needsForcedRefresh, forceAppRefresh } from '@/lib/appInitializer'
import toast from 'react-hot-toast'

export default function AppVersionChecker() {
  useEffect(() => {
    // Verificar si es necesario un refresco forzado
    if (needsForcedRefresh()) {
      toast.loading('Actualizando aplicación...', { duration: 2000 })
      
      // Forzar refresco después de un breve retraso para mostrar el mensaje
      setTimeout(() => {
        forceAppRefresh()
      }, 2000)
    }
    
    // Verificar periódicamente cada hora
    const interval = setInterval(() => {
      if (needsForcedRefresh()) {
        toast.loading('Actualizando aplicación...', { duration: 2000 })
        
        setTimeout(() => {
          forceAppRefresh()
        }, 2000)
      }
    }, 60 * 60 * 1000) // Cada hora
    
    return () => {
      clearInterval(interval)
    }
  }, [])
  
  return null
}