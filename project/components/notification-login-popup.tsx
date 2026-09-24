'use client';

import { useEffect, useState } from 'react';
import { Bell, MapPin, CalendarClock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { notificationApi, BackendNotification } from '@/lib/scn-api';

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface NotificationLoginPopupProps {
  role: 'worker' | 'recruiter';
}

// Shows the top-5 latest notifications once, right after a candidate or
// recruiter logs in. Uses sessionStorage (not localStorage) so it fires
// again on the next fresh login/session but not on every page navigation
// within the same session.
export function NotificationLoginPopup({ role }: NotificationLoginPopupProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<BackendNotification[]>([]);

  useEffect(() => {
    const shownKey = `notif-login-popup-shown:${role}`;
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(shownKey)) return;

    let cancelled = false;

    notificationApi
      .latest(5)
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        sessionStorage.setItem(shownKey, '1');
        if (list.length > 0) {
          setItems(list);
          setOpen(true);
        }
      })
      .catch(() => {
        // Silently skip — this is a nice-to-have, not critical path.
        sessionStorage.setItem(shownKey, '1');
      });

    return () => {
      cancelled = true;
    };
  }, [role]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
               What's new
          </DialogTitle>
          <DialogDescription>
            The latest announcements since you last checked in.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="flex flex-col gap-3 pr-3">
            {items.map((n) => (
              <div key={n.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold leading-tight">{n.title}</p>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {timeAgo(n.createdAt)}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                {(n.location || n.eventDateTime) && (
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {n.eventDateTime && (
                      <span className="flex items-center gap-1 text-xs font-medium text-primary">
                        <CalendarClock className="h-3.5 w-3.5" />
                        {new Date(n.eventDateTime).toLocaleString(undefined, {
                          day: 'numeric',
                          month: 'short',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                    {n.location && (
                      <span className="flex items-center gap-1 text-xs font-medium text-primary">
                        <MapPin className="h-3.5 w-3.5" />
                        {n.location}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <Button className="w-full" onClick={() => setOpen(false)}>
          Got it
        </Button>
      </DialogContent>
    </Dialog>
  );
}