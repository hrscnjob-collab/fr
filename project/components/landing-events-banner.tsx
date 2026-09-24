'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Megaphone,
  MapPin,
  CalendarClock,
  Trophy,
  Briefcase,
  Video,
  Users,
  Sparkles,
} from 'lucide-react';
import { notificationApi, BackendNotification } from '@/lib/scn-api';

const BRAND = {
  ink: '#101235',
  indigo: '#2B2E77',
  amber: '#F5A623',
  amberDeep: '#D98C0F',
  teal: '#14B8A6',
};

function getPalette(dark: boolean) {
  return dark
    ? {
        cardBgFrom: BRAND.ink,
        cardBgTo: '#191C3D',
        border: 'rgba(245,166,35,0.18)',
        heading: '#F3F2EC',
        headingMuted: '#A6A9C4',
        title: '#FFFFFF',
        body: '#C7C9E6',
        iconBg: 'rgba(245,166,35,0.16)',
        dotInactive: 'rgba(255,255,255,0.22)',
        trackBg: 'rgba(255,255,255,0.12)',
        glow: 'rgba(245,166,35,0.18)',
      }
    : {
        cardBgFrom: '#FFFFFF',
        cardBgTo: '#FFF9EE',
        border: '#F0E4C8',
        heading: '#101235',
        headingMuted: '#5B5F79',
        title: BRAND.ink,
        body: '#5B5F79',
        iconBg: 'rgba(245,166,35,0.14)',
        dotInactive: 'rgba(16,18,53,0.14)',
        trackBg: 'rgba(16,18,53,0.08)',
        glow: 'rgba(245,166,35,0.22)',
      };
}

// Picks an icon based on keywords in the notification so a hackathon
// doesn't look identical to a webinar or a hiring drive.
function iconFor(title: string) {
  const t = title.toLowerCase();
  if (t.includes('hackathon') || t.includes('coding') || t.includes('contest')) return Trophy;
  if (t.includes('jobathon') || t.includes('placement') || t.includes('hiring') || t.includes('drive') || t.includes('internship'))
    return Briefcase;
  if (t.includes('webinar') || t.includes('bootcamp')) return Video;
  if (t.includes('summit') || t.includes('mixer') || t.includes('meetup') || t.includes('networking')) return Users;
  return Megaphone;
}

function formatEventDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const ROTATE_MS = 5000;

