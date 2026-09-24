'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, Loader2, Bell, MapPin, CalendarClock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/page-header';
import { notificationApi, NotificationAudience, BackendNotification } from '@/lib/scn-api';
import { getApiErrorMessage } from '@/lib/api';
import { toast } from 'sonner';

const audienceLabel: Record<NotificationAudience, string> = {
  ALL: 'Everyone',
  WORKER: 'Candidates only',
  RECRUITER: 'Recruiters only',
};

const audienceBadgeVariant: Record<NotificationAudience, 'default' | 'secondary' | 'outline'> = {
  ALL: 'default',
  WORKER: 'secondary',
  RECRUITER: 'outline',
};

export default function AdminNotificationsPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<NotificationAudience>('ALL');
  // Optional — only sent when the admin fills them in.
  const [location, setLocation] = useState('');
  const [eventDateTime, setEventDateTime] = useState('');

  const { data: notifications, isLoading } = useQuery<BackendNotification[]>({
    queryKey: ['admin-notifications'],
    queryFn: () => notificationApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: notificationApi.create,
    onSuccess: () => {
      toast.success('Notification sent');
      setTitle('');
      setMessage('');
      setAudience('ALL');
      setLocation('');
      setEventDateTime('');
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Could not send notification'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required');
      return;
    }
    createMutation.mutate({
      title: title.trim(),
      message: message.trim(),
      audience,
      location: location.trim() || undefined,
      // <input type="datetime-local"> gives "2026-09-24T18:30" with no
      // timezone — new Date(...) parses that as local time, and
      // .toISOString() converts it to UTC for the backend.
      eventDateTime: eventDateTime ? new Date(eventDateTime).toISOString() : undefined,
    });
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Broadcast an announcement to candidates, recruiters, or everyone."
      />

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="notif-title">Title</Label>
              <Input
                id="notif-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Platform maintenance"
                maxLength={120}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notif-message">Message</Label>
              <Textarea
                id="notif-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What do you want to tell them?"
                rows={4}
                maxLength={500}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notif-audience">Send to</Label>
              <Select value={audience} onValueChange={(v) => setAudience(v as NotificationAudience)}>
                <SelectTrigger id="notif-audience">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Everyone</SelectItem>
                  <SelectItem value="WORKER">Candidates only</SelectItem>
                  <SelectItem value="RECRUITER">Recruiters only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="notif-location" className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Location
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="notif-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Noida Office"
                  maxLength={200}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notif-datetime" className="flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5" /> Date &amp; time
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="notif-datetime"
                  type="datetime-local"
                  value={eventDateTime}
                  onChange={(e) => setEventDateTime(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send notification
            </Button>
          </form>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground">Recently sent</h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !notifications || notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
              <Bell className="h-6 w-6" />
              Nothing sent yet
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n: BackendNotification) => (
                <div key={n.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold">{n.title}</p>
                    <Badge variant={audienceBadgeVariant[n.audience]} className="shrink-0">
                      {audienceLabel[n.audience]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                  {(n.location || n.eventDateTime) && (
                    <div className="mt-2 flex flex-col gap-1">
                      {n.eventDateTime && (
                        <span className="flex items-center gap-1 text-xs font-medium text-primary">
                          <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                          {new Date(n.eventDateTime).toLocaleString()}
                        </span>
                      )}
                      {n.location && (
                        <span className="flex items-center gap-1 text-xs font-medium text-primary">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          {n.location}
                        </span>
                      )}
                    </div>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground/70">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}