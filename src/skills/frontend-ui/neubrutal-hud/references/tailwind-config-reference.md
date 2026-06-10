# Tailwind Configuration Reference

Full copy: `assets/templates/tailwind.config.js`

## Content Paths

```js
content: [
  './app/index.html',
  './app/src/**/*.{ts,tsx}',
  './dashboard/index.html',
  './dashboard/**/*.{js,ts,jsx,tsx}',
]
```

Both SPAs are scanned. Adjust if your project structure differs.

## Color Tokens

All colors reference CSS variables via `hsl(var(--token))`. This is the key pattern enabling:
- Centralized theming (change `:root` block to re-skin)
- Tailwind's opacity modifier (`bg-signal/50`, `text-ink/80`)
- Arbitrary opacity values (`bg-[hsl(var(--pulse)/0.12)]`)

### Why semantic names?

`void`, `panel`, `ink`, `signal`, `pulse` rather than `gray-900`, `zinc-800`, `purple-500`. Semantic names prevent accidental misuse (e.g., using a border color as a background) and communicate intent. They also survive palette changes without renaming components.

### Nested object structure

```js
void: {
  DEFAULT: 'hsl(var(--void))',     // bg-void
  900: 'hsl(var(--void-900))',     // bg-void-900
  800: 'hsl(var(--void-800))',     // bg-void-800
},
```

`DEFAULT` enables `bg-void`, `text-panel`, etc. Numeric keys are shades (darker=higher number). Only 3 shades per background token; states and accents get `DEFAULT` + `bright`.

## Typography

### Font families

```js
fontFamily: {
  mono: ['"JetBrains Mono"', '"SF Mono"', '"Cascadia Code"', '"Fira Code"', 'monospace'],
  body: ['"JetBrains Mono"', '"SF Mono"', 'monospace'],
}
```

Use `font-mono` for code blocks, `font-body` for general UI text. Import JetBrains Mono from Google Fonts (400/500/600/700/800 + italic).

### Font sizes

11 entries from `text-2xs` (10px) to `text-5xl` (48px). All have explicit `letterSpacing` for HUD precision. The `hud` size (11px) is for micro-labels. Base is 14px (`text-base`).

### Tracking values

| Class | Tracking | Usage |
|---|---|---|
| `text-2xs` | `0.06em` | Timestamps, IDs |
| `text-hud` | `0.08em` | HUD labels |
| `text-sm` | `0.04em` | Metadata |
| `text-base` | `0.02em` | Body |
| `text-4xl` | `-0.02em` | Large display (tight) |
| `text-5xl` | `-0.03em` | Hero (tightest) |

Additional tracking applied via arbitrary values: `tracking-[0.10em]`, `tracking-[0.12em]`, `tracking-[0.15em]`, `tracking-[0.20em]`.

## Spacing

4px base unit. 14 custom stops from `0` to `24` (96px). `hud` is an alias for `0.25rem` (1 unit). `px` is `1px` for hairline borders/spacers.

## Border Width

```js
borderWidth: { '3': '3px' }
```

Adds `border-3` utility. Used exclusively for stinger frames and high-impact overlays. Standard borders use `border` (1px) or `border-2` (2px for message role edges).

## Animations

6 keyframe animations:

| Class | Duration | Easing | Use case |
|---|---|---|---|
| `animate-blink` | 1s | step-end infinite | Cursor blink |
| `animate-slide-in-right` | 0.2s | ease-out | Panel entry |
| `animate-slide-in-up` | 0.2s | ease-out | Toast/popup entry |
| `animate-stinger-shake` | 0.3s | ease-out | Objection/high-impact |
| `animate-scan` | 3s | linear infinite | Scanline sweep |
| `animate-pulse-slow` | 3s | ease-in-out infinite | Waiting states |

### Usage with motion safety

Always prefix with `motion-safe:` when the animation could be disorienting:
```html
<div class="motion-safe:animate-stinger-shake">...</div>
```

Reduced motion media query is handled globally in `app-styles.css` (forces `0.01ms` duration on all animations/transitions).

## Plugin Configuration

No Tailwind plugins. The system relies on:
- `tailwindcss` for utility generation
- `autoprefixer` for vendor prefixes
- Custom CSS in `app-styles.css` for HUD-specific pseudo-elements

## Common Extension Points

### Adding a new color token

1. Add CSS variable to `:root` in `app-styles.css`:
   ```css
   --new-token: 200 50% 50%;
   ```

2. Add to `tailwind.config.js`:
   ```js
   newToken: {
     DEFAULT: 'hsl(var(--new-token))',
     bright: 'hsl(var(--new-token-bright))',
   },
   ```

3. Use: `bg-newToken`, `text-newToken-bright`

### Adding a new font size

1. Add to `tailwind.config.js` fontSize section with explicit line-height and tracking.

### Adding a new animation

1. Define keyframes in `tailwind.config.js`
2. Add animation shorthand
3. Always provide a `motion-safe:` alternative
