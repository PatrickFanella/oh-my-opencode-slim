import type { ReactNode } from 'react';
import { cn } from './cn-utility';

export function ConsolePanel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('border border-[hsl(var(--border-faint))] bg-[hsl(var(--panel))]', className)}>
      {children}
    </div>
  );
}
