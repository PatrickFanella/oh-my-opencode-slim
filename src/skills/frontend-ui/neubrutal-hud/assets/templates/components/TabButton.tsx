import type { KeyboardEvent } from 'react';
import { cn } from './cn-utility';

export function TabButton({
  active, label, note, onClick, controls, id, onKeyDown,
}: {
  active: boolean; label: string; note: string; onClick: () => void;
  controls?: string; id?: string; onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button" role="tab" id={id}
      aria-selected={active} aria-controls={controls}
      tabIndex={active ? 0 : -1}
      onClick={onClick} onKeyDown={onKeyDown}
      className={cn(
        'border px-3 py-1.5 text-left transition duration-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--pulse))]',
        active
          ? 'border-[hsl(var(--pulse))] bg-[hsl(var(--panel-raised))]'
          : 'border-[hsl(var(--border-faint))] bg-[hsl(var(--panel))] hover:border-[hsl(var(--pulse))] hover:bg-[hsl(var(--panel-raised))]',
      )}
    >
      <p className="text-xs font-semibold text-[hsl(var(--ink))]">{label}</p>
      <p className="text-2xs text-[hsl(var(--ink-dim))]">{note}</p>
    </button>
  );
}
