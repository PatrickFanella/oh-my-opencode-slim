import { HudBadge } from './HudBadge';

export type AssetItem = {
  id: string;
  label: string;
  type: string;
  source: string;
  confidence: string;
  summary: string;
  badge: string;
};

export function AssetRow({ item }: { item: AssetItem }) {
  return (
    <div className="border border-[hsl(var(--border-faint))] bg-[hsl(var(--panel))] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-[hsl(var(--ink))]">{item.label}</p>
          <p className="text-2xs text-[hsl(var(--ink-dim))]">{item.type} · {item.source}</p>
        </div>
        <HudBadge tone="caution">{item.badge}</HudBadge>
      </div>
      <p className="mt-2 text-xs text-[hsl(var(--ink-dim))]">{item.summary}</p>
      <p className="mt-2 text-2xs uppercase tracking-[0.1em] text-[hsl(var(--ink-mute))]">{item.confidence}</p>
    </div>
  );
}
