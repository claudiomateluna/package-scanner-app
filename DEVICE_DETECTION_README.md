# Detección de Dispositivos

Este módulo permite detectar el tipo de dispositivo del usuario (iOS, Android, Desktop, etc.) y adaptar la experiencia de usuario en consecuencia.

## Archivos Incluidos

1. `src/lib/deviceDetection.ts` - Funciones de detección de dispositivos
2. `src/hooks/useDeviceDetection.ts` - Hooks personalizados de React
3. `src/app/components/DeviceAwareComponent.tsx` - Ejemplo de componente que usa la detección

## Cómo Usar

### 1. Funciones de Detección Básica

```typescript
import { detectDevice, isMobile, isTablet, getDeviceInfo } from '@/lib/deviceDetection'

// Detectar tipo de dispositivo
const deviceType = detectDevice() // 'iPad', 'iPhone', 'Android', 'Desktop', etc.

// Verificar si es móvil
const mobile = isMobile() // true/false

// Verificar si es tableta
const tablet = isTablet() // true/false

// Obtener información detallada
const deviceInfo = getDeviceInfo()
console.log(deviceInfo)
```

### 2. Usar Hooks en Componentes React

```typescript
import { useDeviceDetection } from '@/hooks/useDeviceDetection'

export default function MyComponent() {
  const { deviceType, isMobile, isTablet, isIOS, isAndroid, isLoading } = useDeviceDetection()
  
  if (isLoading) {
    return <div>Cargando...</div>
  }
  
  return (
    <div>
      {isIOS && <div>Contenido exclusivo para iOS</div>}
      {isAndroid && <div>Contenido exclusivo para Android</div>}
      {isMobile && <div>Optimizado para móviles</div>}
      {isTablet && <div>Optimizado para tablets</div>}
    </div>
  )
}
```

### 3. Detección de Orientación

```typescript
import { useOrientation } from '@/hooks/useDeviceDetection'

export default function OrientationComponent() {
  const orientation = useOrientation()
  
  return (
    <div className={orientation === 'landscape' ? 'landscape-layout' : 'portrait-layout'}>
      Contenido que se adapta a la orientación
    </div>
  )
}
```

## Tipos de Dispositivos Detectados

- **iPad** - Tablets iPad
- **iPhone** - Dispositivos iPhone
- **Android** - Dispositivos Android (móviles y tablets)
- **Desktop** - Computadoras de escritorio (Windows, Mac, Linux)
- **Windows Phone** - Dispositivos Windows Phone (obsoleto)
- **Unknown** - Dispositivos no reconocidos

## Características

- ✅ Detección precisa de iOS (iPhone/iPad)
- ✅ Detección de dispositivos Android
- ✅ Diferenciación entre móviles y tablets
- ✅ Información detallada de resolución y tamaño de pantalla
- ✅ Hooks personalizados para React
- ✅ Sin dependencias externas
- ✅ Compatible con todos los navegadores modernos

## Consideraciones

1. **User Agent Spoofing**: Algunos navegadores permiten modificar el user agent, lo que puede afectar la detección
2. **Nuevos Dispositivos**: Los nuevos dispositivos pueden no ser detectados inmediatamente
3. **Privacidad**: Algunos usuarios desactivan información del user agent por privacidad

## Mejoras Futuras

- Detección de versiones específicas de iOS/Android
- Detección de marcas específicas (Samsung, Apple, etc.)
- Detección de características de hardware (cámara, GPS, etc.)
- Soporte para Progressive Web Apps (PWA)