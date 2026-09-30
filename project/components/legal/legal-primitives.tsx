import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Small typographic building blocks so legal copy stays consistent. No client JS needed. */

export function P({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('text-[15px] leading-7 text-muted-foreground', className)}>{children}</p>;
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="pt-2 text-base font-semibold tracking-tight text-foreground">{children}</h3>;
}

export function UL({ children }: { children: ReactNode }) {
  return (
    <ul className="list-disc space-y-2 pl-6 text-[15px] leading-7 text-muted-foreground marker:text-primary/60">
      {children}
    </ul>
  );
}

export function OL({ children }: { children: ReactNode }) {
  return (
    <ol className="list-decimal space-y-2 pl-6 text-[15px] leading-7 text-muted-foreground marker:font-medium marker:text-primary/70">
      {children}
    </ol>
  );
}

export function LI({ children }: { children: ReactNode }) {
  return <li>{children}</li>;
}

export function B({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-foreground">{children}</strong>;
}

export function Callout({
  title,
  children,
  tone = 'info',
}: {
  title?: string;
  children: ReactNode;
  tone?: 'info' | 'warning';
}) {
  return (
    <div
      className={cn(
        'rounded-xl border p-4 text-[15px] leading-7',
        tone === 'info'
          ? 'border-primary/20 bg-primary/5 text-muted-foreground'
          : 'border-warning/30 bg-warning/10 text-muted-foreground',
      )}
    >
      {title && <p className="mb-1 font-semibold text-foreground">{title}</p>}
      {children}
    </div>
  );
}

export function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[560px] border-collapse text-left text-sm">
        <thead className="bg-muted/60 text-foreground">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-4 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border text-muted-foreground">
          {rows.map((row, i) => (
            <tr key={i} className="align-top">
              {row.map((cell, j) => (
                <td key={j} className={cn('px-4 py-3 leading-6', j === 0 && 'font-medium text-foreground')}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}