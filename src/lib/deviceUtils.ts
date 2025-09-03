// Función para detectar si el dispositivo es móvil o tablet
export function isMobileDevice() {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Detectar iOS
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
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
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  return /iPad/.test(userAgent);
}

// Función para detectar si es un iPhone
export function isIPhone() {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  return /iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
}

// Función para detectar si es Android
export function isAndroid() {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  return /android/i.test(userAgent);
}