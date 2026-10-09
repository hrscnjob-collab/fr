'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  CalendarClock,
  Loader2,
  MapPin,
  Megaphone,
  Pencil,
  Radio,
  RotateCcw,
  Save,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PageHeader } from '@/components/page-header';
import { AUDIENCE_META, AudienceChip, EventChips, NotificationPreview } from '@/components/notification-ui';
import { notificationApi, NotificationAudience, BackendNotification } from '@/lib/scn-api';
import { getApiErrorMessage } from '@/lib/api';
import { isEdited, timeAgo, toDatetimeLocal } from '@/lib/notification-utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const TITLE_MAX = 120;
const MESSAGE_MAX = 500;
const AUDIENCES: NotificationAudience[] = ['ALL', 'WORKER', 'RECRUITER'];

interface FormState {
  title: string;
  message: string;
  audience: NotificationAudience;
  location: string;
  eventDateTime: string; // <input type="datetime-local"> value, '' = none
}

const EMPTY_FORM: FormState = { title: '', message: '', audience: 'ALL', location: '', eventDateTime: '' };

const fromNotification = (n: BackendNotification): FormState => ({
  title: n.title,
  message: n.message,
  audience: n.audience,
  location: n.location ?? '',
  eventDateTime: toDatetimeLocal(n.eventDateTime),
});

// datetime-local has no timezone: Date() reads it as local, toISOString() -> UTC.
const toIso = (v: string) => (v ? new Date(v).toISOString() : null);

function AudiencePicker({ value, onChange }: { value: NotificationAudience; onChange: (v: NotificationAudience) => void }) {
  return (
    <div role="radiogroup" aria-label="Audience" className="grid grid-cols-3 gap-2">
      {AUDIENCES.map((a) => {
        const meta = AUDIENCE_META[a];
        const Icon = meta.icon;
        const active = value === a;
        return (
          <button
            key={a}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(a)}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-xl border bg-card px-2 py-3 text-center transition-all',
              'hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active ? meta.tileActive : 'border-border',
            )}
          >
            <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', meta.iconTile)}>
              <Icon className="h-4 w-4" />
            </span>
            <span className="text-xs font-semibold">{meta.label}</span>
            <span className="hidden text-[10px] leading-tight text-muted-foreground sm:block">{meta.hint}</span>
          </button>
        );
      })}
    </div>
  );
}

function Counter({ value, max }: { value: number; max: number }) {
  return (
    <span className={cn('text-[11px] tabular-nums text-muted-foreground', value > max * 0.9 && 'font-semibold text-amber-600')}>
      {value}/{max}
    </span>
  );
}

