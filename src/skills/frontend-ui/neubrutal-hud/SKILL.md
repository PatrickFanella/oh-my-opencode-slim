---
name: neubrutal-hud
description: >
  Neubrutal HUD design system for high-contrast broadcast interfaces,
  dashboards, and control panels. Semantic HSL color tokens via CSS
  variables, custom Tailwind v3 configuration, and 12 reusable React
  primitives (ConsolePanel, HudSection, StatusLed, TabButton,
  MessageRow, RecordCard, etc.). Dark-only theme with hard-edged
  neubrutalist aesthetic: flat colors, hard borders, monospace
  micro-labels, and scannable uppercase typography. 16:9 broadcast
  framing, two-SPA architecture pattern (public overlay + operator
  dashboard), and HUD CSS utilities (corner brackets, LEDs, scanlines,
  prompt markers). Use when building any broadcast overlay, live
  dashboard, control panel, or data-heavy terminal-style interface.
  Use for Tailwind config setup, HUD component composition, semantic
  color theming, overlay/sidebar layouts, accessibility-first
  interaction patterns, or CSS-driven HUD effects.
---

# Neubrutal HUD Design System

## Quick start

### Bootstrap a project

```bash
bash scripts/init-neubrutal-hud.sh /path/to/target-project
```

Copies the Tailwind config, PostCSS config, CSS templates, and all component templates into your project.

### Manual setup

1. Copy `assets/templates/tailwind.config.js` → your project root
2. Copy `assets/templates/postcss.config.js` → your project root
3. Copy `assets/templates/app-styles.css` → your public-facing SPA entry CSS
4. Copy `assets/templates/dashboard-styles.css` → your dashboard SPA entry CSS (optional)
5. Import JetBrains Mono from Google Fonts
6. Install `tailwindcss@^3`, `autoprefixer@^10`, `postcss@^8`

### Compose a panel

```tsx
import { ConsolePanel, HudSection } from './components';

<ConsolePanel className="p-4">
  <HudSection label="SYSTEM STATUS" note="nominal" />
  {/* content */}
</ConsolePanel>
```

## Design system overview

**Aesthetic:** "Neubrutal HUD" — high-contrast instrumentation panel. Terminal discipline meets sci-fi functionalism. Designed for broadcast, dashboards, and operator consoles.

**Core rules:**
- Flat colors. No gradients in the public-facing layer. No glassmorphism.
- Hard borders (`border`, `border-3`). Sharp corners (`radius-0` to `radius-[2px]`).
- Monospace primary (JetBrains Mono). Uppercase micro-labels. Large readable body text.
- Deliberate asymmetry. Clear panel-grouping hierarchy.
- Primary accents: purple (`signal`) and indigo (`pulse`). Use teal (`confirm`) sparingly.

**Two-surface architecture:** A strict neubrutalist public/overlay surface (flat, hard, letterboxed) and an optional atmospheric dashboard surface (dark radial gradients + subtle scanlines). Both share one Tailwind token vocabulary.

## Resource map

### References (load when needed)

| File | Contents | When to load |
|------|----------|-------------|
| `references/color-tokens.md` | Complete HSL color system, semantic roles, state semantics, dashboard palette | Choosing colors, theming, adding new tokens |
| `references/component-library.md` | All 12 primitive components with props, classes, and usage | Building or extending components |
| `references/layout-patterns.md` | 16:9 framing, shell layout, broadcast overlay layout, dashboard layout, grid patterns | Building page layouts, responsive design |
| `references/tailwind-config-reference.md` | Annotated tailwind.config.js explained section by section | Understanding or modifying the config |

### Assets (copy into project)

| File | Purpose |
|------|---------|
| `assets/templates/tailwind.config.js` | Complete Tailwind v3 config |
| `assets/templates/postcss.config.js` | PostCSS config (Tailwind + Autoprefixer) |
| `assets/templates/app-styles.css` | Primary CSS: CSS variables, base reset, HUD utilities, scrollbars, reduced motion |
| `assets/templates/dashboard-styles.css` | Dashboard CSS: atmospheric palette, gradient background, scanline overlay |
| `assets/templates/components/*.tsx` | All 12 primitive React components + `cn` utility |

### Scripts

| File | Purpose |
|------|---------|
| `scripts/init-neubrutal-hud.sh` | Bootstrap a project: copy all templates, print setup instructions |

## Key design decisions

1. **CSS variables as single source of truth.** Tailwind tokens reference `hsl(var(--token))`, so theming is a `:root` block swap.
2. **No component library dependencies.** No Radix, shadcn, Headless UI. Pure Tailwind + React.
3. **Two visual treatments, one token vocabulary.** Public surface is strict neubrutalist; dashboard surface has atmospheric depth. Both use the same Tailwind color tokens.
4. **16:9 framing for broadcast content.** Letterboxed, not responsive. Safe-area-aware for mobile overlays.
5. **Dynamic color via inline styles.** When color depends on runtime data (roles, states), use `style={{ color: \`hsl(var(--${token}))\` }}`.
6. **No CSS modules or CSS-in-JS.** One global CSS file per SPA + Tailwind utilities.

## Accessibility principles

- Content feeds: `role="log" aria-live="polite"` for live-updating regions
- Tabs: `role="tab" aria-selected aria-controls` with keyboard arrow navigation
- State indicators: LEDs with `aria-hidden="true"` always paired with text labels
- Focus: `focus-visible:ring-1 focus-visible:ring-[hsl(var(--pulse))]` on all interactive elements
- Motion: `prefers-reduced-motion` respected globally; `motion-safe:` prefix on animations
- Never color alone: always pair with labels, icons, or motion

## Responsive behavior

- **Overlay/broadcast:** 16:9 letterboxed. `overlay-safe` class handles `env(safe-area-inset-*)`.
- **Dashboard columns:** `xl:grid-cols-[1fr_280px]` — collapses to single column below 1280px.
- **Search layouts:** `xl:grid-cols-[320px_1fr]` — search sidebar collapses below 1280px.
- **Padding bump:** `overlay-safe` goes from `1rem` to `2rem` at `min-width: 1280px`.

## Customizing the color palette

The entire system is themed through two `:root` blocks:

1. **Primary palette** in `app-styles.css` — defines `--void`, `--panel`, `--ink`, `--signal`, `--pulse`, state colors, etc.
2. **Dashboard palette** in `dashboard-styles.css` — defines the ambient gradient background colors.

To re-theme: swap the HSL values in these `:root` blocks. All Tailwind classes update automatically since they reference `hsl(var(--token))`. See `references/color-tokens.md` for the full token map.
