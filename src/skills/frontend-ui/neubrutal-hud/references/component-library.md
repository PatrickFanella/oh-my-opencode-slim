# Component Library Reference

All primitives in `assets/templates/components/`. Each is a standalone React functional component with zero external dependencies beyond React and the `cn` utility.

## Shared Utility

```ts
// cn-utility.ts
export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}
```

Classnames merge helper. Supports conditional classes as falsy values.

---

## ConsolePanel

Base panel container. Always `border border-border-faint bg-panel`.

```tsx
function ConsolePanel({ className, children }: { className?: string; children: ReactNode })
```

**Usage:**
```tsx
<ConsolePanel className="p-4">
  <HudSection label="TITLE" />
  {/* panel body */}
</ConsolePanel>
```

**Tailwind:** `border border-[hsl(var(--border-faint))] bg-[hsl(var(--panel))]`

---

## HudSection

Section header with decorative horizontal line.

```tsx
function HudSection({ label, note }: { label: string; note?: string })
```

**Renders:**
```
[ACCENT LABEL] ──────────────────── optional note
```

**CSS classes used:** `hud-section`, `hud-section-label` (signal-colored, uppercase, tracking 0.12em, 0.6875rem, font-weight 600), `hud-section-line` (flex-1 divider).

---

## StatusLed

6×6px indicator dot. `aria-hidden="true"` — always paired with a text label.

```tsx
function StatusLed({ state }: { state: 'live' | 'sync' | 'ok' | 'warn' | 'dead' })
```

| State | CSS class | Color | Effect |
|---|---|---|---|
| `live` | `hud-led-live` | `alert` | Red + glow box-shadow |
| `sync` | `hud-led-sync` | `pulse` | Indigo + glow |
| `ok` | `hud-led-ok` | `confirm` | Teal + glow |
| `warn` | `hud-led-warn` | `caution` | Amber + glow |
| `dead` | (none) | `dead` | Muted grey, no glow |

---

## HudBadge

Inline badge/chip. Tone determines border and text color via inline style.

```tsx
function HudBadge({ children, tone = 'ink-dim' }: { children: ReactNode; tone?: string })
```

**Tailwind:** `inline-flex items-center border px-1.5 py-0 text-2xs uppercase tracking-[0.12em]`

**Inline style:** `borderColor: hsl(var(--tone))`, `color: hsl(var(--tone))`

Valid tones: any CSS variable name like `alert`, `caution`, `confirm`, `pulse`, `signal`, `ink-dim`, `ink-mute`.

---

## TabButton

Accessible tab button with ARIA attributes and keyboard navigation.

```tsx
function TabButton({
  active, label, note, onClick,
  controls, id, onKeyDown,
}: {
  active: boolean; label: string; note: string; onClick: () => void;
  controls?: string; id?: string; onKeyDown?: (e: KeyboardEvent) => void;
})
```

| State | Border | Background |
|---|---|---|
| Active | `border-pulse` | `bg-panel-raised` |
| Inactive | `border-border-faint` | `bg-panel` |
| Hover (inactive) | `hover:border-pulse` | `hover:bg-panel-raised` |
| Focus | `focus-visible:ring-1 focus-visible:ring-pulse` |

**ARIA:** `role="tab"`, `aria-selected`, `aria-controls`, `tabIndex={active ? 0 : -1}`.

---

## HudRow

Terminal-style key:value row. CSS class-based layout.

```tsx
function HudRow({ label, value, accent }: { label: string; value: string; accent?: string })
```

**CSS classes:** `hud-row` (flex, baseline, gap 0.5rem), `hud-row-key` (muted, uppercase, tracking, `::after` → `":"`), `hud-row-val` (ink color, font-weight 500).

`accent` prop applies inline `color: hsl(var(--${accent}))` to the value. Use token names like `caution`, `confirm`, `alert`.

---

## MessageRow

Feed entry with role-colored border and alternating alignment. Use for chat, transcripts, activity logs, comms feeds.

```tsx
function MessageRow({
  speaker, role, body, index, context, align, roleColor,
}: {
  speaker: string; role: string; body: string; index: number; context: string;
  align: 'left' | 'right'; roleColor: string;
})
```

**Layout:** Left-aligned by default. When `align === 'right'`, flips to right-justify with border on right side.

| Property | Left variant | Right variant |
|---|---|---|
| Flex direction | `justify-start text-left` | `justify-end text-right` |
| Border | `border-l-2 pl-3` | `border-l-0 border-r-2 pl-0 pr-3` |
| Max width | `max-w-[88%]` | `max-w-[88%]` |

