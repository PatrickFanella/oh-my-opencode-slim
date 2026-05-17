---
name: skill-creator
description: Guide for creating effective skills. This skill should be used when users want to create a new skill (or update an existing skill) that extends Claude's capabilities with specialized knowledge, workflows, or tool integrations.
---

# skill-creator

Create, improve, package, and validate skills using progressive disclosure: short SKILL.md plus references, scripts, templates, and assets.

## Workflow

1. Use this skill only when the request matches the frontmatter description.
2. Keep the main context short: read only the relevant reference file for the exact subtask.
3. Prefer existing scripts/templates/assets in this skill before writing ad hoc code.
4. Stop and ask when required credentials, CLIs, project context, or user confirmation are missing.

## Resources

- `references/full-guide.md` — detailed guidance.

## Merged Skills

### Curated references

Former merged-skill dumps were distilled into these lookup files:

- `references/curated/skill-builder.md` — Skill Builder guidance.
- `references/curated/skill-development.md` — Skill Development guidance.
- `references/curated/skill-evolution.md` — Skill Evolution guidance.
- `references/curated/skill-improver.md` — Skill Improver guidance.
- `references/curated/skill-integrator.md` — Skill Integrator guidance.
- `references/curated/write-a-skill.md` — Write A Skill guidance.
- `references/curated/writing-skills.md` — Writing Skills guidance.


### Extracted resource directories

- `references/` — curated resources extracted from prior merged skill material.
- `scripts/` — curated resources extracted from prior merged skill material.
- `templates/` — curated resources extracted from prior merged skill material.
- `assets/` — curated resources extracted from prior merged skill material.
- `examples/` — curated resources extracted from prior merged skill material.
