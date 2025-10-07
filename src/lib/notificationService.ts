// src/lib/notificationService.ts
import { supabase } from '@/lib/supabaseClient';

// --- Tipos de Datos ---
export interface Notification {
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

// --- LÓGICA EXISTENTE PARA NOTIFICACIONES DE RECEPCIÓN COMPLETADA (SE MANTIENE) ---

async function getUsersByRoles(roles: string[]): Promise<{ id: string }[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .in('role', roles);

  if (error) {
    console.error('Error fetching users by roles:', error);
    return [];
  }
  return data || [];
}

export async function createReceptionCompletedNotification(payload: CompletedReceptionPayload): Promise<Notification | null> {
  try {
    const dedupKey = `recepcion_completada:${payload.recepcion_id}`;
    
    // Check if a notification already exists with this dedup key
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('dedup_key', dedupKey)
      .single();
      
    if (existing) return null;

    const title = 'Recepción completada';
    const body = `En ${payload.nombre_local} se completó la recepción DN ${payload.delivery_note} por ${payload.completada_por}.`;

    // Use the database function to create the notification with proper permissions
    const { data, error } = await supabase
      .rpc('create_recepcion_completada_notification', {
        p_type: 'recepcion_completada',
        p_title: title,
        p_body: body,
        p_entity_type: 'recepcion',
        p_entity_id: parseInt(payload.recepcion_id, 10), // Ensure it's a number
        p_nombre_local: payload.nombre_local,
        p_created_by_user_id: payload.completada_por_id,
        p_created_by_user_name: payload.completada_por,
        p_dedup_key: dedupKey
      });

    if (error) {
      console.error('Error creating notification via RPC:', error);
      return null;
    }

    const notificationId = Array.isArray(data) && data.length > 0 ? data[0] : data;
    
    if (!notificationId) {
      console.warn('Notification was not created (may have been duplicate)');
      return null;
    }

    // If notificationId is null, it means the notification already existed
    if (!notificationId) {
      console.log('Notification already existed (deduplication)');
      return null;
    }

    // Since the database function already handles notification_reads, 
    // we can fetch the complete notification data
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single();

    if (fetchError) {
      console.error('Error fetching created notification:', fetchError);
      return null;
    }

    console.log('Notification for reception completed created:', notification.id);
    return notification as Notification;

  } catch (error) {
    console.error('Error in createReceptionCompletedNotification:', error);
    return null;
  }
}


// --- LÓGICA RESTAURADA Y MEJORADA (LLAMADAS DIRECTAS A SUPABASE) ---

export async function getUserNotifications(userId: string, limit: number = 20, offset: number = 0): Promise<{ notifications: Notification[]; totalCount: number } | null> {
  try {
    const { count: totalCount, error: countError } = await supabase
      .from('notification_reads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (countError) throw countError;

    const { data, error } = await supabase
      .from('notifications')
      .select('*, notification_reads!inner(read_at)')
      .eq('notification_reads.user_id', userId)
      .is('notification_reads.deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return { notifications: data || [], totalCount: totalCount || 0 };

  } catch (error) {
    console.error('Error in getUserNotifications:', error);
    return null;
  }
}

export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('notification_reads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null)
      .is('deleted_at', null);

    if (error) throw error;
    return count || 0;

  } catch (error) {
    console.error('Error in getUnreadNotificationsCount:', error);
    return 0;
  }
}

export async function markNotificationAsRead(notificationId: number, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notification_reads')
      .update({ read_at: new Date().toISOString() })
      .eq('notification_id', notificationId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;

  } catch (error) {
    console.error('Error in markNotificationAsRead:', error);
    return false;
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notification_reads')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null);

    if (error) throw error;
    return true;

  } catch (error) {
    console.error('Error in markAllNotificationsAsRead:', error);
    return false;
  }
}

export async function deleteNotification(notificationId: number, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notification_reads')
      .update({ deleted_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('notification_id', notificationId);

    if (error) throw error;
    return true;

  } catch (error) {
    console.error('Error in deleteNotification:', error);
    return false;
  }
}