export function HudRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="hud-row">
      <span className="hud-row-key">{label}</span>
      <span className="hud-row-val" style={accent ? { color: `hsl(var(--${accent}))` } : undefined}>{value}</span>
    </div>
  );
}
