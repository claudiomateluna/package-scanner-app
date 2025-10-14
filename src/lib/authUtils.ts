// src/lib/authUtils.ts

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