function ClearableInput({
  clearLabel,
  onClear,
  ...props
}: React.ComponentProps<typeof Input> & { clearLabel: string; onClear: () => void }) {
  return (
    <div className="flex gap-2">
      <Input {...props} />
      {props.value && (
        <Button type="button" variant="outline" size="icon" className="shrink-0" aria-label={clearLabel} onClick={onClear}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function NotificationFields({ idPrefix, value, onChange }: { idPrefix: string; value: FormState; onChange: (next: FormState) => void }) {
  const set = <K extends keyof FormState>(key: K, v: FormState[K]) => onChange({ ...value, [key]: v });

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor={`${idPrefix}-title`}>Title</Label>
          <Counter value={value.title.length} max={TITLE_MAX} />
        </div>
        <Input
          id={`${idPrefix}-title`}
          value={value.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="e.g. Noida Jobathon this Saturday"
          maxLength={TITLE_MAX}
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor={`${idPrefix}-message`}>Message</Label>
          <Counter value={value.message.length} max={MESSAGE_MAX} />
        </div>
        <Textarea
          id={`${idPrefix}-message`}
          value={value.message}
          onChange={(e) => set('message', e.target.value)}
          placeholder="What do you want to tell them?"
          rows={4}
          maxLength={MESSAGE_MAX}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Who should see this?</Label>
        <AudiencePicker value={value.audience} onChange={(a) => set('audience', a)} />
      </div>

      <div className="space-y-3 rounded-xl border border-dashed border-border bg-muted/30 p-3.5">
        <p className="text-xs font-semibold text-muted-foreground">
          Event details <span className="font-normal">(optional)</span>
        </p>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-datetime`} className="flex items-center gap-1.5 text-xs">
            <CalendarClock className="h-3.5 w-3.5" /> Date &amp; time
          </Label>
          <ClearableInput
            id={`${idPrefix}-datetime`}
            type="datetime-local"
            value={value.eventDateTime}
            onChange={(e) => set('eventDateTime', e.target.value)}
            clearLabel="Remove date and time"
            onClear={() => set('eventDateTime', '')}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-location`} className="flex items-center gap-1.5 text-xs">
            <MapPin className="h-3.5 w-3.5" /> Location
          </Label>
          <ClearableInput
            id={`${idPrefix}-location`}
            value={value.location}
            onChange={(e) => set('location', e.target.value)}
            placeholder="e.g. Noida Office, Sector 62"
            maxLength={200}
            clearLabel="Remove location"
            onClear={() => set('location', '')}
          />
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── edit drawer ─────────────────────────

function EditNotificationSheet({
  notification,
  saving,
  onClose,
  onSave,
}: {
  notification: BackendNotification | null;
  saving: boolean;
  onClose: () => void;
  onSave: (id: string, form: FormState) => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const initial = useMemo(() => (notification ? fromNotification(notification) : EMPTY_FORM), [notification]);

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const valid = form.title.trim().length > 0 && form.message.trim().length > 0;

  return (
    <Sheet open={!!notification} onOpenChange={(open) => !open && !saving && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="space-y-1 border-b bg-gradient-to-r from-primary/10 via-accent/10 to-transparent px-6 py-5 text-left">
          <SheetTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Pencil className="h-4 w-4" />
            </span>
            Edit notification
          </SheetTitle>
          <SheetDescription className="flex items-center gap-1.5">
            <Radio className="h-3.5 w-3.5 text-emerald-500" />
            Saved changes go live instantly for everyone online.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <NotificationFields idPrefix="edit" value={form} onChange={setForm} />

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Live preview</p>
            <NotificationPreview
              title={form.title}
              message={form.message}
              audience={form.audience}
              location={form.location}
              eventDateTime={toIso(form.eventDateTime)}
            />
            {notification && form.audience !== notification.audience && (
              <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                Audience changed: people no longer in the audience will have this removed from their
                notifications right away.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t bg-background px-6 py-4">
          <Button type="button" variant="ghost" disabled={!dirty || saving} onClick={() => setForm(initial)}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={saving} onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!dirty || !valid || saving}
              onClick={() => notification && onSave(notification.id, form)}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save changes
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ───────────────────────── list row ─────────────────────────

function NotificationRow({ n, onEdit, onDelete }: { n: BackendNotification; onEdit: () => void; onDelete: () => void }) {
  const meta = AUDIENCE_META[n.audience];
  const edited = isEdited(n);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className="relative overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      <span className={cn('absolute inset-y-0 left-0 w-1', meta.bar)} />
      <div className="flex items-start gap-3 p-4 pl-5">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', meta.iconTile)}>
          <Megaphone className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="break-words text-sm font-semibold leading-tight">{n.title}</p>
            <AudienceChip audience={n.audience} />
            {edited && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                <Pencil className="h-3 w-3" />
                Edited
              </span>
            )}
          </div>
          <p className="mt-1.5 whitespace-pre-wrap break-words text-sm text-muted-foreground">{n.message}</p>
          <EventChips location={n.location} eventDateTime={n.eventDateTime} />
          <p className="mt-3 text-[11px] text-muted-foreground/70">
            Posted {timeAgo(n.createdAt)} · {new Date(n.createdAt).toLocaleString()}
            {edited && n.updatedAt && ` · edited ${timeAgo(n.updatedAt)}`}
          </p>
        </div>

        <div className="flex shrink-0 gap-1">
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label={`Edit ${n.title}`} onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Delete ${n.title}`}
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ───────────────────────── page ─────────────────────────

type Filter = 'ALL_FILTER' | NotificationAudience;

export default function AdminNotificationsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editing, setEditing] = useState<BackendNotification | null>(null);
  const [deleting, setDeleting] = useState<BackendNotification | null>(null);
  const [filter, setFilter] = useState<Filter>('ALL_FILTER');
  const [search, setSearch] = useState('');

  const { data: notifications, isLoading } = useQuery<BackendNotification[]>({
    queryKey: ['admin-notifications'],
    queryFn: () => notificationApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: notificationApi.create,
    onSuccess: () => {
      toast.success('Notification sent');
      setForm(EMPTY_FORM);
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not send notification')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, f }: { id: string; f: FormState }) =>
      notificationApi.update(id, {
        title: f.title.trim(),
        message: f.message.trim(),
        audience: f.audience,
        location: f.location.trim() || null, // null clears it
        eventDateTime: toIso(f.eventDateTime),
      }),
    onSuccess: (updated) => {
      toast.success('Notification updated — live for everyone online');
      queryClient.setQueryData<BackendNotification[]>(['admin-notifications'], (old: BackendNotification[] | undefined) =>
        (old ?? []).map((n: BackendNotification) => (n.id === updated.id ? updated : n)),
      );
      setEditing(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not update notification')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationApi.remove(id),
    onSuccess: (_res, id) => {
      toast.success('Notification deleted');
      queryClient.setQueryData<BackendNotification[]>(['admin-notifications'], (old: BackendNotification[] | undefined) =>
        (old ?? []).filter((n: BackendNotification) => n.id !== id),
      );
      setDeleting(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not delete notification')),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Title and message are required');
      return;
    }
    createMutation.mutate({
      title: form.title.trim(),
      message: form.message.trim(),
      audience: form.audience,
      location: form.location.trim() || undefined,
      eventDateTime: toIso(form.eventDateTime) ?? undefined,
    });
  };

  const counts = useMemo(() => {
    const list = notifications ?? [];
    return {
      ALL_FILTER: list.length,
      ALL: list.filter((n: BackendNotification) => n.audience === 'ALL').length,
      WORKER: list.filter((n: BackendNotification) => n.audience === 'WORKER').length,
      RECRUITER: list.filter((n: BackendNotification) => n.audience === 'RECRUITER').length,
    } as Record<Filter, number>;
  }, [notifications]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (notifications ?? []).filter((n: BackendNotification) => {
      if (filter !== 'ALL_FILTER' && n.audience !== filter) return false;
      if (!q) return true;
      return (
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        (n.location ?? '').toLowerCase().includes(q)
      );
    });
  }, [notifications, filter, search]);

  const filterTabs: { key: Filter; label: string }[] = [
    { key: 'ALL_FILTER', label: 'All' },
    { key: 'ALL', label: 'Everyone' },
    { key: 'WORKER', label: 'Candidates' },
    { key: 'RECRUITER', label: 'Recruiters' },
  ];

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Post announcements, then edit or remove them any time — every change reaches users instantly."
        action={
          <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live updates on
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        {/* Composer */}
        <Card className="self-start overflow-hidden lg:sticky lg:top-6">
          <div className="flex items-center gap-3 border-b bg-gradient-to-r from-primary/10 via-accent/10 to-transparent px-5 py-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Megaphone className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold leading-tight">New announcement</h2>
              <p className="text-xs text-muted-foreground">Sent the moment you press send</p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-5 p-5">
            <NotificationFields idPrefix="new" value={form} onChange={setForm} />
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preview</p>
              <NotificationPreview
                title={form.title}
                message={form.message}
                audience={form.audience}
                location={form.location}
                eventDateTime={toIso(form.eventDateTime)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send notification
            </Button>
          </form>
        </Card>

        {/* Sent list */}
        <div className="min-w-0 space-y-4">
          <Card className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-1.5">
                {filterTabs.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setFilter(t.key)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                      filter === t.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {t.label}
                    <span className={cn('rounded-full px-1.5 text-[10px] tabular-nums', filter === t.key ? 'bg-white/20' : 'bg-background')}>
                      {counts[t.key]}
                    </span>
                  </button>
                ))}
              </div>
              <div className="relative sm:w-56">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="h-9 pl-9"
                  aria-label="Search notifications"
                />
              </div>
            </div>
          </Card>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : visible.length === 0 ? (
            <Card className="flex flex-col items-center gap-2 py-20 text-center text-sm text-muted-foreground">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                <Bell className="h-5 w-5" />
              </span>
              {(notifications ?? []).length === 0
                ? 'Nothing sent yet — your first announcement will show up here.'
                : 'No notifications match your filter.'}
            </Card>
          ) : (
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {visible.map((n: BackendNotification) => (
                  <NotificationRow key={n.id} n={n} onEdit={() => setEditing(n)} onDelete={() => setDeleting(n)} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <EditNotificationSheet
        notification={editing}
        saving={updateMutation.isPending}
        onClose={() => setEditing(null)}
        onSave={(id, f) => updateMutation.mutate({ id, f })}
      />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this notification?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleting?.title}” will disappear from everyone&apos;s notifications right away. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deleting) deleteMutation.mutate(deleting.id);
              }}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}