// A theme-aware, self-fetching band for the public landing page — shows
// the latest ALL-audience notifications (events/announcements the admin
// broadcast) and auto-rotates through them with a progress bar. Hits the
// public/latest endpoint, which needs no JWT. Renders nothing (not even
// the heading) when there's nothing to show.
export function LandingEventsBanner({ dark }: { dark: boolean }) {
  const pal = getPalette(dark);
  const [items, setItems] = useState<BackendNotification[]>([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch once the banner scrolls into view rather than on initial mount,
  // matching "when someone scrolls the landing page they see it".
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loaded) {
          setLoaded(true);
          notificationApi
            .publicLatest(5)
            .then((data) => setItems(Array.isArray(data) ? data : []))
            .catch(() => setItems([]));
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [loaded]);

  useEffect(() => {
    if (items.length < 2 || paused) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [items.length, paused]);

  // Nothing to announce right now — don't show an empty section at all.
  if (loaded && items.length === 0) {
    return <div ref={containerRef} />;
  }

  const current = items[index];
  const CurrentIcon = current ? iconFor(current.title) : Megaphone;

  return (
    <div ref={containerRef} className="container" style={{ padding: '0 24px 64px' }}>
      {/* ---------------- Heading ---------------- */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <span
          className="mono"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: BRAND.teal,
            fontWeight: 600,
            letterSpacing: '0.1em',
          }}
        >
          <Sparkles size={13} /> LIVE UPDATES
        </span>
        <h2
          className="disp"
          style={{
            fontSize: 'clamp(24px, 3vw, 32px)',
            fontWeight: 800,
            marginTop: 8,
            color: pal.heading,
          }}
        >
          Events &amp; Announcements
        </h2>
        <p style={{ fontSize: 14, color: pal.headingMuted, marginTop: 6, maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}>
          Hackathons, jobathons, drives &amp; more — straight from the SCNJOBS team.
        </p>
      </div>

      {/* ---------------- Rotating card ---------------- */}
      <div
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 22,
          border: `1px solid ${pal.border}`,
          background: `linear-gradient(120deg, ${pal.cardBgFrom} 0%, ${pal.cardBgTo} 100%)`,
          padding: '28px 30px',
          minHeight: 118,
          boxShadow: dark
            ? '0 24px 60px -30px rgba(0,0,0,0.6)'
            : '0 24px 50px -28px rgba(16,18,53,0.18)',
        }}
      >
        {/* decorative glow */}
        <div
          style={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: pal.glow,
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              flexShrink: 0,
              width: 52,
              height: 52,
              borderRadius: 16,
              background: pal.iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CurrentIcon size={24} color={BRAND.amber} />
          </div>

          <div style={{ flex: 1, minWidth: 0, position: 'relative', minHeight: 48 }}>
            {!loaded && (
              <div style={{ fontSize: 13.5, color: pal.body }}>Loading announcements…</div>
            )}
            {items.map((n, i) => {
              const Icon = iconFor(n.title);
              return (
                <div
                  key={n.id}
                  style={{
                    position: i === index ? 'relative' : 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    opacity: i === index ? 1 : 0,
                    transform: i === index ? 'translateY(0)' : 'translateY(8px)',
                    transition: 'opacity 0.5s ease, transform 0.5s ease',
                    pointerEvents: i === index ? 'auto' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 10.5,
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: BRAND.amber,
                        background: pal.iconBg,
                        borderRadius: 999,
                        padding: '3px 9px',
                      }}
                    >
                      <Icon size={11} /> Event
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 15.5, color: pal.title }}>{n.title}</span>
                  </div>
                  <p style={{ marginTop: 5, fontSize: 13.5, color: pal.body, lineHeight: 1.5 }}>{n.message}</p>
                  {(n.location || n.eventDateTime) && (
                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                      {n.eventDateTime && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: BRAND.amberDeep, fontWeight: 600 }}>
                          <CalendarClock size={13} />
                          {formatEventDateTime(n.eventDateTime)}
                        </span>
                      )}
                      {n.location && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: BRAND.amberDeep, fontWeight: 600 }}>
                          <MapPin size={13} />
                          {n.location}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {items.length > 1 && (
            <div style={{ flexShrink: 0, display: 'flex', gap: 6 }}>
              {items.map((n, i) => (
                <button
                  key={n.id}
                  type="button"
                  aria-label={`Show announcement ${i + 1}`}
                  onClick={() => setIndex(i)}
                  style={{
                    width: i === index ? 20 : 7,
                    height: 7,
                    borderRadius: 999,
                    border: 'none',
                    cursor: 'pointer',
                    background: i === index ? BRAND.amber : pal.dotInactive,
                    transition: 'width 0.3s ease, background 0.3s ease',
                    padding: 0,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* progress bar for the active item — restarts every time `index` changes */}
        {items.length > 1 && (
          <div style={{ position: 'relative', marginTop: 20, height: 3, borderRadius: 999, background: pal.trackBg, overflow: 'hidden' }}>
            <div
              key={`${index}-${paused}`}
              style={{
                height: '100%',
                borderRadius: 999,
                background: `linear-gradient(90deg, ${BRAND.amber}, ${BRAND.amberDeep})`,
                animation: paused ? 'none' : `scn-events-progress ${ROTATE_MS}ms linear forwards`,
                width: paused ? '100%' : undefined,
              }}
            />
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes scn-events-progress {
            from { width: 0%; }
            to { width: 100%; }
          }
        `,
      }} />
    </div>
  );
}