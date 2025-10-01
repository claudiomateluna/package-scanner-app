'use client'

import { useState, useEffect, useCallback } from 'react';
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '@/lib/notificationService';
import styles from './NotificationCenter.module.css';
import toast from 'react-hot-toast';
import TicketViewer from './TicketViewer';

interface NotificationItem {
  id: number;
  type: string;
  title: string;
  body: string;
  entity_type: string;
  entity_id: string;
  ticket_id?: string;
  nombre_local: string;
  created_at: string;
  created_by_user_name?: string;
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
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
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
    // La lógica de tiempo real ahora está centralizada en NotificationBell.
    // Este componente se actualiza al abrirse o al interactuar con él.
  }, [userId, page, fetchNotifications]);

  const handleMarkAsRead = async (notificationId: number) => {
    const success = await markNotificationAsRead(notificationId, userId);
    if (success) {
      toast.success('Notificación marcada como leída.');
      fetchNotifications(page);
    } else {
      toast.error('No se pudo marcar como leída.');
    }
  };

  const handleDelete = async (notificationId: number) => {
    const success = await deleteNotification(notificationId, userId);
    if (success) {
      toast.success('Notificación eliminada.');
      fetchNotifications(page);
    } else {
      toast.error('No se pudo eliminar la notificación.');
    }
  };

  const handleMarkAllAsRead = async () => {
    const success = await markAllNotificationsAsRead(userId);
    if (success) {
      toast.success('Todas las notificaciones marcadas como leídas.');
      fetchNotifications(page);
    } else {
      toast.error('No se pudieron marcar todas como leídas.');
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
          <button onClick={onClose} className={styles.closeButton}>&times;</button>
        </div>
        
        <div className={styles.actions}>
          <button onClick={handleMarkAllAsRead} className={styles.markAllButton}>
            Marcar todas como leídas
          </button>
        </div>
        
        {loading && <div className={styles.loading}>Cargando...</div>}
        {error && <div className={styles.error}>{error}</div>}
        
        {!loading && !error && (
          <>
            <div className={styles.notificationList}>
              {notifications.length === 0 ? (
                <div className={styles.noNotifications}>No tienes notificaciones</div>
              ) : (
                notifications.map((notification) => {
                  const isRead = notification.notification_reads?.[0]?.read_at !== null;
                  const entityTypeDisplay = notification.entity_type.includes('faltante') ? 'FALTANTES' : 'RECHAZO';

                  return (
                    <div 
                      key={notification.id} 
                      className={`${styles.notificationItem} ${isRead ? styles.read : styles.unread}`}
                      role="listitem"
                      aria-label={`Notificación ${isRead ? 'leída' : 'no leída'}: ${(() => {
                        switch(notification.type) {
                          case 'created':
                            return 'Ticket Creado';
                          case 'managed':
                            return 'Ticket Gestionado';
                          case 'edited':
                            return 'Ticket Editado';
                          case 'pending':
                            return 'Ticket Pendiente';
                          case 'modified':
                            return 'Ticket Modificado';
                          default:
                            return 'Ticket Actualizado';
                        }
                      })()}`}
                    >
                      <div className={styles.notificationRow}>
                        {/* Icon and action buttons on the left */}
                        <div className={styles.notificationIcon}>
                          <svg className={`${styles.bellIcon} ${isRead ? styles.read : styles.unread}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                          </svg>
                          <div className={styles.notificationActions}>
                            {!isRead && (
                              <button 
                                onClick={() => handleMarkAsRead(notification.id)}
                                className={`${styles.actionButton} ${isRead ? styles.read : styles.unread}`}
                                aria-label="Marcar como leída"
                                title="Marcar como leída"
                                role="button"
                                aria-pressed={isRead}
                              >
                                ✓
                              </button>
                            )}
                            <button 
                              onClick={() => handleDelete(notification.id)}
                              className={`${styles.actionButton} ${isRead ? styles.read : styles.unread}`}
                              aria-label="Eliminar notificación"
                              title="Eliminar notificación"
                              role="button"
                            >
                              ✖
                            </button>
                          </div>
                        </div>

                        {/* Notification content on the right */}
                        <div className={styles.notificationContent}>
                          <div className={styles.notificationHeader}>
                            <div className={styles.entityType}>{entityTypeDisplay}</div>
                            <div className={styles.ticketId}>
                              {notification.ticket_id ? (
                                <button 
                                  className={styles.ticketLink}
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent event bubbling
                                    setSelectedTicketId(notification.ticket_id || null);
                                  }}
                                >
                                  {notification.ticket_id}
                                </button>
                              ) : 'N/A'}
                            </div>
                          </div>

                          {/* Simplified title based on notification type */}
                          <div className={`${styles.notificationTitle} ${isRead ? styles.read : styles.unread}`}>
                            {(() => {
                              if (notification.type.includes('_creado')) {
                                return 'Ticket Creado';
                              } else if (notification.type.includes('_estado_cambiado')) {
                                // For estado_cambiado notifications, check if it's now gestionado
                                return notification.body.includes('gestionado') || notification.body.includes('Gestionado') 
                                  ? 'Ticket Gestionado' 
                                  : 'Ticket Estado Cambiado';
                              } else if (notification.type.includes('_actualizado')) {
                                return 'Ticket Actualizado';
                              } else if (notification.type === 'recepcion_completada') {
                                return 'Recepción Completada';
                              } else {
                                // Fallback: try to determine from the body or title
                                if (notification.body.toLowerCase().includes('creado')) {
                                  return 'Ticket Creado';
                                } else if (notification.body.toLowerCase().includes('gestionado')) {
                                  return 'Ticket Gestionado';
                                } else if (notification.body.toLowerCase().includes('pendiente')) {
                                  return 'Ticket Pendiente';
                                } else if (notification.body.toLowerCase().includes('modificado')) {
                                  return 'Ticket Modificado';
                                } else if (notification.body.toLowerCase().includes('editado')) {
                                  return 'Ticket Editado';
                                } else {
                                  return 'Ticket Actualizado'; // Default fallback
                                }
                              }
                            })()}
                          </div>

                          <div className={styles.bodyText}>{notification.body}</div>
                          <div className={styles.timestamp}>{formatDate(notification.created_at)}</div>
                        </div>
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
                <span>Página {page} de {totalPages}</span>
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
      
      {/* Ticket Viewer Modal */}
      {selectedTicketId && (
        <TicketViewer 
          ticketId={selectedTicketId} 
          userId={userId} 
          onClose={() => setSelectedTicketId(null)} 
        />
      )}
    </div>
  );
}
