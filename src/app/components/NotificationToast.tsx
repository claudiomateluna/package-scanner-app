'use client'

import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

interface NotificationToastProps {
  userId: string;
}

export default function NotificationToast({ userId }: NotificationToastProps) {
  useEffect(() => {
    // Suscribirse al canal de notificaciones del usuario
    const channel = supabase.channel(`notifications-${userId}`)
      .on('broadcast', { event: 'new_notification' }, (payload) => {
        // Mostrar toast cuando llega una nueva notificación
        const { notification } = payload.payload;
        
        toast.success(
          <div>
            <div style={{ fontWeight: 'bold' }}>{notification.title}</div>
            <div>{notification.body}</div>
          </div>,
          {
            duration: 8000, // Auto-cerrar después de 8 segundos
            icon: '🔔',
          }
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return null; // Este componente no renderiza nada, solo maneja las notificaciones
}