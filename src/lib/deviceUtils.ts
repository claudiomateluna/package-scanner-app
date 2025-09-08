// Función para detectar si el dispositivo es móvil o tablet
export function isMobileDevice() {
  const userAgent = navigator.userAgent || navigator.vendor || (window as unknown as { opera: string }).opera;
  
  // Detectar iOS
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as unknown as { MSStream: boolean }).MSStream) {
    return true;
  }
  
  // Detectar Android
  if (/android/i.test(userAgent)) {
    return true;
  }
  
  // Detectar otros dispositivos móviles
  if (/windows phone/i.test(userAgent)) {
    return true;
  }
  
  return false;
}

// Función para detectar si es un iPad específicamente
export function isIPad() {
  const userAgent = navigator.userAgent || navigator.vendor || (window as unknown as { opera: string }).opera;
  return /iPad/.test(userAgent);
}

// Función para detectar si es un iPhone
export function isIPhone() {
  const userAgent = navigator.userAgent || navigator.vendor || (window as unknown as { opera: string }).opera;
  return /iPhone|iPod/.test(userAgent) && !(window as unknown as { MSStream: boolean }).MSStream;
}

// Función para detectar si es Android
export function isAndroid() {
  const userAgent = navigator.userAgent || navigator.vendor || (window as unknown as { opera: string }).opera;
  return /android/i.test(userAgent);
}

// Función para detectar si es un teléfono móvil (excluyendo tablets)
export function isMobilePhone() {
  const userAgent = navigator.userAgent || navigator.vendor || (window as unknown as { opera: string }).opera;
  
  // Detectar iPhone
  if (/iPhone|iPod/.test(userAgent) && !(window as unknown as { MSStream: boolean }).MSStream) {
    return true;
  }
  
  // Detectar Android phone (no tablet)
  if (/android/i.test(userAgent) && !/tablet|ipad/i.test(userAgent)) {
    // Verificar si es un dispositivo con pantalla pequeña (típicamente teléfono)
    if (window.screen.width <= 720) {
      return true;
    }
  }
  
  // Detectar otros dispositivos móviles
  if (/windows phone/i.test(userAgent)) {
    return true;
  }
  
  return false;
}

// Función para detectar si es una tablet o escritorio (720px de ancho)
export function isTabletOrDesktop() {
  const userAgent = navigator.userAgent || navigator.vendor || (window as unknown as { opera: string }).opera;
  
  // Detectar iPad
  if (/iPad/.test(userAgent)) {
    return true;
  }
  
  // Detectar Android tablet
  if (/android/i.test(userAgent) && /tablet/i.test(userAgent)) {
    return true;
  }
  
  // Detectar escritorio
  if (/Win|Mac|Linux/.test(userAgent)) {
    return true;
  }
  
  // Para otros casos, verificar el ancho de la pantalla
  if (window.screen.width > 720) {
    return true;
  }
  
  return false;
}