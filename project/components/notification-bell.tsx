'use client';

import { Bell, MapPin, CalendarClock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/use-notifications';

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatEventDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function NotificationBell({ className }: { className?: string }) {
  const { notifications, unreadCount, markAllRead, clearNotifications } = useNotifications();

  return (
    <DropdownMenu onOpenChange={(open) => open && markAllRead()}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={className ? className : 'relative rounded-full'}
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 min-w-5 justify-center rounded-full px-1 text-[10px] leading-none"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between pr-1">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearNotifications();
              }}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          <ScrollArea className="h-80">
            <div className="flex flex-col">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="border-b border-border/60 px-3 py-3 last:border-b-0 hover:bg-muted/50"
                >
                  <p className="text-sm font-semibold leading-tight">{n.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground leading-snug">{n.message}</p>
                  {(n.location || n.eventDateTime) && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                      {n.eventDateTime && (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-primary">
                          <CalendarClock className="h-3 w-3" />
                          {formatEventDateTime(n.eventDateTime)}
                        </span>
                      )}
                      {n.location && (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-primary">
                          <MapPin className="h-3 w-3" />
                          {n.location}
                        </span>
                      )}
                    </div>
                  )}
                  <p className="mt-1.5 text-[11px] text-muted-foreground/70">{timeAgo(n.createdAt)}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}