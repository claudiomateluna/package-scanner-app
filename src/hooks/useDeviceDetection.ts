// Hook personalizado para detección de dispositivos en React
'use client'

import { useState, useEffect } from 'react'
import { getDeviceInfo } from '@/lib/deviceDetection'

export function useDeviceDetection() {
  const [deviceInfo, setDeviceInfo] = useState({
    deviceType: 'Unknown',
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isIOS: false,
    isAndroid: false
  })
  
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    try {
      const info = getDeviceInfo()
      
      setDeviceInfo({
        ...info,
        isDesktop: info.deviceType === 'Desktop',
        isIOS: info.deviceType === 'iPhone' || info.deviceType === 'iPad' || info.deviceType === 'iOS Device',
        isAndroid: info.deviceType === 'Android'
      })
      
      setIsLoading(false)
    } catch (error) {
      console.error('Error detecting device:', error)
      setIsLoading(false)
    }
  }, [])
  
  return {
    ...deviceInfo,
    isLoading
  }
}

// Hook específico para detectar si es móvil o tableta
export function useMobileOrTablet() {
  const { isMobile, isTablet } = useDeviceDetection()
  
  return {
    isMobileOrTablet: isMobile || isTablet,
    isMobile,
    isTablet
  }
}

// Hook para obtener información de orientación (útil para tablets)
export function useOrientation() {
  const [orientation, setOrientation] = useState('portrait')
  
  useEffect(() => {
    const updateOrientation = () => {
      if (window.matchMedia('(orientation: landscape)').matches) {
        setOrientation('landscape')
      } else {
        setOrientation('portrait')
      }
    }
    
    // Establecer orientación inicial
    updateOrientation()
    
    // Escuchar cambios de orientación
    window.addEventListener('orientationchange', updateOrientation)
    window.addEventListener('resize', updateOrientation)
    
    // Limpiar event listeners
    return () => {
      window.removeEventListener('orientationchange', updateOrientation)
      window.removeEventListener('resize', updateOrientation)
    }
  }, [])
  
  return orientation
}