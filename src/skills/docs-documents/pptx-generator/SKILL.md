---
name: pptx-generator
description: "Create and manipulate PowerPoint PPTX files programmatically. Use when the user needs to generate presentations, modify PPTX templates, extract slide content, create thumbnail previews, or automate PowerPoint workflows. Supports both template-based generation (for branding compliance) and from-scratch creation. Keywords: PowerPoint, PPTX, presentation, slides, template, deck, slideshow, corporate, branding."
license: MIT
compatibility: Requires Deno with --allow-read, --allow-write permissions
metadata:
  author: agent-skills
  version: "1.0"
  type: generator
  mode: generative
  domain: documents
---

# PPTX Generator

Programmatic PPTX workflows for template replacement, slide-library composition, and scratch generation.

## Purpose

Use this skill to produce or modify `.pptx` files in automation pipelines while preserving structure and branding.

## When to Use This Skill

- Generate decks from JSON/data sources
- Fill branded templates with placeholders
- Analyze template text inventory before replacement
- Assemble custom decks from approved slide libraries

## When Not to Use

- User only needs to view/edit manually in PowerPoint
- Complex motion/animation fidelity is mandatory
- Input/output is legacy `.ppt` (unsupported)

## Workflow

1. **Choose mode**
   - Template mode (replace/select slides)
   - Scratch mode (build from JSON spec)
2. **Template mode path**
   - Analyze template:
     - `deno run --allow-read scripts/analyze-template.ts template.pptx > inventory.json`
   - Create `replacements.json` or `selections.json`
   - Generate output:
     - `deno run --allow-read --allow-write scripts/generate-from-template.ts ...`
3. **Slide preview path**
   - `deno run --allow-read scripts/generate-thumbnails.ts library.pptx`
   - Optional extraction:
     - `--extract-thumb --output-dir ./previews`
4. **Scratch mode path**
   - Author spec aligned to schema
   - Generate deck:
     - `deno run --allow-read --allow-write scripts/generate-scratch.ts spec.json out.pptx`
5. **Validate output**
   - Confirm placeholder replacement and slide order
   - Spot-check typography/color inheritance for template-generated slides

## Output Checklist

- [ ] Correct mode chosen (template/slide-library/scratch)
- [ ] Input files readable and output path writable
- [ ] Placeholder tags resolved as expected
- [ ] Slide order matches requested sequence
- [ ] No broken image/table/chart references
- [ ] Output `.pptx` opens cleanly in standard viewers

## Resources

- Full guide: `references/full-guide.md`
- Template workflow details: `references/template-workflow.md`
- Scratch API/spec reference: `references/pptxgenjs-api.md`
- JSON schema: `assets/slide-spec-schema.json`
- Scripts:
  - `scripts/analyze-template.ts`
  - `scripts/generate-thumbnails.ts`
  - `scripts/generate-from-template.ts`
  - `scripts/generate-scratch.ts`

## Related Skills

- **pdf-generator**: For creating PDF documents instead of presentations
- **docx-generator**: For creating Word documents
- **xlsx-generator**: For creating Excel spreadsheets
