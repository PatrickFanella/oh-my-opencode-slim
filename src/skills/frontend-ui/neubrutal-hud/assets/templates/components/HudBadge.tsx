import type { ReactNode } from 'react';

export function HudBadge({ children, tone = 'ink-dim' }: { children: ReactNode; tone?: string }) {
  return (
    <span
      className="inline-flex items-center border px-1.5 py-0 text-2xs uppercase tracking-[0.12em]"
      style={{ borderColor: `hsl(var(--${tone}))`, color: `hsl(var(--${tone}))` }}
    >
      {children}
    </span>
  );
}
