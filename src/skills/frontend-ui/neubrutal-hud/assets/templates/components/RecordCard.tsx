import { cn } from './cn-utility';
import { HudBadge } from './HudBadge';

export type RecordItem = {
  id: string;
  label: string;
  title: string;
  summary: string;
  severity: 'Low' | 'Medium' | 'High';
  tags: string[];
};

export function RecordCard({ item, active, onClick }: { item: RecordItem; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button" onClick={onClick}
      className={cn(
        'w-full border p-3 text-left transition duration-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--pulse))]',
        active
          ? 'border-[hsl(var(--pulse))] bg-[hsl(var(--panel-raised))]'
          : 'border-[hsl(var(--border-faint))] bg-[hsl(var(--panel))] hover:border-[hsl(var(--pulse))]',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-2xs uppercase tracking-[0.15em] text-[hsl(var(--signal))]">{item.label}</p>
          <p className="text-sm font-semibold text-[hsl(var(--ink))] truncate">{item.title}</p>
        </div>
        <HudBadge tone={item.severity === 'High' ? 'alert' : item.severity === 'Medium' ? 'caution' : 'ink-mute'}>{item.severity}</HudBadge>
      </div>
      <p className="mt-2 text-xs text-[hsl(var(--ink-dim))] line-clamp-2">{item.summary}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {item.tags.map((tag) => (
          <HudBadge key={tag}>{tag}</HudBadge>
        ))}
      </div>
    </button>
  );
}
