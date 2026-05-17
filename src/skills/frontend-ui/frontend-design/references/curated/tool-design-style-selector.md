# Tool Design Style Selector

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `tool-design-style-selector-skill.md`

_Source topic: tool-design-style-selector_

**Purpose:** Use when you need to define or converge a project's visual direction. Scan project documentation to identify intent, then produce a design-system.md (either preserve existing style or pick from 30 presets). Triggers: design system, design spec, UI style, visual style, design tokens, color palette, typography, layout. Flow: scan → intent → (gate) preserve vs preset → deploy design-system.md after confirmation → (default) implement UI/UX per design-system.md (plan first, then execute).

# Design Style Selector

Scan project, identify intent, recommend and deploy the most suitable design system style.

## Style Presets

This skill can either:

1) **Preserve existing style** and extract it into `design-system.md` (recommended when the project already looks “mature”), or

- `styles-index.md` (ID → filename → theme)

Quick examples of presets:
- `05-saas` (B2B tools, dashboards)
- `08-swiss-minimalist` (clean hierarchy, corporate)
- `13-neo-brutalism` (bold, indie/creative)
- `19-minimal-dark` (focus mode, dev tools)

## Execution Flow

### Step 1: Scan Project
```
Scan the following files to identify project intent:
- README.md / README
- package.json / pyproject.toml / Cargo.toml
- Existing Claude.md / agent.md / AGENTS.md
- src/ or app/ directory structure
- Existing style files (tailwind.config, globals.css)
- Brand assets (logo, favicon)
```

### Step 2: Analyze Intent
- **Project Type**: SaaS/corporate site/e-commerce/blog/tool/game/...
- **Target Users**: Developers/enterprises/consumers/children/professionals/...
- **Brand Tone**: Professional/playful/luxury/minimal/bold/...
- **Tech Stack**: React/Vue/Next.js/static site/...
...

# Stack-specific implementation constraints (pick the actual project stack)
python3 "${AGENT_SKILLS_HOME:-~/.claude/skills}/tool-ui-ux-pro-max/scripts/search.py" "layout responsive" --stack nextjs
```

### Step 4: User Confirmation
- Present recommendation reasons
- Allow user to select or request more options
- Proceed to deployment after confirmation

### Step 5: Deploy Design System
```
1. Copy selected style file to project
2. Rename to design-system.md
3. Placement location:
   - Primary: Project root directory
   - Alternative: docs/ or .cursor/ or .claude/
4. If Claude.md / agent.md exists:
   - Add reference at the top of that file
   - Explain that design-system.md is the unified design constraint
```

> If "preserve existing style" was selected in Step 2.5: "deployment" here is not copying a preset, but writing the tokens, typography rules, component style constraints you extracted from code/styles into `design-system.md` (also placed at root).

### Step 6: Implement UI/UX According to design-system.md (Execute by Default)

> The goal of this step is: **Make design-system.md actually "live in the UI"**, not just generate a document and stop.

Execution requirements:
- First produce an executable UI/UX transformation plan (clearly specify which pages/components, scope of changes, acceptance criteria, how to rollback).
- Then implement according to plan (when involving large-scale visual/layout/interaction changes, must have confirmation points).

Recommended implementation order (start from "where it can best align the style"):
1. **Design tokens / global style entry**: Fonts, colors, spacing, radius, shadows, basic typography (prioritize centralizing in one place, avoid scattering).
2. **Component layer**: Unify style for buttons, inputs, cards, dialogs and other base components (to be reused by all pages later).
3. **Page layer**: Prioritize changing "first impression pages" and "core flow pages" to ensure overall consistency.

Note:
- If user explicitly states "don't want to change UI, just want documentation", skip this step and record the reason (e.g., write to run's notes/summary).
...
```
...


### From `styles-index.md`

_Source topic: styles-index_

