# Tool Ui Ux Pro Max

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Extracted Resources

- `scripts/tool-ui-ux-pro-max/`

## Guidance

### From `tool-ui-ux-pro-max-skill.md`

_Source topic: tool-ui-ux-pro-max_

**Purpose:** Use when you need concrete UI/UX inputs (palette, typography, landing patterns, UX/a11y constraints) to drive design or review. Searchable UI/UX design intelligence (styles, palettes, typography, landing patterns, charts, UX/a11y guidelines + stack best practices) backed by CSV + a Python search script. Triggers: UIUX/uiux, UI/UX, UX design, UI design, design system, design spec, color palette, typography, layout, animation, accessibility/a11y, component styling. Actions: search, recommend, review, improve UI.

# Tool: UI/UX Pro Max (Searchable Design Intelligence)

This is a **lookup tool**, not a page generator.

Use it to quickly retrieve concrete inputs (palette tokens, typography pairings, UX constraints, stack-specific implementation notes) that can be synthesized into:
- `design-system.md`
- a UI refactor plan / acceptance criteria
- review checklists for “looks good but feels broken” issues

## Prerequisites

```bash
python3 --version || python --version
```

## Core command

```bash
python3 "${AGENT_SKILLS_HOME:-~/.claude/skills}/tool-ui-ux-pro-max/scripts/search.py" "<query>" --domain <domain> [-n <max_results>]
```

```bash
python3 "${AGENT_SKILLS_HOME:-~/.claude/skills}/tool-ui-ux-pro-max/scripts/search.py" "<query>" --stack <stack> [-n <max_results>]
```

## Recommended workflow

When asked to design / improve UI, do this:

- **Product type**: SaaS / e-commerce / content / tool / dashboard / landing
- **Tone keywords**: minimal / premium / playful / warm / corporate / technical / bold
- **Industry**: healthcare / fintech / education / consumer / …
- **Stack**: React / Next.js / … (default to `html-tailwind` if unspecified)

1. `product` — product type → style direction
2. `style` — style details (color/shape/motion/complexity)
...
