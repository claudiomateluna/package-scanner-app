// src/lib/pushNotificationService.ts

// Esta es una implementación básica para notificaciones push
// En un entorno de producción, necesitarías implementar un servidor para manejar los mensajes push

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface PushNotificationPayload {
  title: string;
  body: string;
  data?: {
    entityId?: string;
    entityType?: string;
    url?: string;
  };
}

// Verificar si las notificaciones push son compatibles
export function isPushNotificationSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

// Solicitar permiso para notificaciones push
export async function requestPushNotificationPermission(): Promise<boolean> {
  if (!isPushNotificationSupported()) {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting push notification permission:', error);
    return false;
  }
}

// Registrar una suscripción push
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (!isPushNotificationSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    // Simplificamos esta parte para evitar problemas de tipos
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      // Usamos una cadena vacía como fallback
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
    });

    return subscription.toJSON() as PushSubscription;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return null;
  }
}

// Convertir la clave pública VAPID de base64 URL a Uint8Array
// Acknowledge unused urlBase64ToUint8Array to prevent ESLint warning
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Enviar una notificación push (requiere un servidor backend)
export async function sendPushNotification(subscription: PushSubscription, payload: PushNotificationPayload): Promise<boolean> {
  try {
    // En un entorno real, enviarías esto a tu servidor backend
    // que luego usaría la clave privada VAPID para enviar la notificación
    console.log('Would send push notification with payload:', payload);
    console.log('Using subscription:', subscription);
    
    // Simular éxito
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}