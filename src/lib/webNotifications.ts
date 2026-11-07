// ============================================================
// UniCore – Native Desktop & Mobile Web Notifications
// Delivers alerts for incoming direct messages, message requests,
// upvotes, comments, and team announcements.
// ============================================================

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission as NotificationPermissionState;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const perm = await Notification.requestPermission();
    return perm as NotificationPermissionState;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return 'denied';
  }
}

export interface ShowNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
}

/**
 * Triggers a native Desktop or Mobile browser notification.
 * Handles auto-focus and navigation when the researcher clicks the notification.
 */
export function showWebNotification({
  title,
  body,
  icon = '/favicon.ico',
  url,
  tag,
}: ShowNotificationOptions): Notification | null {
  if (!isNotificationSupported()) return null;
  if (Notification.permission !== 'granted') return null;

  try {
    const notif = new Notification(title, {
      body,
      icon,
      tag: tag || 'unicore-alert',
      badge: '/favicon.ico',
    });

    notif.onclick = () => {
      window.focus();
      if (url) {
        window.location.href = url;
      }
      notif.close();
    };

    return notif;
  } catch (err) {
    console.warn('Error displaying web notification:', err);
    return null;
  }
}

