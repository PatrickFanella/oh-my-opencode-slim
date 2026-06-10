# Layout Patterns Reference

## 16:9 Framing Container

The universal outer shell for all viewer-facing content. Centers content, restricts to 16:9 ratio, prevents overflow on ultrawide screens.

```html
<div class="grid min-h-screen place-items-center overflow-hidden bg-void text-ink font-body">
  <div class="relative aspect-video w-screen max-w-[calc(100vh*16/9)] overflow-hidden border border-border-faint hud-bracket">
    <!-- all page content goes here -->
  </div>
</div>
```

Key behaviors:
- `grid min-h-screen place-items-center` — centers child both axes, fills viewport
- `aspect-video` — enforces 16:9 ratio
- `w-screen` — full viewport width
- `max-w-[calc(100vh*16/9)]` — caps width to 16:9 based on viewport height (prevents horizontal overflow on ultrawide)
- `hud-bracket` — adds corner bracket pseudo-elements
- `overflow-hidden` — clips content to frame

## Viewer App Shell Layout

```
┌──────────────────────────────────────────────┐
│ HEADER: logo v0.1 · LED · link               │
├──────────────────────────────────────────────┤
│ TAB BAR: [Dashboard] [Records] [Submit]      │
│          [About]                              │
├──────────────────────────────────────────────┤
│              VIEW CONTENT AREA                │
│              (flex-1, scrollable)             │
└──────────────────────────────────────────────┘
```

**Header:**
```html
<header className="border-b border-border-faint bg-panel px-4 py-3">
  <div className="flex items-center gap-4">
    <span className="text-sm font-bold text-signal">BRAND</span>
    <span className="text-2xs text-ink-mute">v0.1</span>
    <StatusLed state="sync" />
    <span className="text-2xs text-ink-dim">mode</span>
    <a href="/operator" className="ml-auto text-2xs text-pulse border border-pulse px-2 py-0.5 hover:bg-panel-raised">
      ADMIN CONSOLE
    </a>
  </div>
</header>
```

**Tab bar:**
```html
<nav className="px-4 flex gap-2" aria-label="View navigation" role="tablist">
  {views.map(view => (
    <TabButton key={view.key} active={activeView === view.key} label={view.label} note={view.note}
      id={`tab-${view.key}`} controls={`panel-${view.key}`}
      onClick={() => setView(view.key)} />
  ))}
</nav>
```

**Content area:**
```html
<main className="flex-1 px-4 pb-4 overflow-y-auto">
  <section id="panel-dashboard" role="tabpanel" aria-labelledby="tab-dashboard" hidden={activeView !== 'dashboard'}>
    {/* view content */}
  </section>
  <!-- more sections with hidden attribute -->
</main>
```

## Overlay Broadcast Layout

```
┌──────────────────────────────────────────────┐
│ STATUS BAR: BRAND · LIVE · PHASE · UPT · ... │
├──────────────────────────────────────────────┤
│ CASE FILE HEADER: topic + prompt              │
├────────────────────────┬─────────────────────┤
│                        │  JURY MANIFEST       │
│    COMMS LOG           │  SIGNALS (Twitch)    │
│    (message feed)        │  QUEUE STATUS        │
│                        │  EVIDENCE / OBJ      │
└────────────────────────┴─────────────────────┘
```

**Status bar:**
```html
<div className="flex items-center gap-6 px-4 py-1.5 border-b border-border-faint bg-void-800 text-2xs uppercase tracking-[0.1em] text-ink-dim">
  <span className="text-signal font-semibold">BRAND</span>
  <StatusLed state="live" />
  <span>LIVE</span>
  <span className="text-ink-mute">|</span>
  <span>PHASE:</span>
  <span className="text-pulse">{phase}</span>
  <span className="flex-1" />
  <span className="text-signal">{uptime}</span>
  <span>{timestamp}</span>
</div>
```

**Case header:**
```html
<div className="px-4 py-2 border-b border-border-faint">
  <p className="text-2xs uppercase tracking-[0.15em] text-ink-mute">CASE FILE</p>
  <p className="text-lg font-bold text-ink truncate">{topic}</p>
  <p className="text-xs text-ink-dim truncate">{prompt}</p>
</div>
```

