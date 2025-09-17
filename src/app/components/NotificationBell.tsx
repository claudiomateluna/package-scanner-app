'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getUnreadNotificationsCount } from '@/lib/notificationService';

interface NotificationBellProps {
  userId: string;
  onNotificationClick: () => void;
}

export default function NotificationBell({ userId, onNotificationClick }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const count = await getUnreadNotificationsCount(userId);
        setUnreadCount(count);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching unread notifications count:', error);
        setLoading(false);
      }
    };

    fetchUnreadCount();

    // Suscribirse a cambios en tiempo real
    const channel = supabase.channel(`notifications-${userId}`)
      .on('broadcast', { event: 'new_notification' }, () => {
        // Incrementar el contador cuando llega una nueva notificación
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();

    // También podemos escuchar cambios en la tabla notification_reads
    const readsChannel = supabase.channel('notification-reads-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notification_reads',
        filter: `user_id=eq.${userId}`
      }, () => {
        // Actualizar el contador cuando se marcan notificaciones como leídas
        fetchUnreadCount();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notification_reads',
        filter: `user_id=eq.${userId}`
      }, () => {
        // Actualizar el contador cuando se insertan nuevas lecturas
        fetchUnreadCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(readsChannel);
    };
  }, [userId]);

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