// src/lib/sessionTimeoutUtils.ts

// Session timeout in milliseconds (4 hours)
export const SESSION_TIMEOUT_MS = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

// Function to get the session start time
export function getSessionStartTime(): Date | null {
  const startTime = localStorage.getItem('session_start_time');
  if (!startTime) return null;
  
  return new Date(startTime);
}

// Function to set the session start time
export function setSessionStartTime(): void {
  localStorage.setItem('session_start_time', new Date().toISOString());
}

// Function to clear session start time
export function clearSessionStartTime(): void {
  localStorage.removeItem('session_start_time');
}

// Function to check if session has expired
export function isSessionExpired(): boolean {
  const startTime = getSessionStartTime();
  if (!startTime) return false; // If no start time, we can't determine if expired
  
  const now = new Date();
  const timeElapsed = now.getTime() - startTime.getTime();
  
  return timeElapsed >= SESSION_TIMEOUT_MS;
}

// Function to get remaining time before session expires
export function getRemainingSessionTime(): number {
  const startTime = getSessionStartTime();
  if (!startTime) return SESSION_TIMEOUT_MS; // Return full timeout if no start time
  
  const now = new Date();
  const timeElapsed = now.getTime() - startTime.getTime();
  const remainingTime = SESSION_TIMEOUT_MS - timeElapsed;
  
  return Math.max(0, remainingTime); // Don't return negative values
}