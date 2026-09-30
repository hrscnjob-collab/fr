'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { ChevronDown, FileText, Printer, ShieldCheck } from 'lucide-react';
import { PublicNavbar } from '@/components/public-navbar';
import { PublicFooter } from '@/components/public-footer';
import { LEGAL, formatLegalDate } from '@/lib/legal-config';
import { cn } from '@/lib/utils';

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

interface LegalDocumentProps {
  title: string;
  summary: string;
  current: 'privacy' | 'terms';
  sections: LegalSection[];
}

const DOCS = [
  { key: 'privacy', label: 'Privacy Policy', href: '/privacy', icon: ShieldCheck },
  { key: 'terms', label: 'Terms of Service', href: '/terms', icon: FileText },
] as const;

export function LegalDocument({ title, summary, current, sections }: LegalDocumentProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? '');
  const [tocOpen, setTocOpen] = useState(false);

  // Scroll-spy: highlight the section currently in view.
  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => !!el);
    if (!els.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-96px 0px -65% 0px', threshold: 0 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  // Honour deep links such as /privacy#grievance after hydration.
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView());
    }
  }, []);

  const toc = (
    <ol className="space-y-0.5">
      {sections.map((s, i) => (
        <li key={s.id}>
          <a
            href={`#${s.id}`}
            onClick={() => setTocOpen(false)}
            className={cn(
              'flex gap-2 rounded-md px-2.5 py-1.5 text-[13px] leading-5 transition-colors',
              activeId === s.id
                ? 'bg-primary/10 font-medium text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <span className="w-5 shrink-0 tabular-nums opacity-70">{i + 1}.</span>
            <span>{s.title}</span>
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background print:bg-white">
      <div className="print:hidden">
        <PublicNavbar />
      </div>

      {/* Header */}
      <section className="border-b border-border bg-card/40 print:border-0 print:bg-transparent">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <nav aria-label="Legal documents" className="mb-6 flex flex-wrap gap-2 print:hidden">
            {DOCS.map(({ key, label, href, icon: Icon }) => (
              <Link
                key={key}
                href={href}
                aria-current={current === key ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                  current === key
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            ))}
          </nav>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">{summary}</p>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span>
              <span className="font-medium text-foreground">Effective:</span>{' '}
              {formatLegalDate(LEGAL.effectiveDate)}
            </span>
            <span>
              <span className="font-medium text-foreground">Last updated:</span>{' '}
              {formatLegalDate(LEGAL.lastUpdated)}
            </span>
            <span>
              <span className="font-medium text-foreground">Version:</span> {LEGAL.version}
            </span>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 font-medium text-foreground transition-colors hover:bg-muted print:hidden"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / Save as PDF
            </button>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:gap-12">
          {/* Mobile TOC */}
          <div className="mb-8 w-full rounded-xl border border-border bg-card lg:hidden print:hidden">
            <button
              type="button"
              onClick={() => setTocOpen((v) => !v)}
              aria-expanded={tocOpen}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold"
            >
              Contents
              <ChevronDown className={cn('h-4 w-4 transition-transform', tocOpen && 'rotate-180')} />
            </button>
            {tocOpen && <div className="border-t border-border p-2">{toc}</div>}
          </div>

          {/* Desktop TOC */}
          <aside className="hidden w-64 shrink-0 lg:block print:hidden">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
              <p className="mb-3 px-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Contents
              </p>
              {toc}
            </div>
          </aside>

          <article className="w-full min-w-0 flex-1 lg:max-w-3xl">
            <div className="space-y-12">
              {sections.map((s, i) => (
                <section key={s.id} id={s.id} className="scroll-mt-24 space-y-4">
                  <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                    <span className="mr-2 text-primary/70">{i + 1}.</span>
                    {s.title}
                  </h2>
                  {s.body}
                </section>
              ))}
            </div>

            <div className="mt-16 rounded-2xl border border-border bg-card p-6 print:hidden">
              <p className="text-sm font-semibold">Questions about this document?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Write to{' '}
                <a className="font-medium text-primary hover:underline" href={`mailto:${LEGAL.emails.legal}`}>
                  {LEGAL.emails.legal}
                </a>{' '}
                or call {LEGAL.phone} ({LEGAL.supportHours}). You can also use our{' '}
                <Link href="/contact" className="font-medium text-primary hover:underline">
                  contact page
                </Link>
                .
              </p>
            </div>
          </article>
        </div>
      </div>

      <div className="print:hidden">
        <PublicFooter />
      </div>
    </div>
  );
}