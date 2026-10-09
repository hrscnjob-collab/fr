import type { BackendNotification } from '@/lib/scn-api';

export function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function formatEventDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// true when an admin changed it after it was first posted
export function isEdited(n: Pick<BackendNotification, 'createdAt' | 'updatedAt'>) {
  if (!n.updatedAt) return false;
  return new Date(n.updatedAt).getTime() - new Date(n.createdAt).getTime() > 1500;
}

// Edits count as "changed" for clear / unread logic.
export function lastChangedAt(n: Pick<BackendNotification, 'createdAt' | 'updatedAt'>) {
  return new Date(n.updatedAt || n.createdAt).getTime();
}

// ISO string -> value for <input type="datetime-local"> (local time).
export function toDatetimeLocal(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (v: number) => String(v).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

// Insert or replace by id, newest-posted first (used by live events).
export function upsertNotification(list: BackendNotification[], item: BackendNotification) {
  const next = list.some((n) => n.id === item.id)
    ? list.map((n) => (n.id === item.id ? item : n))
    : [item, ...list];
  return next.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}