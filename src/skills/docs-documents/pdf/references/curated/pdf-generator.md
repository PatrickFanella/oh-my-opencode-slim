# Pdf Generator

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Extracted Resources

- `scripts/pdf-generator/`

## Guidance

### From `pdf-generator-skill.md`

_Source topic: pdf-generator_

**Purpose:** Create and manipulate PDF files programmatically. Use when the user needs to generate PDFs, fill PDF forms, extract PDF content, add watermarks/overlays, or merge documents. Supports both template-based generation (form filling, overlays) and from-scratch creation. Keywords: PDF, document, form, fillable, merge, watermark, extract, text, report.

# PDF Generator

## When to Use This Skill

Use this skill when:
- Creating PDF documents programmatically from data or specifications
- Filling PDF forms with dynamic data
- Adding watermarks, stamps, or overlays to existing PDFs
- Extracting text and metadata from PDF files
- Merging multiple PDFs into one document
- Analyzing PDF structure and form fields

Do NOT use this skill when:
- User wants to open/view PDFs (use native PDF viewer)
- Complex page layout with flowing text is needed (consider HTML-to-PDF tools)
- Working with password-protected PDFs (limited support)
- OCR is needed for scanned documents

## Prerequisites

- Deno installed (https://deno.land/)
- Input PDF files for template-based operations
- JSON specification for scratch generation

## Quick Start

### Two Modes of Operation

1. **Template Mode**: Modify existing PDF templates
   - Fill form fields (text, checkbox, dropdown)
   - Add overlays (text, images, shapes)
   - Merge and combine PDFs

2. **Scratch Mode**: Create PDFs from nothing using JSON specifications

## Instructions
...

# 1. Analyze form to find field names
deno run --allow-read scripts/analyze-template.ts application.pdf --pretty

# 3. Generate filled form
deno run --allow-read --allow-write scripts/generate-from-template.ts \
  application.pdf form-data.json john-smith-application.pdf
```

### Example 2: Add Approval Stamp

**Scenario**: Add an "APPROVED" stamp to a document.

**stamp-spec.json**:
```json
```

### Example 3: Create Report with Table

**Scenario**: Generate a simple report with a data table.

**report-spec.json**:
```json
```

## Script Reference

| Script | Purpose | Permissions |
|--------|---------|-------------|
| `analyze-template.ts` | Extract text, metadata, form fields from PDF | `--allow-read` |
| `generate-from-template.ts` | Fill forms, add overlays, merge PDFs | `--allow-read --allow-write` |
| `generate-scratch.ts` | Create PDF from JSON specification | `--allow-read --allow-write` |

## Element Types (Scratch Mode)

| Type | Description | Key Options |
|------|-------------|-------------|
| `text` | Text content | `x`, `y`, `text`, `fontSize`, `font`, `color`, `rotate` |
| `image` | PNG/JPEG images | `x`, `y`, `path`, `width`, `height`, `opacity` |
| `rectangle` | Filled/outlined rectangles | `x`, `y`, `width`, `height`, `color`, `borderColor` |
| `line` | Straight lines | `startX`, `startY`, `endX`, `endY`, `thickness` |
| `circle` | Filled/outlined circles | `x`, `y`, `radius`, `color`, `borderColor` |
...
