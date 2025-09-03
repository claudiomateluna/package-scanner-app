// Ejemplo de cómo usar la detección de dispositivos en un componente React
'use client'

import { useEffect, useState } from 'react'
import { detectDevice, isMobile, isTablet, getDeviceInfo } from '@/lib/deviceDetection'

export default function DeviceDetectionExample() {
  const [deviceInfo, setDeviceInfo] = useState(null)
  
  useEffect(() => {
    // Detectar el dispositivo cuando el componente se monta
    const info = getDeviceInfo()
    setDeviceInfo(info)
    
    console.log('Device Info:', info)
  }, [])
  
  // Función para manejar diferentes experiencias según el dispositivo
  const renderDeviceSpecificContent = () => {
    if (!deviceInfo) return <div>Detectando dispositivo...</div>
    
    switch (deviceInfo.deviceType) {
      case 'iPad':
        return (
          <div>
            <h3>¡Bienvenido desde tu iPad!</h3>
            <p>Optimizamos la experiencia para tabletas.</p>
          </div>
        )
      case 'iPhone':
        return (
          <div>
            <h3>¡Bienvenido desde tu iPhone!</h3>
            <p>Interfaz optimizada para móviles.</p>
          </div>
        )
      case 'Android':
        return (
          <div>
            <h3>¡Bienvenido desde tu dispositivo Android!</h3>
            <p>Experiencia adaptada para Android.</p>
          </div>
        )
      case 'Desktop':
        return (
          <div>
            <h3>¡Bienvenido desde tu computadora!</h3>
            <p>Interfaz completa para escritorio.</p>
          </div>
        )
      default:
        return (
          <div>
            <h3>¡Bienvenido!</h3>
            <p>Dispositivo detectado: {deviceInfo.deviceType}</p>
          </div>
        )
    }
  }
  
  return (
    <div style={{ padding: '20px' }}>
      <h2>Detección de Dispositivo</h2>
      
      {renderDeviceSpecificContent()}
      
      {deviceInfo && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
          <h4>Información Detallada:</h4>
          <p><strong>Tipo de dispositivo:</strong> {deviceInfo.deviceType}</p>
          <p><strong>Es móvil:</strong> {deviceInfo.isMobile ? 'Sí' : 'No'}</p>
          <p><strong>Es tableta:</strong> {deviceInfo.isTablet ? 'Sí' : 'No'}</p>
          <p><strong>Resolución de pantalla:</strong> {deviceInfo.screenWidth} x {deviceInfo.screenHeight}</p>
          <p><strong>Tamaño de ventana:</strong> {deviceInfo.windowWidth} x {deviceInfo.windowHeight}</p>
        </div>
      )}
      
      <div style={{ marginTop: '20px' }}>
        <button onClick={() => console.log(getDeviceInfo())}>
          Actualizar Detección
        </button>
      </div>
    </div>
  )
}