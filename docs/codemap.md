# Codemap Skill

Codemap is a **custom skill** bundled with this repo.

It helps agents quickly build a high-quality mental model of an unfamiliar codebase by generating a structured *codemap* and tracking changes over time.

## What it does

Codemap is designed for repository understanding and hierarchical codemap generation:

1. Selects relevant code/config files using LLM judgment
2. Creates `.blacktower/codemap.json` for change tracking
3. Generates `codemap.md` templates (per folder) for fixers to fill in
4. Migrates legacy `.blacktower/cartography.json` state to `.blacktower/codemap.json`

## How to use

Codemap is bundled with the repo but is not installed automatically by the
default blacktower installer. Copy or install the
`src/skills/dev-workflows/codemap/` skill only when you want repository-map
generation available in OpenCode.

### Run it (manual / local)

From a repo root (or with an explicit `--root`):

```bash
# Initialize mapping
node codemap.mjs init --root /repo --include "src/**/*.ts" --exclude "node_modules/**"

# Check what changed
node codemap.mjs changes --root /repo

# Update hashes
node codemap.mjs update --root /repo
```

## Outputs

### `.blacktower/codemap.json`

A change-tracking file with hashes for files/folders.

### `codemap.md` (per folder)

Empty templates created in each folder so a Fixer-style agent can fill in:

- Responsibility
- Design patterns
- Data/control flow
- Integration points

## Screenshot

The existing screenshot lives in `img/cartography.png`.

![Codemap screenshot](../img/cartography.png)

## Related

- `src/skills/dev-workflows/codemap/README.md` and
  `src/skills/dev-workflows/codemap/SKILL.md` contain the skill’s internal docs.
- `codemap.md` at the repo root is an example output/starting point.
