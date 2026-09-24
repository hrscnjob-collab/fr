'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { notificationApi, BackendNotification } from '@/lib/scn-api';
import { authApi } from '@/lib/scn-api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

// Persisted so a "Clear" tap stays cleared across a page refresh — the
// backend has no per-user read/dismiss state, so this is purely a
// client-side filter on top of whatever the history endpoint returns.
const CLEARED_AT_KEY = 'notifications-cleared-at';

function getClearedAt(): number {
  if (typeof window === 'undefined') return 0;
  const raw = localStorage.getItem(CLEARED_AT_KEY);
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function filterCleared(list: BackendNotification[]): BackendNotification[] {
  const clearedAt = getClearedAt();
  if (!clearedAt) return list;
  return list.filter((n) => new Date(n.createdAt).getTime() > clearedAt);
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<BackendNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);

  const esRef = useRef<EventSource | null>(null);
  // Guards against re-probing auth on every single retry tick while the
  // stream keeps reconnecting (native EventSource retries every ~3s).
  const probingAuthRef = useRef(false);

  const refreshHistory = useCallback(async () => {
    try {
      const data = await notificationApi.list();
      setNotifications(filterCleared(Array.isArray(data) ? data : []));
    } catch {
      // A 401 here already triggers the app-wide `auth:logout` event via
      // the axios interceptor in lib/api.ts — nothing extra to do.
    }
  }, []);

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  // Wipes the visible list (client-side only) and remembers "now" so
  // anything already delivered stays hidden after a refresh; anything
  // new that arrives after this still shows up as normal.
  const clearNotifications = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CLEARED_AT_KEY, String(Date.now()));
    }
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    refreshHistory();

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
    if (!token) return;

    const url = `${API_BASE}/notifications/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => {
      setConnected(true);
      probingAuthRef.current = false;
    };

    es.addEventListener('notification', (event: MessageEvent) => {
      try {
        const data: BackendNotification = JSON.parse(event.data);
        setNotifications((prev) => [data, ...prev].slice(0, 50));
        setUnreadCount((count) => count + 1);
      } catch {
        // ignore malformed frame
      }
    });

    es.onerror = () => {
      setConnected(false);

      // Native EventSource gives no status code on error, and by default
      // keeps silently retrying — including on a 401 (expired/invalid
      // token), which would otherwise just loop forever. Probe once with
      // a normal authenticated request: if the token is genuinely bad,
      // the axios interceptor's existing 401 handling (clear storage +
      // `auth:logout` event -> redirect to /login) takes over. If the
      // probe succeeds, it was a transient network blip — let
      // EventSource's built-in reconnect keep trying.
      if (!probingAuthRef.current) {
        probingAuthRef.current = true;
        authApi.me().finally(() => {
          probingAuthRef.current = false;
        });
      }
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [refreshHistory]);

  return { notifications, unreadCount, connected, markAllRead, refreshHistory, clearNotifications };
}