// Componente de ejemplo completo para detección de dispositivos
'use client'

import { useEffect, useState } from 'react'
import { useDeviceDetection } from '@/hooks/useDeviceDetection'

export default function DeviceAwareComponent() {
  const deviceInfo = useDeviceDetection()
  const [showDetails, setShowDetails] = useState(false)
  
  // Renderizar contenido diferente según el dispositivo
  const renderDeviceOptimizedContent = () => {
    if (deviceInfo.isLoading) {
      return <div>Cargando detección de dispositivo...</div>
    }
    
    if (deviceInfo.isIOS) {
      return (
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#007AFF', 
          color: 'white', 
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <h3>🍎 Experiencia Optimizada para iOS</h3>
          <p>Contenido adaptado para iPhone/iPad</p>
        </div>
      )
    }
    
    if (deviceInfo.isAndroid) {
      return (
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#3DDC84', 
          color: 'white', 
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <h3>🤖 Experiencia Optimizada para Android</h3>
          <p>Contenido adaptado para dispositivos Android</p>
        </div>
      )
    }
    
    if (deviceInfo.isDesktop) {
      return (
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#4285F4', 
          color: 'white', 
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <h3>💻 Experiencia de Escritorio</h3>
          <p>Versión completa para computadoras</p>
        </div>
      )
    }
    
    return (
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#9AA0A6', 
        color: 'white', 
        borderRadius: '10px',
        textAlign: 'center'
      }}>
        <h3>📱 Dispositivo Móvil</h3>
        <p>Contenido adaptado para móviles</p>
      </div>
    )
  }
  
  // Estilos condicionales basados en el dispositivo
  const getConditionalStyles = () => {
    if (deviceInfo.isMobile) {
      return {
        fontSize: '14px',
        padding: '10px'
      }
    }
    
    if (deviceInfo.isTablet) {
      return {
        fontSize: '16px',
        padding: '15px'
      }
    }
    
    return {
      fontSize: '18px',
      padding: '20px'
    }
  }
  
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Detección de Dispositivos</h1>
      
      {renderDeviceOptimizedContent()}
      
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => setShowDetails(!showDetails)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#1877F2',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {showDetails ? 'Ocultar' : 'Mostrar'} Detalles
        </button>
      </div>
      
      {showDetails && !deviceInfo.isLoading && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#f0f2f5', 
          borderRadius: '8px',
          fontFamily: 'monospace'
        }}>
          <h3>Información Detallada:</h3>
          <pre>{JSON.stringify(deviceInfo, null, 2)}</pre>
        </div>
      )}
      
      <div style={{ marginTop: '30px' }}>
        <h2>Contenido Responsivo</h2>
        <div style={getConditionalStyles()}>
          <p>Este contenido se adapta automáticamente según el tipo de dispositivo detectado.</p>
          <p>
            {deviceInfo.isMobile && '📱 Vista optimizada para móviles'}
            {deviceInfo.isTablet && '📱 Vista optimizada para tablets'}
            {deviceInfo.isDesktop && '💻 Vista optimizada para escritorio'}
          </p>
        </div>
      </div>
    </div>
  )
}