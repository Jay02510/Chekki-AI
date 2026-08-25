import { useEffect, useMemo, useState } from 'react';
import * as Sentry from '@sentry/react';
import { collection, doc, limit as fbLimit, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { dbInstance } from '../services/database';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  meta?: Record<string, unknown>;
}

// Live-subscribes to a user's own notifications subcollection (server-written
// only, see api/_lib/notifications.ts) so a bell icon can show unread count
// without polling. Scoped to directors today — see NotificationBell usage.
export function useNotifications(uid: string | null | undefined) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!uid) {
      setNotifications([]);
      return;
    }
    let cancelled = false;
    let retried = false;
    let unsubscribe: (() => void) | undefined;

    const attach = () => {
      const q = query(
        collection(dbInstance, 'users', uid, 'notifications'),
        orderBy('createdAt', 'desc'),
        fbLimit(20)
      );
      unsubscribe = onSnapshot(
        q,
        (snap) => {
          if (cancelled) return;
          setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification)));
        },
        (err) => {
          // Same transient-permission-denied-right-after-signup race
          // StudentInvitePanel and TeacherPage.fetchClasses already retry
          // once for (firestore.rules re-reads the caller's own user doc on
          // every attach; that read can momentarily deny before a brand-new
          // session settles) — this listener had no retry, so every fresh
          // login reported a spurious permission error to Sentry.
          if (err?.code === 'permission-denied' && !retried) {
            retried = true;
            unsubscribe?.();
            setTimeout(() => {
              if (!cancelled) attach();
            }, 1500);
            return;
          }
          console.warn('[useNotifications] listener failed', err);
          Sentry.captureException(err, { tags: { area: 'useNotifications' }, extra: { uid } });
        }
      );
    };
    attach();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [uid]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const markRead = async (notificationId: string) => {
    if (!uid) return;
    try {
      await updateDoc(doc(dbInstance, 'users', uid, 'notifications', notificationId), { read: true });
    } catch (err) {
      console.warn('[useNotifications] markRead failed', err);
    }
  };

  const markAllRead = async () => {
    if (!uid) return;
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(unread.map((n) => markRead(n.id)));
  };

  return { notifications, unreadCount, markRead, markAllRead };
}