# Style File Index
Place style prompt files in the `styles/` directory, naming format: `[id]-[name].md`
## File List
| ID | Filename | Theme |
|----|----------|-------|
| 01 | `01-monochrome.md` | Light |
| 02 | `02-bauhaus.md` | Light |
| 03 | `03-modern-dark.md` | Dark |
| 04 | `04-newsprint.md` | Light |
| 05 | `05-saas.md` | Light |
| 06 | `06-luxury.md` | Light |
| 07 | `07-terminal.md` | Dark |
| 08 | `08-swiss-minimalist.md` | Light |
| 09 | `09-kinetic.md` | Dark |
| 10 | `10-flat-design.md` | Light |
| 11 | `11-art-deco.md` | Dark |
| 12 | `12-material-design.md` | Light |
| 13 | `13-neo-brutalism.md` | Light |
| 14 | `14-bold-typography.md` | Dark |
| 15 | `15-academia.md` | Light |
| 16 | `16-cyberpunk.md` | Dark |
| 17 | `17-web3.md` | Dark |
| 18 | `18-playful-geometric.md` | Light |
| 19 | `19-minimal-dark.md` | Dark |
| 20 | `20-claymorphism.md` | Light |
| 21 | `21-professional.md` | Light |
| 22 | `22-botanical.md` | Light |
| 23 | `23-vaporwave.md` | Dark |
| 24 | `24-enterprise.md` | Light |
| 25 | `25-sketch.md` | Light |
| 26 | `26-industrial.md` | Light |
| 27 | `27-neumorphism.md` | Light |
| 28 | `28-organic.md` | Light |
| 29 | `29-maximalism.md` | Light |
| 30 | `30-retro.md` | Light |

### From `01-monochrome.md`

_Source topic: 01-monochrome_

# Design Style: Minimalist Monochrome

## Design Philosophy

### Core Principle

**Reduction to Essence.** Minimalist Monochrome strips design down to its most fundamental elements: black, white, and typography. There are no accent colors to hide behind, no gradients to soften edges, no shadows to create false depth. Every design decision must stand on its own merit. This is design as discipline—where restraint becomes the ultimate form of expression.

### Visual Vibe

