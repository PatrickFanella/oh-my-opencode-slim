# PPTX Generator Full Guide

Detailed reference moved from `SKILL.md`.

## Prerequisites

- Deno installed
- File permissions: `--allow-read` and (when generating) `--allow-write`
- `.pptx` inputs for template workflows
- JSON spec for scratch workflows

## Two Operating Modes

1. **Template mode**
   - Analyze text inventory
   - Replace placeholder tags
   - Optionally combine selected slides from a library
2. **Scratch mode**
   - Create full presentation from JSON specification

---

## Mode 1: Template-Based Generation

### Step 1: Analyze template

```bash
deno run --allow-read scripts/analyze-template.ts corporate-template.pptx > inventory.json
```

Inventory includes:

- `slideCount`
- per-shape metadata (`slideNumber`, `shapeId`, `shapeName`, placeholder type)
- paragraph text + formatting hints

### Step 2: Build replacements spec

```json
{
  "textReplacements": [
    { "tag": "{{TITLE}}", "value": "Q4 2024 Results" },
    { "tag": "{{SUBTITLE}}", "value": "Financial Overview" },
    { "tag": "{{DATE}}", "value": "December 2024" },
    { "tag": "{{AUTHOR}}", "value": "Finance Team", "slideNumbers": [1] }
  ]
}
```

### Step 3: Generate output

```bash
deno run --allow-read --allow-write scripts/generate-from-template.ts \
  corporate-template.pptx replacements.json output.pptx
```

---

## Mode 1 Alternative: Slide Library Composition

### Preview available slides

```bash
deno run --allow-read scripts/generate-thumbnails.ts slide-library.pptx
```

Optional thumbnail extraction:

```bash
deno run --allow-read --allow-write scripts/generate-thumbnails.ts \
  slide-library.pptx --extract-thumb --output-dir ./previews
```

### Select and combine

Example selection payload:

```json
{
  "slideSelections": [
    { "slideNumber": 1 },
    { "slideNumber": 5 },
    { "slideNumber": 12 },
    { "slideNumber": 3 }
  ],
  "textReplacements": [
    { "tag": "{{TITLE}}", "value": "Custom Presentation" }
  ]
}
```

Generate:

```bash
deno run --allow-read --allow-write scripts/generate-from-template.ts \
  slide-library.pptx selections.json custom-deck.pptx
```

---

## Mode 2: Scratch Generation

Create `spec.json` with metadata + slides + elements (`text`, `image`, `table`, `shape`, `chart`), then run:

```bash
deno run --allow-read --allow-write scripts/generate-scratch.ts spec.json output.pptx
```

Reference schema: `../assets/slide-spec-schema.json`.

---

## Script Reference

| Script | Purpose | Permissions |
|---|---|---|
| `analyze-template.ts` | Extract text inventory from PPTX | `--allow-read` |
| `generate-thumbnails.ts` | Slide info + preview extraction | `--allow-read --allow-write` |
| `generate-from-template.ts` | Tag replacement / slide combining | `--allow-read --allow-write` |
| `generate-scratch.ts` | Build PPTX from JSON spec | `--allow-read --allow-write` |

## Common Issues + Fixes

### Placeholder not replaced

- Run analyzer to verify exact tag text
- Ensure tag is in a single text run (not split by formatting)
- Check `slideNumbers` filters

### Slide order wrong

- Output order follows `slideSelections` order
- Slide numbering is 1-indexed

### Images missing

- Resolve relative paths against spec location
- Verify files exist/readable
- Prefer PNG/JPEG/GIF formats

## OOXML Placeholder Inheritance (Advanced)

PowerPoint inheritance chain:

```text
Theme → Slide Master → Slide Layout → Slide
```

Key rules:

1. Text content does not inherit from layout placeholders automatically.
2. Text formatting can inherit when slide uses empty `a:lstStyle`.
3. Placeholder links depend on matching `type` and `idx` (`p:ph`).
4. Use `<a:buNone/>` in layout list styles to suppress inherited bullets.

If text color/bullets are wrong, check whether style is set on layout `a:lstStyle` (inheritable) vs run-level `a:rPr` (often not inherited as expected).

## Limitations

- No direct slide-to-image rendering in this toolkit
- Limited advanced animation support
- No master-slide editing (preserve, not redesign)
- `.pptx` only
- Complex text run splitting can break naive tag replacement
