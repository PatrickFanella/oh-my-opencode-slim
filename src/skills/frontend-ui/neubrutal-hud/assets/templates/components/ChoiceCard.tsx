import { cn } from './cn-utility';
import { HudBadge } from './HudBadge';

export type Choice = {
  label: string;
  reason: string;
  note: string;
  disabled: boolean;
};

export function ChoiceCard({ choice }: { choice: Choice }) {
  return (
    <button
      type="button" disabled={choice.disabled}
      className={cn(
        'w-full border p-3 text-left transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--pulse))]',
        choice.disabled
          ? 'cursor-not-allowed border-[hsl(var(--border-faint))] opacity-60'
          : 'border-[hsl(var(--border-faint))] bg-[hsl(var(--panel))] hover:border-[hsl(var(--pulse))]',
      )}
      aria-describedby={`${choice.label.replace(/\s+/g, '-').toLowerCase()}-reason`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-[hsl(var(--ink))]">{choice.label}</p>
        <HudBadge tone={choice.disabled ? 'alert' : 'confirm'}>{choice.disabled ? 'LOCKED' : 'OPEN'}</HudBadge>
      </div>
      <p id={`${choice.label.replace(/\s+/g, '-').toLowerCase()}-reason`} className="mt-2 text-xs text-[hsl(var(--ink-dim))]">{choice.reason}</p>
      <p className="mt-1 text-2xs text-[hsl(var(--ink))]">{choice.note}</p>
    </button>
  );
}
