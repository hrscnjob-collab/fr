'use client';

import { useState } from 'react';
import { Bell, MapPin, CalendarClock, X, Pencil } from 'lucide-react';
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
import { formatEventDateTime, isEdited, timeAgo } from '@/lib/notification-utils';
import { cn } from '@/lib/utils';

export function NotificationBell({ className }: { className?: string }) {
  const { notifications, unreadCount, freshIds, markAllRead, clearNotifications } = useNotifications();
  // Rows that were new/edited when the menu opened stay highlighted while
  // it is open, even though the red badge resets immediately.
  const [highlight, setHighlight] = useState<Set<string>>(new Set());

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) {
          setHighlight(new Set(freshIds));
          markAllRead();
        } else {
          setHighlight(new Set());
        }
      }}
    >
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
      <DropdownMenuContent align="end" className="w-[22rem] max-w-[calc(100vw-1.5rem)]">
        <div className="flex items-center justify-between pr-1">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearNotifications();
              }}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">No notifications yet</div>
        ) : (
          <ScrollArea className="h-80">
            <div className="flex flex-col">
              {notifications.map((n) => {
                const edited = isEdited(n);
                return (
                  <div
                    key={n.id}
                    className={cn(
                      'border-b border-border/60 px-3 py-3 transition-colors last:border-b-0 hover:bg-muted/50',
                      highlight.has(n.id) && 'bg-primary/5',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-tight">{n.title}</p>
                      {edited && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                          <Pencil className="h-2.5 w-2.5" />
                          Updated
                        </span>
                      )}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-snug text-muted-foreground">
                      {n.message}
                    </p>
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
                    <p className="mt-1.5 text-[11px] text-muted-foreground/70">
                      {edited ? `Updated ${timeAgo(n.updatedAt!)}` : timeAgo(n.createdAt)}
                    </p>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}