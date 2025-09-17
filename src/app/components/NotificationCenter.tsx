'use client'

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/notificationService';
import styles from './NotificationCenter.module.css';

interface NotificationItem {
  id: number;
  type: string;
  title: string;
  body: string;
  entity_type: string;
  entity_id: string;
  olpn?: string;
  delivery_note?: string;
  nombre_local: string;
  tipo_local?: string;
  unidades?: number;
  bultos?: number;
  created_at: string;
  created_by_user_id?: string;
  created_by_user_name?: string;
  dedup_key: string;
  notification_reads: {
    read_at: string | null;
  }[];
}

interface NotificationCenterProps {
  userId: string;
  onClose: () => void;
}

export default function NotificationCenter({ userId, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 20;

  const fetchNotifications = useCallback(async (pageNum: number = 1) => {
    try {
      setLoading(true);
      const result = await getUserNotifications(userId, limit, (pageNum - 1) * limit);
      
      if (result) {
        setNotifications(result.notifications as NotificationItem[]);
        setTotalCount(result.totalCount);
      }
    } catch (err) {
      setError('Error al cargar las notificaciones');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    fetchNotifications(page);

    // Suscribirse a cambios en tiempo real
    const channel = supabase.channel('notifications-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      }, () => {
        // Verificar si la notificación es para este usuario
        // Esto se manejaría mejor en el backend, pero para simplificar lo hacemos aquí
        fetchNotifications(page);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notification_reads'
      }, () => {
        // Actualizar la lista cuando se marcan notificaciones como leídas
        fetchNotifications(page);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, page, fetchNotifications]);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const success = await markNotificationAsRead(notificationId, userId);
      if (success) {
        // Actualizar la lista de notificaciones
        fetchNotifications(page);
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const success = await markAllNotificationsAsRead(userId);
      if (success) {
        // Actualizar la lista de notificaciones
        fetchNotifications(page);
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className={styles.notificationCenterOverlay} onClick={onClose}>
      <div className={styles.notificationCenter} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Notificaciones</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className={styles.actions}>
          <button onClick={handleMarkAllAsRead} className={styles.markAllButton}>
            Marcar todas como leídas
          </button>
        </div>
        
        {loading && (
          <div className={styles.loading}>
            Cargando notificaciones...
          </div>
        )}
        
        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}
        
        {!loading && !error && (
          <>
            <div className={styles.notificationList}>
              {notifications.length === 0 ? (
                <div className={styles.noNotifications}>
                  No tienes notificaciones
                </div>
              ) : (
                notifications.map((notification) => {
                  const isRead = notification.notification_reads?.[0]?.read_at !== null;
                  return (
                    <div 
                      key={notification.id} 
                      className={`${styles.notificationItem} ${isRead ? styles.read : styles.unread}`}
                    >
                      <div className={styles.notificationHeader}>
                        <h3 className={styles.notificationTitle}>{notification.title}</h3>
                        <span className={styles.notificationTime}>
                          {formatDate(notification.created_at)}
                        </span>
                      </div>
                      <div className={styles.notificationBody}>
                        {notification.body}
                      </div>
                      <div className={styles.notificationFooter}>
                        <div className={styles.notificationMeta}>
                          {notification.nombre_local}
                        </div>
                        {!isRead && (
                          <button 
                            onClick={() => handleMarkAsRead(notification.id)}
                            className={styles.markAsReadButton}
                          >
                            Marcar como leída
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button 
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className={styles.paginationButton}
                >
                  Anterior
                </button>
                <span className={styles.pageInfo}>
                  Página {page} de {totalPages}
                </span>
                <button 
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                  className={styles.paginationButton}
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}