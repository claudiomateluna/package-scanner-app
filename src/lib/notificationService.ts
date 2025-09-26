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
    const { data: existing } = await supabase.from('notifications').select('id').eq('dedup_key', dedupKey).single();
    if (existing) return null;

    const title = 'Recepción completada';
    const body = `En ${payload.nombre_local} se completó la recepción DN ${payload.delivery_note} por ${payload.completada_por}.`;

    const { data: notification, error: insertError } = await supabase
      .from('notifications')
      .insert([{ type: 'recepcion_completada', title, body, entity_type: 'recepcion', entity_id: payload.recepcion_id, nombre_local: payload.nombre_local, created_by_user_id: payload.completada_por_id, created_by_user_name: payload.completada_por, dedup_key: dedupKey }])
      .select()
      .single();

    if (insertError) throw insertError;

    const recipientRoles = ['Warehouse Operator', 'Warehouse Supervisor', 'administrador'];
    const recipients = await getUsersByRoles(recipientRoles);
    const readsToInsert = recipients.map(r => ({ notification_id: notification.id, user_id: r.id }));

    if (readsToInsert.length > 0) {
      await supabase.from('notification_reads').insert(readsToInsert);
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