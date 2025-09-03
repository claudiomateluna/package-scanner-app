// src/lib/authUtils.ts

/**
 * Verifica si un usuario está bloqueado por intentos fallidos
 * @returns true si el usuario está bloqueado, false en caso contrario
 */
export function isUserLocked(): { isLocked: boolean; remainingTime: number } {
  const savedLockTime = localStorage.getItem('lock_time')
  
  if (savedLockTime) {
    const lockTime = parseInt(savedLockTime)
    const currentTime = Date.now()
    
    if (lockTime > currentTime) {
      return {
        isLocked: true,
        remainingTime: lockTime - currentTime
      }
    } else {
      // Bloqueo expirado, limpiar datos
      localStorage.removeItem('login_attempts')
      localStorage.removeItem('lock_time')
    }
  }
  
  return {
    isLocked: false,
    remainingTime: 0
  }
}

/**
 * Incrementa el contador de intentos fallidos de login
 * @returns Número de intentos fallidos actual
 */
export function incrementLoginAttempts(): number {
  const savedAttempts = localStorage.getItem('login_attempts')
  const currentAttempts = savedAttempts ? parseInt(savedAttempts) : 0
  const newAttempts = currentAttempts + 1
  
  localStorage.setItem('login_attempts', newAttempts.toString())
  return newAttempts
}

/**
 * Reinicia el contador de intentos fallidos
 */
export function resetLoginAttempts(): void {
  localStorage.removeItem('login_attempts')
  localStorage.removeItem('lock_time')
}

/**
 * Bloquea al usuario por un tiempo determinado
 * @param minutes Minutos de bloqueo (por defecto 5)
 */
export function lockUser(minutes: number = 5): void {
  const lockTime = Date.now() + minutes * 60 * 1000
  localStorage.setItem('lock_time', lockTime.toString())
}

/**
 * Formatea milisegundos a formato MM:SS
 * @param milliseconds Milisegundos a formatear
 * @returns String en formato MM:SS
 */
export function formatTime(milliseconds: number): string {
  const seconds = Math.ceil(milliseconds / 1000)
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}