**Two-column body (calculated height):**
```html
<div className="flex flex-1 min-h-0" style={{ height: 'calc(100% - 146px)' }}>
  {/* Left: message log */}
  <div className="flex-1 flex flex-col min-w-0 border-r border-border-faint">
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4" role="log" aria-live="polite">
      <div className="py-2 space-y-0">
        {turns.map((turn, i) => (
          <MessageRow key={turn.id} {...turn} align={i % 2 === 1 ? 'right' : 'left'} roleColor={roleColor(turn.role)} />
        ))}
      </div>
    </div>
  </div>
  {/* Right: sidebar */}
  <div className="w-[320px] flex flex-col min-h-0 bg-void-800 overflow-y-auto">
    {/* Jury manifest, signals, queue, metadata sections */}
  </div>
</div>
```

**Sidebar section pattern:**
```html
<div className="border-b border-border-faint">
  <div className="px-3 py-1.5 text-2xs uppercase tracking-[0.12em] text-signal flex items-center gap-2">
    <StatusLed state="ok" />
    <span>SECTION TITLE</span>
    <span className="flex-1" />
    <span className="text-ink-mute">META</span>
  </div>
  <div className="px-3 pb-3">
    {/* section content */}
  </div>
</div>
```

**Stinger overlay:**
```html
<div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center motion-safe:animate-stinger-shake">
  <div className="border-3 px-8 py-6 bg-void-900 border-signal">
    <p className="text-xs uppercase tracking-[0.2em] text-signal hud-prompt">COURT STINGER</p>
    <p className="mt-3 text-3xl font-bold text-ink">TITLE</p>
    <p className="mt-2 text-base text-ink-dim">Message</p>
  </div>
</div>
```

## Dashboard Layout

Full-viewport layout (no 16:9 constraint). Tab-based with lazy-loaded panels.

```
┌──────────────────────────────────────────────┐
│ TOP BAR: logo · session selector · links     │
├──────────────────────────────────────────────┤
│ TAB BAR: [Monitor][Broadcast][Moderation]... │
├──────────────────────────────────────────────┤
│              TAB PANEL CONTENT                │
│              (lazy-loaded)                    │
└──────────────────────────────────────────────┘
```

**Body background:** Dark radial gradients + soft-light scanline pseudo-element (see `dashboard-styles.css`).

## Content Grid Patterns

### Two-column with sidebar (280px)
```html
<div className="grid gap-4 xl:grid-cols-[1fr_280px]">
  <div className="space-y-4"><!-- main --></div>
  <div className="space-y-4"><!-- sidebar --></div>
</div>
```
Collapses to single column below `xl` (1280px).

### Two-column with sidebar (320px, search)
```html
<div className="grid gap-4 xl:grid-cols-[320px_1fr]">
  <ConsolePanel className="p-4 flex flex-col min-h-0">
    {/* search form + results list */}
  </ConsolePanel>
  <ConsolePanel className="p-4 flex flex-col min-h-0">
    {/* detail view */}
  </ConsolePanel>
</div>
```

### Single panel stack
```html
<div className="grid gap-4">
  <ConsolePanel className="p-4">...</ConsolePanel>
  <ConsolePanel className="p-4">...</ConsolePanel>
</div>
```

## Overlay Safe Area

Applied to the 16:9 container's inner content when it might be displayed on devices with notches or browser chrome:

```css
.overlay-safe {
  padding-top: max(1rem, env(safe-area-inset-top));
  padding-right: max(1rem, env(safe-area-inset-right));
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
  padding-left: max(1rem, env(safe-area-inset-left));
}
@media (min-width: 1280px) {
  .overlay-safe { padding: max(2rem, env(safe-area-inset-*)); }
}
```

## Responsive Breakpoints

| Breakpoint | Behavior |
|---|---|
| Below `xl` (1280px) | Two-column grids collapse to single column |
| `min-width: 1280px` | `overlay-safe` padding bumps from 1rem to 2rem |
| `sm` (640px) | `MemberRow` note becomes visible (`hidden sm:inline`) |
| Mobile/notch | `env(safe-area-inset-*)` via `overlay-safe` class |

No other breakpoints are defined. The system is designed for 1920×1080 broadcast with 1280×720 downscale tolerance.
