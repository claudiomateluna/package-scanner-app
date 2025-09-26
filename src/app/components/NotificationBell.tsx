'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Usar el cliente global
import { getUnreadNotificationsCount } from '@/lib/notificationService';
import { Session } from '@supabase/supabase-js';

interface NotificationBellProps {
  userId: string;
  onNotificationClick: () => void;
  session: Session; // Recibir la sesión como prop
}

export default function NotificationBell({ userId, onNotificationClick, session }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }

    const fetchUnreadCount = async () => {
      const count = await getUnreadNotificationsCount(userId);
      setUnreadCount(count);
    };

    // Carga inicial
    setLoading(true);
    fetchUnreadCount().finally(() => setLoading(false));

    // --- Suscripción al canal Realtime (patrón simplificado y estándar) ---
    console.log('Realtime: Attempting to subscribe to channel...');
    const readsChannel = supabase.channel(`notification-reads-changes-for-${userId}`,
      {
        config: {
          accessToken: session.access_token,
        },
      }
    )
      .on('postgres_changes', {
        event: '*', // Escucha INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'notification_reads',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('Realtime: Change received in notification_reads, refetching count...', payload);
        fetchUnreadCount();
      })
      .on('CHANNEL_STATE', (state) => console.log('Realtime: Channel state changed:', state))
      .on('SYSTEM_ERROR', (error) => console.error('Realtime: System error:', error))
      .on('ERROR', (error) => console.error('Realtime: Channel error:', error))
      .subscribe();

    console.log('Realtime: Subscribed to channel:', readsChannel);

    return () => {
      console.log('Realtime: Unsubscribing from channel:', readsChannel);
      supabase.removeChannel(readsChannel);
    };
  }, [userId, session?.access_token]); // session.access_token es una dependencia clave

  if (loading) {
    return (
      <div style={{ position: 'relative', cursor: 'pointer' }} onClick={onNotificationClick}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', cursor: 'pointer' }} onClick={onNotificationClick}>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
      {unreadCount > 0 && (
        <span style={{
          position: 'absolute',
          top: '-8px',
          right: '-8px',
          backgroundColor: '#d9534f',
          color: 'white',
          borderRadius: '50%',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  );
}