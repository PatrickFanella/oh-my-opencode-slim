# Color Tokens Reference

## Primary Palette (`:root` in `app-styles.css`)

All colors use HSL to enable Tailwind's opacity modifier syntax (`bg-signal/50`, `text-ink/80`).

### Background Hierarchy

| CSS Variable | HSL | Hex | Tailwind | Usage |
|---|---|---|---|---|
| `--void` | `240 10% 4%` | `#09090B` | `bg-void` | Main canvas |
| `--void-900` | `240 8% 8%` | — | `bg-void-900` | Dark but not black |
| `--void-800` | `240 6% 12%` | — | `bg-void-800` | Slightly lifted |
| `--panel` | `240 5% 14%` | `#27272A` | `bg-panel` | Panel surfaces |
| `--panel-raised` | `240 6% 18%` | — | `bg-panel-raised` | Active/hover |

### Borders

| CSS Variable | HSL | Tailwind | Usage |
|---|---|---|---|
| `--border` | `240 4% 26%` | `border-border` | Standard |
| `--border-strong` | `240 4% 38%` | `border-border-strong` | Emphasized |
| `--border-faint` | `240 4% 18%` | `border-border-faint` | Subtle |

### Text

| CSS Variable | HSL | Hex | Tailwind | Usage |
|---|---|---|---|---|
| `--ink` | `0 0% 98%` | `#FAFAFA` | `text-ink` | Primary text |
| `--ink-dim` | `240 5% 72%` | `#A1A1AA` | `text-ink-dim` | Secondary/metadata |
| `--ink-mute` | `240 4% 48%` | — | `text-ink-mute` | Tertiary/disabled |

### Accents

| CSS Variable | HSL | Hex | Tailwind | Usage |
|---|---|---|---|---|
| `--signal` | `271 91% 65%` | `#A855F7` | `text-signal` | Primary accent (purple) |
| `--signal-bright` | `271 95% 75%` | — | `text-signal-bright` | Brighter variant |
| `--pulse` | `239 84% 70%` | `#6366F1` | `text-pulse` | Secondary accent (indigo) |
| `--pulse-bright` | `239 88% 78%` | — | `text-pulse-bright` | Brighter variant |

### States

| CSS Variable | HSL | Hex | Tailwind | Usage |
|---|---|---|---|---|
| `--alert` | `347 77% 56%` | `#F43F5E` | `text-alert` | Error/rejected |
| `--caution` | `38 92% 52%` | `#F59E0B` | `text-caution` | Warning/attention |
| `--confirm` | `174 80% 42%` | `#14B8A6` | `text-confirm` | Success/completed |
| `--dead` | `240 4% 38%` | — | `text-dead` | Inactive/disabled |

## State Color Semantics

| State | Token | When to use |
|---|---|---|
| Live / active | `signal` | Live indicators, stingers, premium events |
| Sync / info | `pulse` | Sync LEDs, phase markers, notifications |
| Success / confirmed | `confirm` | Approved actions, completed (use sparingly) |
| Warning / pending | `caution` | Queue delays, attention states |
| Error / failed | `alert` | Failed calls, disconnected, rejected |
| Neutral / idle | `dead` / `ink-mute` | Unknown state, waiting, disabled |

## Dynamic Role Color Pattern

When entity colors depend on runtime data (speaker roles, statuses, categories), use a mapping function that returns `hsl(var(--token))` strings. Apply via inline `style={{ color: roleColor }}` or `style={{ borderColor: roleColor }}`.

**Example** — map domain roles to semantic tokens:

```ts
function roleColor(role: string) {
  switch (role) {
    case 'primary':   return 'hsl(var(--signal))';   // purple accent
    case 'secondary': return 'hsl(var(--pulse))';    // indigo accent
    case 'success':   return 'hsl(var(--confirm))';  // teal
    case 'warning':   return 'hsl(var(--caution))';  // amber
    case 'muted':     return 'hsl(var(--ink-dim))';  // grey secondary
    default:          return 'hsl(var(--ink))';      // white primary
  }
}
```

Each role also gets a short uppercase label (max 5 chars) for transcript-style entries. The combination of color + label ensures accessibility (never color alone).

## Dashboard Palette (Separate `:root` in `dashboard-styles.css`)

These set the ambient dark gradient background. Components inside dashboard panels use the **same primary palette tokens** from the shared Tailwind config.

| CSS Variable | HSL | Usage |
|---|---|---|
| `--bg` | `210 42% 7%` | Canvas base |
| `--surface` | `212 38% 10%` | Panel surfaces |
| `--surface-2` | `212 34% 14%` | Raised surfaces |
| `--border` | `205 28% 23%` | Panel borders |
| `--text` | `205 40% 92%` | Primary text |
| `--muted` | `207 18% 64%` | Secondary text |
| `--cyan` | `190 92% 58%` | Primary accent |
| `--purple` | `260 75% 62%` | Secondary accent |
| `--red` | `3 89% 59%` | Error/danger |
| `--gold` | `38 68% 60%` | Warning |
| `--green` | `145 64% 50%` | Success |

## Using Colors in Code

### Tailwind classes (preferred when static)

```html
<div class="bg-void-800 border border-border-faint text-ink-dim">
  <span class="text-signal font-semibold">LIVE</span>
</div>
```

### Inline styles (when dynamic)

```tsx
<span style={{ color: `hsl(var(--${tone}))` }}>{label}</span>
<span style={{ borderColor: roleColor }} />
```

### Opacity via Tailwind modifier

```html
<div class="bg-signal/10 text-ink/80 border-border/50">...</div>
<div class="bg-[hsl(var(--pulse)/0.12)]">...</div>
```

Works because all tokens are HSL, which Tailwind can split into H S L components for opacity.
