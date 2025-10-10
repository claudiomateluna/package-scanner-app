// src/app/components/SessionTimeoutHandler.tsx
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { SESSION_TIMEOUT_MS, isSessionExpired, setSessionStartTime, clearSessionStartTime, getRemainingSessionTime } from '@/lib/sessionTimeoutUtils';
import toast from 'react-hot-toast';

// Acknowledge unused SESSION_TIMEOUT_MS to prevent ESLint warning
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _SESSION_TIMEOUT_MS = SESSION_TIMEOUT_MS;

interface SessionTimeoutHandlerProps {
  userId: string;
  onSessionTimeout: () => void;
}

export default function SessionTimeoutHandler({ userId, onSessionTimeout }: SessionTimeoutHandlerProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleSessionTimeout = useCallback(async () => {
    try {
      // Clear the timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Clear session start time
      clearSessionStartTime();
      
      // Sign out from Supabase and clear local storage
      await supabase.auth.signOut();
      
      // Clear local storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Show notification to user
      toast('La sesión ha expirado por inactividad. Por favor inicie sesión nuevamente.', { 
        icon: '⏰',
        duration: 5000
      });
      
      // Call the callback to update app state
      onSessionTimeout();
    } catch (error) {
      console.error('Error during session timeout:', error);
      // Clear local storage anyway and redirect
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }
  }, [onSessionTimeout]); // onSessionTimeout is a prop and should be stable
  
  const setupTimeoutCheck = useCallback(() => {
    const remainingTime = isSessionExpired() ? 0 : getRemainingSessionTime();
    
    timeoutRef.current = setTimeout(() => {
      handleSessionTimeout();
    }, remainingTime);
  }, [handleSessionTimeout]); // isSessionExpired and getRemainingSessionTime are imported functions that don't need to be in the deps

  // Check for session timeout on mount
  useEffect(() => {
    // Set session start time if not already set
    if (!localStorage.getItem('session_start_time')) {
      setSessionStartTime();
    }
    
    // Check if session has already expired
    if (isSessionExpired()) {
      handleSessionTimeout();
      return;
    }
    
    // Set up the timeout check
    setupTimeoutCheck();
    
    // Add event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    const resetTimeout = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setupTimeoutCheck();
    };
    
    events.forEach(event => {
      window.addEventListener(event, resetTimeout, true);
    });
    
    return () => {
      // Clear timeout on unmount
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Remove event listeners
      events.forEach(event => {
        window.removeEventListener(event, resetTimeout, true);
      });
    };
  }, [userId, handleSessionTimeout, setupTimeoutCheck]);
  
  // Return null since this is a utility component
  return null;
}