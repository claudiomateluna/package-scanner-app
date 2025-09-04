// Función para detectar el tipo de dispositivo
export function detectDevice() {
  const userAgent = navigator.userAgent || navigator.vendor || (window as unknown as { opera: string }).opera;
  
  // Detectar iOS (iPhone, iPad, iPod)
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as unknown as { MSStream: boolean }).MSStream) {
    if (/iPad/.test(userAgent)) {
      return 'iPad';
    } else if (/iPhone|iPod/.test(userAgent)) {
      return 'iPhone';
    } else {
      return 'iOS Device';
    }
  }
  
  // Detectar Android
  if (/android/i.test(userAgent)) {
    return 'Android';
  }
  
  // Detectar otros dispositivos
  if (/windows phone/i.test(userAgent)) {
    return 'Windows Phone';
  }
  
  // Detectar桌面设备
  if (/Win|Mac|Linux/.test(userAgent)) {
    return 'Desktop';
  }
  
  return 'Unknown';
}

// Función más específica para detectar tablets
export function isTablet() {
  const userAgent = navigator.userAgent || navigator.vendor || (window as unknown as { opera: string }).opera;
  
  // Detectar iPad
  if (/iPad/.test(userAgent)) {
    return true;
  }
  
  // Detectar Android tablets (más complejo)
  if (/android/i.test(userAgent)) {
    // Verificar si es un dispositivo táctil pero no un móvil típico
    if (!/mobile/i.test(userAgent)) {
      return true;
    }
    
    // Algunas tablets Android se identifican como móviles, verificar por resolución
    if (window.screen.width >= 768) {
      return true;
    }
  }
  
  return false;
}

// Función para detectar móviles
export function isMobile() {
  const userAgent = navigator.userAgent || navigator.vendor || (window as unknown as { opera: string }).opera;
  
  // Detectar iPhone, iPod, Android móvil, etc.
  if (/iPhone|iPod|android.*mobile/i.test(userAgent)) {
    return true;
  }
  
  // Windows Phone
  if (/windows phone/i.test(userAgent)) {
    return true;
  }
  
  return false;
}

// Función para obtener información detallada del dispositivo
export function getDeviceInfo() {
  const userAgent = navigator.userAgent || navigator.vendor || (window as unknown as { opera: string }).opera;
  
  return {
    deviceType: detectDevice(),
    isMobile: isMobile(),
    isTablet: isTablet(),
    userAgent: userAgent,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight
  };
}