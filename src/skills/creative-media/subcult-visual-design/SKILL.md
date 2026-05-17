---
name: subcult-visual-design
description: "Design UI, graphics, and visual assets in SUBCULT's aesthetic territory: 90s anime futurism, glitch, VHS/CRT, terminal glow, occult insignia, underground label energy. Use when building frontends, creating visual assets, choosing palettes, or reviewing design for any SUBCULT or sub-brand project. Triggers: subcult design, subcult UI, subcult palette, subcult aesthetic, subcult visual, subcult style."
---

> **See also:** `subcult-brand-voice` (writing in SUBCULT's voice), `subcult-worldbuilding` (agent identities, sub-brands, mythic structure), `frontend-design` (general production-grade frontend), `tool-design-style-selector` (design system creation).

# SUBCULT Visual Design

Design interfaces, graphics, and visual assets that feel like SUBCULT: futuristic but haunted by media history, digital but tactile, designed but rough-edged with intention.

## Aesthetic Territory

SUBCULT's visual language lives in the overlap of:

- **90s anime futurism** — Evangelion, Akira, Ghost in the Shell
- **Cyberpunk / post-cyberpunk** — not clean sci-fi, lived-in futures
- **Glitch aesthetics** — intentional corruption as design element
- **VHS/CRT degradation** — scanlines, noise, analog warmth
- **Underground label graphics** — record sleeves, zine covers
- **Zine / xerox punk collage** — layered, imperfect, handmade energy
- **Tactical UI** — HUDs, dashboards, status panels, system readouts
- **Occult insignia** — seals, sigils, symbolic marks
- **Terminal / systems dashboard** — monospace, status indicators, data grids
- **Soft apocalypse / neon ruin** — beauty in damaged systems
- **Broadcast graphics** — title cards, lower thirds, overlay HUDs
- **CMYK misalignment** — print registration errors as design element
- **Hand-drawn elements** — sketched annotations, imperfect marks amid digital precision

The result should feel:
- futuristic, but haunted by media history
- digital, but tactile
- designed, but rough-edged intentionally
- symbolic, but not ornamental for ornament's sake

## Color System

### Palette psychology
- **Purple** — mystery, intelligence, synthetic soul, nocturnal aura
- **Green** — terminals, signal, surveillance inversion, active systems, eerie life
- **Dark backgrounds** — immersion, seriousness, cinematic depth
- **Bright accents** — alerts, identity markers, symbolic emphasis
- **Pastel contrast** — softness amid machinery, human feeling amid systems

### Palette feel
**Terminal glow + anime warning light + midnight print shop + occult dashboard + pirate broadcast station**

### Reference palettes
Dracula / Catppuccin-adjacent mood. Dark base with saturated accent pops.

### Example tokens (adapt per project)
```
--bg-deep:      #0d0d14
--bg-surface:   #1a1a2e
--bg-elevated:  #252540
--text-primary: #e2e0f0
--text-muted:   #8888aa
--accent-purple: #bd93f9
--accent-green:  #50fa7b
--accent-pink:   #ff79c6
--accent-orange: #ffb86c
--accent-cyan:   #8be9fd
--accent-yellow: #f1fa8c
--warning:       #ffb86c
--danger:        #ff5555
```

## Typography

Mix these type layers:
- **Sharp modern sans-serif** — headings, navigation, primary UI (Inter, Geist, Instrument Sans)
- **Monospaced / terminal** — system language, code, status labels, data (JetBrains Mono, Berkeley Mono, Iosevka)
- **Condensed display** — occasional symbolic headers, section breaks (Bebas Neue, Barlow Condensed)

Typography should feel: engineered, editorial, slightly militant, emotionally charged without becoming unreadable.

## Graphic Language

Use these elements as part of the design system:
- Framing lines and borders
- Status labels (`[ACTIVE]`, `[ARCHIVED]`, `[SIGNAL]`)
- Module boxes / panel headers
- Warning-style tags and badges
- Annotation callouts
- Texture overlays (noise, grain, scanlines)
- Offset print-style imperfection
- Insignias / emblems / seals
- Dossier-like page structures

## Logo & Symbol Logic

SUBCULT marks should feel less like startup logos and more like:
- a seal or transmission mark
- a unit insignia or collective emblem
- a record-label symbol or systems crest

The mark should suggest: multiplicity, coordination, signal, hidden infrastructure, identity through structure.

Should feel at home on: a terminal splash screen, a zine cover, a project banner, a server rack sticker, an ops dashboard, a broadcast overlay.

## UI Patterns

### Dashboard / app UI
- Dark mode default, always
- Dense but scannable information layout
- Status indicators, not decorative illustration
- Monospace for system data, sans-serif for human-facing text
- Subtle scanline or grain texture on backgrounds (optional, never distracting)
- Accent colors for state: green=active, purple=identity, orange=warning, red=critical

### Landing pages / marketing
- Can be more atmospheric and expressive
- Collage-adjacent layouts welcome
- Full-bleed dark sections with typographic drama
- Avoid sterile SaaS landing page conventions (no stock photos, no "trusted by" logos, no fake dashboard screenshots)

## Anti-patterns

- Clean, bland corporate software aesthetic
- Sterile enterprise fake-seriousness
- Flat minimalism with no texture or personality
- Gratuitous skeuomorphism
- Hyper-polished until the soul leaks out
- Empty edgy aesthetics with no structural backing
- Stock photography of any kind
- Generic gradient backgrounds

## Design review checklist

When reviewing SUBCULT visual work, check:
- [ ] Does it feel underground but competent?
- [ ] Is there tension between system and myth?
- [ ] Would it look at home on a zine cover AND a terminal?
- [ ] Are the colors in the right territory (dark + saturated accents)?
- [ ] Does the typography mix intentionally (sans + mono + display)?
- [ ] Is there texture/grain/imperfection, or is it too clean?
- [ ] Does it avoid startup-SaaS visual conventions?
- [ ] Would the SUBCULT audience recognize this as theirs?
