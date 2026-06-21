---
type: documentation
status: reference
created: '2026-06-04'
updated: '2026-06-11'
tags:
- type/resource
- type/documentation
description: 'Ars Malefica capture and workflow operations for journal, media, thread, work, and documentation routing. Use
  when building or validating QuickAdd, Templater, capture prompts, journal flow, media notes, thread synthesis, work metadata,
  or Obsidian REST/MCP/CLI automation. Triggers: capture, journal, media, thread, work, QuickAdd, Templater, REST, MCP, CLI,
  routing, workflow.'
name: ars-malefica-workflows
---

# Ars Malefica Workflows

Use for capture and routing work in the vault.

## Read first

- `references/workflow-map.md` for intent-to-folder routing.
- `references/prompts.md` for concise capture prompts.
- `references/api-notes.md` for REST/MCP/CLI posture.

## Workflow

1. Decide the note type first: Journal, Resource, Thread, Work, or Documentation.
2. Ask only for required metadata.
3. Route to the canonical folder on first write (30 QuickAdd choices available).
4. Templater auto-applies correct template for 22 folder mappings.
5. Keep QuickAdd/Templater helpers deterministic.
6. Validate the resulting surfaces with `scripts/validate-workflows.py`.

## Guardrails

- Journal is for lived experience, not tasks.
- Resources store sources by medium (10 subfolders under Media/).
- Threads synthesize meaning across notes and sources.
- Works own publishable artifacts and dates (9 subfolders + Kanban boards).
- Documentation owns durable operating knowledge.

## Automation posture

- Prefer HTTPS REST/MCP for automation.
- Use CLI only as a local fallback.
- Keep capture prompts short and repeatable.
- Kanban boards track publishing pipelines: SubBlog, Social, Software.

## Key numbers

- 30 QuickAdd capture choices, all targeting real folders
- 22 Templater folder-template auto-mappings
- 55 templates with canonical tags
- 3 Kanban boards for content/software pipelines
