---
name: ars-malefica-workflows
description: "Ars Malefica capture and workflow operations for journal, media, thread, work, and documentation routing. Use when building or validating QuickAdd, Templater, capture prompts, journal flow, media notes, thread synthesis, work metadata, or Obsidian REST/MCP/CLI automation. Triggers: capture, journal, media, thread, work, QuickAdd, Templater, REST, MCP, CLI, routing, workflow."
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
3. Route to the canonical folder on first write.
4. Keep QuickAdd/Templater helpers deterministic.
5. Validate the resulting surfaces with `scripts/validate-workflows.py`.

## Guardrails

- Journal is for lived experience, not tasks.
- Resources store sources by medium.
- Threads synthesize meaning across notes and sources.
- Works own publishable artifacts and dates.
- Documentation owns durable operating knowledge.

## Automation posture

- Prefer HTTPS REST/MCP for automation.
- Use CLI only as a local fallback.
- Keep capture prompts short and repeatable.