**Role tag:** 5-char uppercase abbreviation of the role string.

**Metadata line:** `#index · context` in `text-2xs uppercase tracking-[0.1em] text-ink-mute`.

**Body:** `text-sm leading-relaxed text-ink-dim`.

---

## RecordCard

Full-width selectable data record card.

```tsx
function RecordCard({ item, active, onClick }: {
  item: RecordItem; active: boolean; onClick: () => void
})
```

**RecordItem type:**
```ts
type RecordItem = {
  id: string; label: string; title: string; summary: string;
  severity: 'Low' | 'Medium' | 'High'; tags: string[];
}
```

**States:** Same active/inactive/hover/focus pattern as TabButton.

**Severity badge colors:** `alert` for High, `caution` for Medium, `ink-mute` for Low.

**Sections:** Label (signal, 2xs, uppercase) → Title (sm, semibold) → Severity badge → Summary (xs, line-clamp-2) → Tags (flex-wrap HudBadge chips).

---

## AssetRow

Attached asset/item card.

```tsx
function AssetRow({ item }: { item: AssetItem })
```

**AssetItem type:**
```ts
type AssetItem = {
  id: string; label: string; type: string; source: string;
  confidence: string; summary: string; badge: string;
}
```

**Fixed classes:** `border border-border-faint bg-panel p-3`
**Badge:** Caution-colored by default.
**Footer:** Metadata in `text-2xs uppercase tracking-[0.1em] text-ink-mute`.

---

## ChoiceCard

Selectable choice/option button with disabled state. Use for polls, ballots, settings, action selection.

```tsx
function ChoiceCard({ choice }: { choice: Choice })
```

**Choice type:**
```ts
type Choice = { label: string; reason: string; note: string; disabled: boolean }
```

| State | Border | Background | Cursor | Badge |
|---|---|---|---|---|
| Enabled | `border-border-faint` | `bg-panel` | default | `confirm` / OPEN |
| Disabled | `border-border-faint` | (none) | `cursor-not-allowed` | `alert` / LOCKED |
| Hover (enabled) | `hover:border-pulse` | (none) | — | — |
| Focus | `focus-visible:ring-1 focus-visible:ring-pulse` | — | — | — |

Disabled also gets `opacity-60`. `aria-describedby` links to the reason paragraph.

---

## MemberRow

Group/panel member row with status dot indicator.

```tsx
function MemberRow({ member }: { member: Member })
```

**Member type:**
```ts
type Member = {
  id: string; label: string;
  status: 'Active' | 'Mixed' | 'Pending' | 'Inactive' | 'Unknown';
  note: string;
}
```

**Dot color mapping:**
| Status | Token |
|---|---|
| Active | `confirm` |
| Mixed | `caution` |
| Pending | `pulse` |
| Inactive | `alert` |
| Unknown | `signal` |

**Layout:** `flex items-center gap-2 py-1` with `border-b border-border-faint/0.4 last:border-0`.
**Dot:** `size-2` colored square (via `bg-[hsl(var(--${dotColor}))]`), `aria-hidden="true"`.
**Note:** `hidden sm:inline` — only visible on small screens and up.

## Common Composition Patterns

### Panel with section header + items

```tsx
<ConsolePanel className="p-4">
  <HudSection label="SECTION" note="optional" />
  <div className="space-y-2">
    {items.map(item => <RecordCard key={item.id} item={item} active={false} onClick={handleSelect} />)}
  </div>
</ConsolePanel>
```

### Status bar row

```tsx
<div className="flex items-center gap-6 px-4 py-1.5 border-b border-border-faint bg-void-800 text-2xs uppercase tracking-[0.1em] text-ink-dim">
  <StatusLed state="sync" />
  <span>STATUS</span>
  <span className="text-ink-mute">|</span>
  <span>META</span>
  <span className="flex-1" />
  <span className="text-signal">VALUE</span>
</div>
```

### Accent button

```tsx
<button className="w-full border border-pulse bg-[hsl(var(--pulse)/0.12)] px-3 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-pulse hover:bg-[hsl(var(--pulse)/0.24)] disabled:opacity-40 disabled:cursor-not-allowed">
  ACTION
</button>
```

### Input field

```tsx
<input className="w-full border border-border-faint bg-void-800 px-3 py-1.5 text-xs text-ink outline-none placeholder:text-ink-mute focus:border-pulse" />
```
