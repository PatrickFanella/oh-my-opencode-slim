export function HudSection({ label, note }: { label: string; note?: string }) {
  return (
    <div className="hud-section">
      <span className="hud-section-label">{label}</span>
      <span className="hud-section-line" />
      {note ? <span className="text-2xs text-[hsl(var(--ink-mute))]">{note}</span> : null}
    </div>
  );
}