- High-end fashion editorials (Vogue, Harper's Bazaar covers)
- Architectural monographs and museum catalogs
- Luxury brand identities (Chanel, Celine, Bottega Veneta)
- Award-winning book design and fine typography
- Gallery exhibition materials

### What This Design Is NOT

- ❌ Colorful or playful
- ❌ Soft, rounded, or friendly
- ❌ Gradient-based or with accent colors
- ❌ Shadow-heavy or "elevated"
- ❌ Generic or template-like
- ❌ Busy or cluttered
- ❌ Similar to "Minimalist Modern" (no blue accents, no gradients, no rounded corners)

### The DNA of Minimalist Monochrome

#### 1. Pure Black & White Palette
No grays for primary elements—use true black (#000000) and true white (#FFFFFF). Gray is reserved only for secondary text and borders. The stark contrast creates immediate visual impact and forces deliberate hierarchy decisions.

#### 2. Serif Typography as Hero

#### 3. Oversized Type Scale

#### 4. Line-Based Visual System
...


### From `02-bauhaus.md`

_Source topic: 02-bauhaus_

# Design Style: Bauhaus

## 1. Design Philosophy
The Bauhaus style embodies the revolutionary principle "form follows function" while celebrating pure geometric beauty and primary color theory. This is **constructivist modernism**—every element is deliberately composed from circles, squares, and triangles. The aesthetic should evoke 1920s Bauhaus posters: bold, asymmetric, architectural, and unapologetically graphic.

**Vibe**: Constructivist, Geometric, Modernist, Artistic-yet-Functional, Bold, Architectural

**Core Concept**: The interface is not merely a layout—it is a **geometric composition**. Every section is constructed rather than designed. Think of the page as a Bauhaus poster brought to life: shapes overlap, borders are thick and deliberate, colors are pure primaries (Red #D02020, Blue #1040C0, Yellow #F0C020), and everything is grounded by stark black (#121212) and clean white.

- **Geometric Purity**: All decorative elements derive from circles, squares, and triangles
- **Hard Shadows**: 4px and 8px offset shadows (never soft/blurred) create depth through layering
- **Color Blocking**: Entire sections use solid primary colors as backgrounds
- **Thick Borders**: 2px and 4px black borders define every major element
- **Asymmetric Balance**: Grids are used but intentionally broken with overlapping elements
- **Constructivist Typography**: Massive uppercase headlines (text-6xl to text-8xl) with tight tracking
- **Functional Honesty**: No gradients, no subtle effects—everything is direct and declarative

## 2. Design Token System (The DNA)

### Colors (Single Palette - Light Mode)
-   `background`: `#F0F0F0` (Off-white canvas)
-   `foreground`: `#121212` (Stark Black)
-   `primary-red`: `#D02020` (Bauhaus Red)
-   `primary-blue`: `#1040C0` (Bauhaus Blue)
-   `primary-yellow`: `#F0C020` (Bauhaus Yellow)
-   `border`: `#121212` (Thick, distinct borders)
-   `muted`: `#E0E0E0`

### Typography
-   **Font Family**: **'Outfit'** (geometric sans-serif from Google Fonts). This typeface's circular letterforms and clean geometry perfectly embody Bauhaus principles.
-   **Font Import**: `Outfit:wght@400;500;700;900`
-   **Scaling**: Extreme contrast between display and body text
    -   Display: text-4xl (mobile) → text-6xl (tablet) → text-8xl (desktop)
    -   Subheadings: text-2xl → text-3xl → text-4xl
    -   Body: text-base → text-lg
-   **Weights**:
...


### From `03-modern-dark.md`

_Source topic: 03-modern-dark_

# Design Style: Linear / Modern

## Design Philosophy

**Core Principles:** Precision, depth, and fluidity define this design system. Every surface exists in three-dimensional space, illuminated by soft ambient light sources that breathe and move. The design communicates "premium developer tools"—fast, responsive, and obsessively crafted like Linear, Vercel, or Raycast. Nothing is arbitrary: every shadow has three layers, every gradient transitions through multiple colors, every animation uses refined expo-out easing. The goal is software that feels expensive without feeling ostentatious.

**Vibe:** Cinematic meets technical minimalism. Imagine a developer's code editor crossed with a Blade Runner interface—deep near-blacks (#050506, never pure black) punctuated by soft pools of indigo light. The aesthetic is sophisticated but never cold, using warmth from accent glows (#5E6AD2 at varying opacities) to create inviting depth. It should feel like looking through frosted glass into a high-end application running at night. Dark, but not oppressive. Technical, but not sterile. Precise, but not rigid.

1. **Multi-layer background system:** Four stacked gradients + noise texture + grid overlay create depth without any single dominant element
2. **Animated gradient blobs:** Large (900-1400px), heavily blurred shapes float slowly across the canvas, simulating cinematic lighting pools
3. **Mouse-tracking spotlights:** Interactive surfaces respond to cursor position with radial gradient glows (300px diameter, 15% opacity)
4. **Scroll-linked parallax:** Hero content fades, scales, and translates based on scroll position for cinematic depth
5. **Multi-layer shadows:** Every elevated surface uses 3-4 shadow layers: border highlight + soft diffuse + ambient darkness + optional accent glow

### Typography System

| Level | Size | Weight | Tracking | Usage |
|:------|:-----|:-------|:---------|:------|
| Display | `text-7xl` to `text-8xl` | `font-semibold` | `tracking-[-0.03em]` | Hero headlines |
| H1 | `text-5xl` to `text-6xl` | `font-semibold` | `tracking-tight` | Section headers |
| H2 | `text-3xl` to `text-4xl` | `font-semibold` | `tracking-tight` | Subsection headers |
| H3 | `text-xl` to `text-2xl` | `font-semibold` | `tracking-tight` | Card titles |
| Body Large | `text-lg` to `text-xl` | `font-normal` | default | Lead paragraphs |
| Body | `text-sm` to `text-base` | `font-normal` | default | Standard content |
| Label | `text-xs` | `font-mono` | `tracking-widest` | Section tags, metadata |

Headlines use gradient fills for dimensionality:
```
bg-gradient-to-b from-white via-white/95 to-white/70 bg-clip-text text-transparent
```

For accent emphasis, use animated gradient:
```
bg-gradient-to-r from-[#5E6AD2] via-indigo-400 to-[#5E6AD2] bg-clip-text text-transparent
/* With background-size: 200% and animation for shimmer effect */
```

...


### From `04-newsprint.md`

_Source topic: 04-newsprint_

# Design Style: Newsprint

## 1. Design Philosophy

**"All the News That's Fit to Print."**

This style is an ode to the golden age of print journalism, reimagined for the web. It embodies **absolute clarity, hierarchy, and structure** through its unwavering commitment to high-contrast typography, grid-based layouts, and sharp geometric precision.

### Core DNA

- **Stark Geometry**: Zero border radius. Every element is a perfect rectangle with sharp 90-degree corners.
- **High Information Density**: Tight padding, collapsed grid borders, and efficient use of space mimic newspaper column layouts.
- **Typographic Drama**: Massive serif headlines (up to 9xl on desktop) paired with smaller, highly legible body text create extreme hierarchy.
- **Visible Structure**: Grid lines aren't hidden—they're celebrated. Borders between columns and sections are explicit and prominent.
- **Editorial Authority**: The design feels serious, timeless, and trustworthy—like a publication of record.
- **Paper Texture**: Subtle grain overlays and line patterns simulate the tactile quality of newsprint without being overly skeuomorphic.

### Vibe

## 2. Design Token System (The DNA)

### Colors (Single Palette)

- **Background:** `#F9F9F7` (Newsprint Off-White)

- **Foreground:** `#111111` (Ink Black)

- **Muted:** `#E5E5E0` (Divider Grey)

- **Accent:** `#CC0000` (Editorial Red)

- **Border:** `#111111` (Ink Black)

- **Neutral Shades:**

### Typography
...


### From `05-saas.md`

_Source topic: 05-saas_

<role>
You are an expert frontend engineer, UI/UX designer, visual design specialist, and typography expert. Your goal is to help the user integrate a design system into an existing codebase in a way that is visually consistent, maintainable, and idiomatic to their tech stack.
Before proposing or writing any code, first build a clear mental model of the current system:
- Identify the tech stack (e.g. React, Next.js, Vue, Tailwind, shadcn/ui, etc.).
- Understand the existing design tokens (colors, spacing, typography, radii, shadows), global styles, and utility patterns.
- Review the current component architecture (atoms/molecules/organisms, layout primitives, etc.) and naming conventions.
- Note any constraints (legacy CSS, design library in use, performance or bundle-size considerations).
Ask the user focused questions to understand the user's goals. Do they want:
- a specific component or page redesigned in the new style,
- existing components refactored to the new system, or
- new pages/features built entirely in the new style?
Once you understand the context and scope, do the following:
- Propose a concise implementation plan that follows best practices, prioritizing:
  - centralizing design tokens,
  - reusability and composability of components,
  - minimizing duplication and one-off styles,
  - long-term maintainability and clear naming.
- When writing code, match the user’s existing patterns (folder structure, naming, styling approach, and component patterns).
- Explain your reasoning briefly as you go, so the user understands *why* you’re making certain architectural or design choices.
Always aim to:
- Preserve or improve accessibility.
- Maintain visual consistency with the provided design system.
- Leave the codebase in a cleaner, more coherent state than you found it.
- Ensure layouts are responsive and usable across devices.
- Make deliberate, creative design choices (layout, motion, interaction details, and typography) that express the design system’s personality instead of producing a generic or boilerplate UI.
</role>
<design-system>
# Design Style: Minimalist Modern
## Design Philosophy
### Core Principle
**Clarity through structure, character through bold detail.** This design system embraces modern web layouts and dynamic interactions while honoring minimalist foundations. It operates on a fundamental tension: restraint in quantity, confidence in execution. Every element that appears has earned its place—but those elements are executed with deliberate flair and precision.
Whitespace is not empty space; it's a precision instrument for directing attention. Motion is not decoration; it's communication. Color is not scattered; it's concentrated into a single, electrifying accent that commands the eye wherever it appears.
### The Visual Vibe
**Professional yet design-forward. Confident and artistic. Refined but alive.**
Imagine the intersection of a high-tech SaaS product's precision with a creative agency's bold portfolio sensibility. This design feels like it was crafted by someone who understands both engineering rigor and artistic expression—someone who knows the rules well enough to break them intentionally.
**Emotional Keywords:**
- *Confident* — Never apologetic. Elements are sized boldly, colors are vibrant, animations are purposeful.
- *Sophisticated* — The dual-font typography system, the considered color ratios, the layered shadows all whisper "we sweat the details."
- *Alive* — Subtle animations, pulsing indicators, floating elements, and hover responses create a sense that the interface is breathing.
- *Premium* — Generous whitespace, elevated surfaces, and accent-tinted shadows evoke quality and care.
- *Contemporary* — Gradient text, glassmorphic hints, and asymmetric layouts feel undeniably modern without being trendy.
**What This Design Is NOT:**
- Not sterile or clinical (despite being "minimal")
- Not generic or template-like (bold choices prevent this)
- Not busy or overwhelming (restraint in element count)
- Not flat or lifeless (texture, shadow, and motion add depth)
- Not cold or corporate (the warm serif headlines and vibrant blue inject personality)
### The DNA of This Style
#### 1. The Signature Gradient
The Electric Blue gradient (`#0052FF` → `#4D7CFF`) is the heartbeat of this design system. It's not just an accent color—it's a visual signature that creates instant recognition.
**Where it appears:**
- Primary button backgrounds
- Text highlights on key headline words
- Icon container backgrounds
- Featured card border strokes

### From `06-luxury.md`

_Source topic: 06-luxury_

# Design Style: Luxury / Editorial

## Design Philosophy

**Core Principles**: Elegance through restraint, precision, and depth. This style emulates high-end fashion magazines (Vogue, Harper's Bazaar, Kinfolk) and luxury brand websites (Chanel, Hermès, Aesop). Success depends on **exquisite typography hierarchy**, **generous negative space**, **slow cinematic motion**, **intentional asymmetry**, and **layered depth through subtle shadows**. The design creates visual tension through grid-breaking layouts while maintaining perfect architectural balance.

**Vibe**: Sophisticated, Timeless, Expensive, Serene, Curated, Deliberate, Editorial, Tactile.

**The Secret**: Luxury isn't about adding decoration—it's about removing everything unnecessary and perfecting what remains. Every element must feel intentional and considered. Slow down all motion to cinematic speeds (1500-2000ms for images). Add more space than feels comfortable. Use asymmetry to create visual interest. Layer depth through subtle shadows (never harsh drops) and inner borders. The design should feel like expensive paper that you want to touch.

## Design Token System (The DNA)

### Colors (Sophisticated Monochrome)

- **Background**: `#F9F8F6` (Warm Alabaster) — Not pure white (#FFFFFF). This off-white feels like expensive paper or linen. The warm undertone is critical.
- **Foreground**: `#1A1A1A` (Rich Charcoal) — Not pure black (#000000). Softer, more sophisticated. Used for primary text and sharp borders.
- **Muted Background**: `#EBE5DE` (Pale Taupe) — For subtle surface elevation, disabled states, or alternate backgrounds.
- **Muted Foreground**: `#6C6863` (Warm Grey) — For secondary text, captions, metadata. Maintains warmth of the palette.
- **Accent**: `#D4AF37` (Metallic Gold) — Use sparingly. For hover states, underlines, focus indicators, small decorative elements. Never use gold for large areas.
- **Accent Foreground**: `#FFFFFF` (Pure White) — Only used on top of dark backgrounds or gold elements.

- Use opacity for borders and dividers: `#1A1A1A` at 10-20% opacity creates subtle separation
- Dark sections use inverted palette: `#1A1A1A` background with `#F9F8F6` text and `#EBE5DE` muted text at 60-80% opacity
- Never use pure black or pure white for text—always use the charcoal and alabaster values

### Typography (The Most Critical Element)

- **Heading Font**: "Playfair Display" (High-contrast serif) — Elegant, editorial, with distinctive high-contrast strokes. Use for headlines, large quotes, and emphasis.
- **Body Font**: "Inter" (Humanist sans-serif) — Clean, modern, highly legible. Use for body text, labels, UI elements.

- **Hero Headlines**: `text-6xl` to `text-9xl` (4rem to 8rem+) — Massive, dramatic. Use `leading-[0.9]` for tight, compressed vertical rhythm.
- **Section Headlines**: `text-5xl` to `text-7xl` (3rem to 4.5rem) — Still large, commanding attention.
- **Subsection Titles**: `text-3xl` to `text-4xl` (1.875rem to 2.25rem) — For card titles, feature headings.
- **Body Text**: `text-base` to `text-lg` (1rem to 1.125rem) — Comfortable reading size with `leading-relaxed` (1.625).
- **Overlines/Labels**: `text-xs` (0.75rem) — Always uppercase with wide tracking.
- **Micro-text**: `text-[10px]` — For metadata, copyright, tiny labels.
...
