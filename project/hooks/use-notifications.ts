'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { notificationApi, BackendNotification } from '@/lib/scn-api';
import { authApi } from '@/lib/scn-api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

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
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      // A 401 here already triggers the app-wide `auth:logout` event via
      // the axios interceptor in lib/api.ts — nothing extra to do.
    }
  }, []);

  const markAllRead = useCallback(() => {
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

  return { notifications, unreadCount, connected, markAllRead, refreshHistory };
}