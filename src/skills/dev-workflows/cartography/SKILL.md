---
name: cartography
description: Repository understanding and hierarchical codemap generation
---

# Cartography Skill

Create and maintain hierarchical codemaps for repository onboarding and navigation.

## Activation Workflow

1. **Check state**: if `.lite/cartography.json` exists, skip init and run `changes`.
2. **Initialize if missing**: include core code/config files only; exclude tests/docs/build artifacts.
3. **Generate folder maps**: explorer agents gather findings; quick agent writes each folder `codemap.md`.
4. **Incremental refresh**: run `changes`, update only affected folders, then run `update`.
5. **Finalize atlas**: create/update root `codemap.md` with root entry points + aggregated folder map.
6. **Register in `AGENTS.md`**: ensure a `## Repository Map` section exists (idempotent).

## Command Sequence

```bash
python3 ~/.config/opencode/skills/cartography/scripts/cartographer.py init \
  --root ./ \
  --include "src/**/*.ts" \
  --exclude "**/*.test.ts" --exclude "dist/**" --exclude "node_modules/**"

python3 ~/.config/opencode/skills/cartography/scripts/cartographer.py changes \
  --root ./

python3 ~/.config/opencode/skills/cartography/scripts/cartographer.py update \
  --root ./
```

## Codemap Minimum Content

- **Responsibility**: exact module role.
- **Design**: key abstractions/patterns.
- **Flow**: data/control path in sequence.
- **Integration**: dependencies + consumers.

## Resources

- `scripts/`
  - `scripts/cartographer.py` — stateful init/changes/update engine.
  - `scripts/test_cartographer.py` — test coverage for cartographer behavior.
- `references/`
  - `references/full-guide.md` — detailed workflow, exclusions, templates, and examples.

## Merged Skills

### Curated references

Former merged-skill dumps were distilled into these lookup files:

- `references/curated/codemap.md` — Codemap guidance.


### Extracted resource directories

- `references/` — curated resources extracted from prior merged skill material.
- `scripts/` — curated resources extracted from prior merged skill material.
