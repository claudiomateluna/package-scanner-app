import { supabase } from '@/lib/supabaseClient';
import { sendPushNotification } from '@/lib/pushNotificationService';

// Tipos para las notificaciones
export interface Notification {
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
}

export interface NotificationRead {
  notification_id: number;
  user_id: string;
  read_at: string | null;
}

export interface PushSubscription {
  id: number;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
  revoked_at: string | null;
}

// Tipo para el payload del evento de recepción completada
export interface CompletedReceptionPayload {
  recepcion_id: string;
  olpn?: string;
  delivery_note: string;
  nombre_local: string;
  tipo_local?: string;
  unidades?: number;
  bultos?: number;
  completada_por: string;
  completada_por_id: string;
  timestamp: string;
}

// Función para obtener usuarios con roles específicos
async function getUsersByRoles(roles: string[]): Promise<{ id: string; email: string; first_name?: string; last_name?: string }[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name')
    .in('role', roles);

  if (error) {
    console.error('Error fetching users by roles:', error);
    return [];
  }

  return data || [];
}

// Función para crear una notificación de recepción completada
export async function createReceptionCompletedNotification(payload: CompletedReceptionPayload): Promise<Notification | null> {
  try {
    // Calcular la clave de deduplicación
    const dedupKey = `recepcion_completada:${payload.recepcion_id}`;

    // Verificar si ya existe una notificación con esta clave
    const { data: existingNotification, error: existingError } = await supabase
      .from('notifications')
      .select('*')
      .eq('dedup_key', dedupKey)
      .single();

    // Si ya existe, retornarla sin crear una nueva
    if (existingNotification) {
      console.log('Notification already exists for this reception:', existingNotification.id);
      return existingNotification as Notification;
    }

    // Si hubo un error que no sea "no se encontró", lanzar el error
    if (existingError && existingError.code !== 'PGRST116') {
      throw existingError;
    }

    // Construir el contenido de la notificación
    const title = 'Recepción completada';
    const body = `En ${payload.nombre_local} se completó la recepción DN ${payload.delivery_note}${payload.olpn ? ` (OLPN ${payload.olpn})` : ''} por ${payload.completada_por}.`;

    // Crear la notificación
    const { data: notification, error: insertError } = await supabase
      .from('notifications')
      .insert([
        {
          type: 'recepcion_completada',
          title,
          body,
          entity_type: 'recepcion',
          entity_id: payload.recepcion_id,
          olpn: payload.olpn,
          delivery_note: payload.delivery_note,
          nombre_local: payload.nombre_local,
          tipo_local: payload.tipo_local,
          unidades: payload.unidades,
          bultos: payload.bultos,
          created_by_user_id: payload.completada_por_id,
          created_by_user_name: payload.completada_por,
          dedup_key: dedupKey
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating notification:', insertError);
      throw insertError;
    }

    // Obtener usuarios destinatarios (Warehouse Operator y Warehouse Supervisor)
    const recipientRoles = ['Warehouse Operator', 'Warehouse Supervisor'];
    const recipients = await getUsersByRoles(recipientRoles);

    // Crear registros de lectura pendientes para cada destinatario
    const readsToInsert = recipients.map(recipient => ({
      notification_id: notification.id,
      user_id: recipient.id,
      read_at: null
    }));

    if (readsToInsert.length > 0) {
      const { error: readsError } = await supabase
        .from('notification_reads')
        .insert(readsToInsert);

      if (readsError) {
        console.error('Error creating notification reads:', readsError);
        throw readsError;
      }
    }

    // Enviar notificaciones en tiempo real a través de canales de Supabase
    for (const recipient of recipients) {
      const channelName = `notifications-${recipient.id}`;
      
      // Enviar mensaje al canal del usuario
      supabase.channel(channelName).send({
        type: 'broadcast',
        event: 'new_notification',
        payload: {
          notification: {
            id: notification.id,
            type: 'recepcion_completada',
            title,
            body,
            entity_id: payload.recepcion_id,
            created_at: notification.created_at
          }
        }
      });
      
      // Enviar notificación push si el usuario tiene una suscripción activa
      try {
        const { data: pushSubscriptions, error: pushError } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', recipient.id)
          .is('revoked_at', null);
        
        if (pushSubscriptions && pushSubscriptions.length > 0) {
          // Enviar notificación push a cada suscripción activa
          for (const subscription of pushSubscriptions) {
            const pushPayload = {
              title,
              body,
              data: {
                entityId: payload.recepcion_id,
                entityType: 'recepcion',
                url: `/recepciones/${payload.recepcion_id}` // URL para ver detalles
              }
            };
            
            // Enviar la notificación push
            await sendPushNotification(
              {
                endpoint: subscription.endpoint,
                keys: {
                  p256dh: subscription.p256dh,
                  auth: subscription.auth
                }
              },
              pushPayload
            );
          }
        }
      } catch (error) {
        console.error('Error sending push notification:', error);
      }
    }

    return notification as Notification;
  } catch (error) {
    console.error('Error in createReceptionCompletedNotification:', error);
    return null;
  }
}

// Función para obtener notificaciones para un usuario
export async function getUserNotifications(userId: string, limit: number = 20, offset: number = 0): Promise<{ notifications: Notification[]; totalCount: number } | null> {
  try {
    // Primero obtener el conteo total de notificaciones para el usuario
    const { count: totalCount, error: countError } = await supabase
      .from('notification_reads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Si la tabla no existe, retornamos null
    if (countError && countError.message && countError.message.includes('relation') && countError.message.includes('does not exist')) {
      console.warn('La tabla notification_reads no existe aún. Retornando null.');
      return null;
    }

    if (countError) {
      console.error('Error getting notifications count:', countError);
      throw countError;
    }

    // Obtener las notificaciones con información de lectura
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select(`
        *,
        notification_reads!inner(read_at)
      `)
      .eq('notification_reads.user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Si la tabla no existe, retornamos null
    if (error && error.message && error.message.includes('relation') && error.message.includes('does not exist')) {
      console.warn('La tabla notifications no existe aún. Retornando null.');
      return null;
    }

    if (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }

    return {
      notifications: notifications || [],
      totalCount: totalCount || 0
    };
  } catch (error) {
    console.error('Error in getUserNotifications:', error);
    return null;
  }
}

// Función para obtener el conteo de notificaciones no leídas
export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('notification_reads')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .is('read_at', null);

    // Si la tabla no existe, retornamos 0
    if (error && error.message && error.message.includes('relation') && error.message.includes('does not exist')) {
      console.warn('La tabla notification_reads no existe aún. Retornando 0 notificaciones no leídas.');
      return 0;
    }

    if (error) {
      console.error('Error getting unread notifications count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getUnreadNotificationsCount:', error);
    return 0;
  }
}

// Función para marcar una notificación como leída
export async function markNotificationAsRead(notificationId: number, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notification_reads')
      .update({ read_at: new Date().toISOString() })
      .eq('notification_id', notificationId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markNotificationAsRead:', error);
    return false;
  }
}

// Función para marcar todas las notificaciones como leídas
export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notification_reads')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markAllNotificationsAsRead:', error);
    return false;
  }
}

// Función para registrar una suscripción push
export async function registerPushSubscription(
  userId: string,
  subscription: PushSubscriptionData
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .insert([
        {
          user_id: userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        }
      ]);

    if (error) {
      console.error('Error registering push subscription:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in registerPushSubscription:', error);
    return false;
  }
}

// Tipos auxiliares para las suscripciones push
interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}