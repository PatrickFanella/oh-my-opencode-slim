# Xlsx Generator

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Extracted Resources

- `scripts/xlsx-generator/`

## Guidance

### From `xlsx-generator-skill.md`

_Source topic: xlsx-generator_

**Purpose:** Create and manipulate Excel XLSX files programmatically. Use when the user needs to generate spreadsheets, modify XLSX templates, extract spreadsheet content, or automate Excel workflows. Supports both template-based generation (for branding compliance) and from-scratch creation. Keywords: Excel, XLSX, spreadsheet, workbook, worksheet, data, report, template, financial, analysis.

# XLSX Generator

## When to Use This Skill

Use this skill when:
- Creating Excel spreadsheets programmatically from data or specifications
- Populating branded templates with dynamic content while preserving formatting
- Extracting cell data, formulas, and structure from existing XLSX files
- Finding and replacing placeholder text like `{{TITLE}}` or `${date}` in cells
- Automating spreadsheet generation workflows (reports, data exports, financial statements)

Do NOT use this skill when:
- User wants to open/view spreadsheets (use native Excel or viewer)
- Complex pivot tables or charts are required (limited support)
- Working with older .xls format (XLSX only)
- Real-time collaborative editing is needed

## Prerequisites

- Deno installed (https://deno.land/)
- Input XLSX files for template-based operations
- JSON specification for scratch generation

## Quick Start

### Two Modes of Operation

1. **Template Mode**: Modify existing branded templates
   - Analyze template to find placeholders and structure
   - Replace `{{PLACEHOLDERS}}` with actual values

2. **Scratch Mode**: Create spreadsheets from nothing using JSON specifications

## Instructions

### Mode 1: Template-Based Generation
...

# 1. Analyze template for replaceable content
deno run --allow-read scripts/analyze-template.ts sales-template.xlsx --pretty

# 3. Generate report
deno run --allow-read --allow-write scripts/generate-from-template.ts \
  sales-template.xlsx replacements.json November-Sales.xlsx
```

### Example 2: Data Export with Formulas

**Scenario**: Create a spreadsheet with calculated totals.

**spec.json**:
```json
```

### Example 3: Multi-Sheet Workbook

**Scenario**: Create a workbook with summary and detail sheets.

**spec.json**:
```json
```

## Script Reference

| Script | Purpose | Permissions |
|--------|---------|-------------|
| `analyze-template.ts` | Extract cells, formulas, placeholders from XLSX | `--allow-read` |
| `generate-from-template.ts` | Replace placeholders in templates | `--allow-read --allow-write` |
| `generate-scratch.ts` | Create XLSX from JSON specification | `--allow-read --allow-write` |

## Specification Reference

### Sheet Options

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Sheet name |
| `data` | array | 2D array of cell values starting at A1 |
| `cells` | array | Individual cell specifications |
...
