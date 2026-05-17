# Docx Generator

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Extracted Resources

- `scripts/docx-generator/`

## Guidance

### From `docx-generator-skill.md`

_Source topic: docx-generator_

**Purpose:** Create and manipulate Word DOCX files programmatically. Use when the user needs to generate documents, modify DOCX templates, extract document content, or automate Word document workflows. Supports both template-based generation (for branding compliance) and from-scratch creation. Keywords: Word, DOCX, document, report, template, contract, letter, corporate, branding.

# DOCX Generator

## When to Use This Skill

Use this skill when:
- Creating Word documents programmatically from data or specifications
- Populating branded templates with dynamic content while preserving corporate styling
- Extracting text, tables, and structure from existing DOCX files for analysis
- Finding and replacing placeholder text like `{{TITLE}}` or `${author}`
- Automating document generation workflows (reports, contracts, letters)

Do NOT use this skill when:
- User wants to open/view documents (use native Word or viewer)
- Complex mail merge with data sources (use native Word mail merge)
- Working with older .doc format (DOCX only)
- PDF output is needed (use pdf-generator skill instead)

## Prerequisites

- Deno installed (https://deno.land/)
- Input DOCX files for template-based operations
- JSON specification for scratch generation

## Quick Start

### Two Modes of Operation

1. **Template Mode**: Modify existing branded templates
   - Analyze template to find placeholders
   - Replace `{{PLACEHOLDERS}}` with actual content

2. **Scratch Mode**: Create documents from nothing using JSON specifications

## Instructions

### Mode 1: Template-Based Generation
...

# 1. Analyze template for replaceable content
deno run --allow-read scripts/analyze-template.ts contract-template.docx --pretty

# 3. Generate contract
deno run --allow-read --allow-write scripts/generate-from-template.ts \
  contract-template.docx replacements.json acme-contract.docx
```

### Example 2: Report with Tables

**Scenario**: Generate a data report with tables and formatting.

**spec.json**:
```json
```

### Example 3: Letter with Headers/Footers

**Scenario**: Create a formal letter with letterhead.

**spec.json**:
```json
```

## Script Reference

| Script | Purpose | Permissions |
|--------|---------|-------------|
| `analyze-template.ts` | Extract text, tables, placeholders from DOCX | `--allow-read` |
| `generate-from-template.ts` | Replace placeholders in templates | `--allow-read --allow-write` |
| `generate-scratch.ts` | Create DOCX from JSON specification | `--allow-read --allow-write` |

## Specification Reference

### Paragraph Options

| Property | Type | Description |
|----------|------|-------------|
| `text` | string | Simple text content |
| `runs` | array | Formatted text runs (for mixed formatting) |
| `heading` | 1-6 | Heading level |
...
