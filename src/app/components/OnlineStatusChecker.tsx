// src/app/components/OnlineStatusChecker.tsx
'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

export default function OnlineStatusChecker() {
  const [isOnline, setIsOnline] = useState(true)
  const [showOfflineMessage, setShowOfflineMessage] = useState(false)

  useEffect(() => {
    // Verificar el estado de conexión al cargar
    setIsOnline(navigator.onLine)
    
    // Escuchar cambios en la conexión
    const handleOnline = () => {
      setIsOnline(true)
      toast.success('Conexión restablecida')
      setShowOfflineMessage(false)
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      setShowOfflineMessage(true)
      
      // Mostrar mensaje de error después de 3 segundos
      setTimeout(() => {
        toast.error('Sin conexión a internet. La aplicación funciona en modo limitado.')
      }, 3000)
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Verificar periódicamente la conexión
    const connectionChecker = setInterval(() => {
      // Hacer una pequeña petición para verificar la conexión
      fetch('/favicon.ico', { 
        method: 'HEAD', 
        cache: 'no-cache',
        mode: 'no-cors'
      }).catch(() => {
        if (navigator.onLine) {
          // Si el navegador dice que está en línea pero la petición falla,
          // podría ser un problema de conexión
          setIsOnline(false)
          setShowOfflineMessage(true)
        }
      })
    }, 30000) // Verificar cada 30 segundos
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(connectionChecker)
    }
  }, [])

  if (!isOnline && showOfflineMessage) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#e63946',
        color: 'white',
        padding: '10px',
        textAlign: 'center',
        zIndex: 9999,
        fontSize: '14px'
      }}>
        Sin conexión a internet. Algunas funciones pueden no estar disponibles.
      </div>
    )
  }
  
  return null
}