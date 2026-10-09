'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { notificationApi, BackendNotification } from '@/lib/scn-api';
import { authApi } from '@/lib/scn-api';
import { lastChangedAt, upsertNotification } from '@/lib/notification-utils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

// "Clear" is client-side only (backend has no per-user dismiss state).
const CLEARED_AT_KEY = 'notifications-cleared-at';

function getClearedAt(): number {
  if (typeof window === 'undefined') return 0;
  const parsed = Number(localStorage.getItem(CLEARED_AT_KEY) || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

// Hidden only if cleared AND not edited since — an edit brings it back.
function filterCleared(list: BackendNotification[]): BackendNotification[] {
  const clearedAt = getClearedAt();
  if (!clearedAt) return list;
  return list.filter((n) => lastChangedAt(n) > clearedAt);
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<BackendNotification[]>([]);
  // ids that are new OR just edited since the bell was last opened
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const [connected, setConnected] = useState(false);

  const probingAuthRef = useRef(false);
  const openedOnceRef = useRef(false);

  const refreshHistory = useCallback(async () => {
    try {
      const data = await notificationApi.list();
      setNotifications(filterCleared(Array.isArray(data) ? data : []));
    } catch {
      // 401 is handled globally by the axios interceptor.
    }
  }, []);

  const markAllRead = useCallback(() => setFreshIds(new Set()), []);

  const clearNotifications = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CLEARED_AT_KEY, String(Date.now()));
    }
    setNotifications([]);
    setFreshIds(new Set());
  }, []);

  useEffect(() => {
    refreshHistory();

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
    if (!token) return;

    const es = new EventSource(`${API_BASE}/notifications/stream?token=${encodeURIComponent(token)}`);

    es.onopen = () => {
      setConnected(true);
      probingAuthRef.current = false;
      // After a dropped connection we may have missed edits/deletes.
      if (openedOnceRef.current) refreshHistory();
      openedOnceRef.current = true;
    };

    const onUpsert = (event: Event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data) as BackendNotification;
        setNotifications((prev) => upsertNotification(prev, data).slice(0, 50));
        setFreshIds((prev) => new Set(prev).add(data.id));
      } catch {
        // ignore malformed frame
      }
    };
    es.addEventListener('notification', onUpsert); // new
    es.addEventListener('notification-updated', onUpsert); // edited

    // Deleted, or audience changed so it's no longer for this user.
    es.addEventListener('notification-deleted', (event) => {
      try {
        const { id } = JSON.parse((event as MessageEvent).data) as { id: string };
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        setFreshIds((prev) => {
          if (!prev.has(id)) return prev;
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } catch {
        // ignore
      }
    });

    es.onerror = () => {
      setConnected(false);
      // EventSource hides status codes: probe once so a bad token logs
      // the user out instead of retrying forever.
      if (!probingAuthRef.current) {
        probingAuthRef.current = true;
        authApi.me().finally(() => {
          probingAuthRef.current = false;
        });
      }
    };

    return () => es.close();
  }, [refreshHistory]);

  return {
    notifications,
    unreadCount: freshIds.size,
    freshIds,
    connected,
    markAllRead,
    refreshHistory,
    clearNotifications,
  };
}