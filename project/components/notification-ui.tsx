'use client';

import { Briefcase, CalendarClock, Globe, MapPin, Megaphone, Users, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NotificationAudience } from '@/lib/scn-api';
import { formatEventDateTime } from '@/lib/notification-utils';

// Full class strings on purpose (no `bg-${color}`) so Tailwind can see them.
export const AUDIENCE_META: Record<
  NotificationAudience,
  { label: string; hint: string; icon: LucideIcon; bar: string; chip: string; iconTile: string; tileActive: string }
> = {
  ALL: {
    label: 'Everyone',
    hint: 'Visitors, candidates & recruiters',
    icon: Globe,
    bar: 'bg-indigo-500',
    chip: 'bg-indigo-500/10 text-indigo-700 ring-indigo-500/25 dark:text-indigo-300',
    iconTile: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300',
    tileActive: 'border-indigo-500 bg-indigo-500/[0.06] ring-2 ring-indigo-500/20',
  },
  WORKER: {
    label: 'Candidates',
    hint: 'Only job seekers',
    icon: Users,
    bar: 'bg-emerald-500',
    chip: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300',
    iconTile: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
    tileActive: 'border-emerald-500 bg-emerald-500/[0.06] ring-2 ring-emerald-500/20',
  },
  RECRUITER: {
    label: 'Recruiters',
    hint: 'Only hiring partners',
    icon: Briefcase,
    bar: 'bg-amber-500',
    chip: 'bg-amber-500/10 text-amber-700 ring-amber-500/25 dark:text-amber-300',
    iconTile: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
    tileActive: 'border-amber-500 bg-amber-500/[0.06] ring-2 ring-amber-500/20',
  },
};

export function AudienceChip({ audience, className }: { audience: NotificationAudience; className?: string }) {
  const meta = AUDIENCE_META[audience];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
        meta.chip,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

export function EventChips({ location, eventDateTime }: { location?: string | null; eventDateTime?: string | null }) {
  if (!location && !eventDateTime) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {eventDateTime && (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          <CalendarClock className="h-3.5 w-3.5" />
          {formatEventDateTime(eventDateTime)}
        </span>
      )}
      {location && (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          <MapPin className="h-3.5 w-3.5" />
          {location}
        </span>
      )}
    </div>
  );
}

// "This is how users will see it" — shown beside both forms.
export function NotificationPreview({
  title,
  message,
  audience,
  location,
  eventDateTime,
}: {
  title: string;
  message: string;
  audience: NotificationAudience;
  location?: string;
  eventDateTime?: string | null;
}) {
  const meta = AUDIENCE_META[audience];
  const isEmpty = !title.trim() && !message.trim();

  return (
    <div className="relative overflow-hidden rounded-xl border border-dashed border-border bg-muted/30 p-4">
      <span className={cn('absolute inset-y-0 left-0 w-1', meta.bar)} />
      <div className="flex items-start gap-3 pl-1.5">
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', meta.iconTile)}>
          <Megaphone className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          {isEmpty ? (
            <p className="text-sm text-muted-foreground">Start typing — your announcement previews here.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <p className="break-words text-sm font-semibold leading-tight">{title.trim() || 'Untitled'}</p>
                <AudienceChip audience={audience} />
              </div>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                {message.trim() || '—'}
              </p>
              <EventChips location={location?.trim()} eventDateTime={eventDateTime} />
              <p className="mt-2 text-[11px] text-muted-foreground/70">just now</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}