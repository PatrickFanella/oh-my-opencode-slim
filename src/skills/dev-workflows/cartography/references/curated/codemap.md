# Codemap

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Extracted Resources

- `scripts/codemap/`

## Guidance

### From `codemap-skill.md`

_Source topic: codemap_

**Purpose:** Generate comprehensive hierarchical codemaps for UNFAMILIAR repositories. Expensive operation - only use when explicitly asked for codebase documentation or initial repository mapping

# Codemap Skill

You help users understand and map repositories by creating hierarchical codemaps.

## When to Use

- User asks to understand/map a repository
- User wants codebase documentation
- Starting work on an unfamiliar codebase

## Workflow

### Step 1: Check for Existing State

### Step 2: Initialize (Only if no state exists)

1. **Analyze the repository structure** - List files, understand directories
2. **Infer patterns** for **core code/config files ONLY** to include:
   - **Include**: `src/**/*.ts`, `package.json`, etc.
   - **Exclude (MANDATORY)**: Do NOT include tests, documentation, or translations.
     - Tests: `**/*.test.ts`, `**/*.spec.ts`, `tests/**`, `__tests__/**`
     - Docs: `docs/**`, `*.md` (except root `README.md` if needed), `LICENSE`
     - Build/Deps: `node_modules/**`, `dist/**`, `build/**`, `*.min.js`
   - Respect `.gitignore` automatically
3. **Run codemap.mjs init**:

```bash
node ~/.config/opencode/skills/codemap/scripts/codemap.mjs init \
  --root ./ \
  --include "src/**/*.ts" \
  --exclude "**/*.test.ts" --exclude "dist/**" --exclude "node_modules/**"
```

- `.slim/codemap.json` - File and folder hashes for change detection
- Empty `codemap.md` files in all relevant subdirectories

4. **Delegate codemap writing to Fixer agents** - Spawn one fixer per folder to read code and create or update its specific `codemap.md` file.
...

# src/agents/

## Responsibility
Defines agent personalities and manages their configuration lifecycle.

## Design
Each agent is a prompt + permission set. Config system uses:
- Default prompts (orchestrator.ts, explorer.ts, etc.)
- User overrides from ~/.config/opencode/oh-my-opencode-slim.json
- Permission wildcards for skill/MCP access control

## Flow
1. Plugin loads → calls getAgentConfigs()
2. Reads user config preset
3. Merges defaults with overrides
4. Applies permission rules (wildcard expansion)
5. Returns agent configs to OpenCode

## Integration
- Consumed by: Main plugin (src/index.ts)
- Depends on: Config loader, skills registry
```

Example **Root Codemap (Atlas)**:

```markdown


### From `README.md`

_Source topic: README_

# Update hashes
node codemap.mjs update --root /repo
```

## Outputs

### .slim/codemap.json

```json
```

### codemap.md (per folder)

Empty templates created in each folder for fixers to fill with:
- Responsibility
- Design patterns
- Data/control flow
- Integration points

## Installation

Bundled with the package, but not installed automatically by the default slim
installer. Copy or install this skill explicitly when codemap generation should
be available in OpenCode.


### From `codemap.md`

_Source topic: codemap_

# src/skills/codemap/

## Responsibility

- Provide a command-style skill package that standardizes repository mapping workflows for unfamiliar codebases.
- Define the task contract used by Orchestrator/fixer agents via `SKILL.md` and operational guidance via `README.md`.
- Generate and evolve change-aware codemap state artifacts (`.slim/codemap.json`) and scaffold placeholders (`codemap.md`).

## Design

- Contract layer: `SKILL.md` (machine prompt contract) + `README.md` (human-facing operation notes).
- Execution layer: `scripts/codemap.mjs` exports deterministic helper functions:
  - `parseArgs(argv)`
  - `cmdInit`, `cmdChanges`, `cmdUpdate`
  - `selectFiles`, `computeFileHash`, `computeFolderHash`, `createEmptyCodemap`
  - `loadState`, `saveState`, `migrateLegacyState`
- Persistence model: JSON state at `.slim/codemap.json` with `metadata`, `file_hashes`, and `folder_hashes`.
- Testing layer: `scripts/codemap.test.ts` validates pattern matching, hash determinism, and migration behavior.
- The script intentionally avoids network and mutates only filesystem-local state and codemap templates.

## Flow

- Entry point `main(argv)` parses command and arguments (`init|changes|update`, `--root`, `--include`, `--exclude`, `--exception`) and dispatches via strict branches.
- `cmdInit()` computes include/exclude candidate sets using `selectFiles()` and writes:
- `cmdChanges()` reloads state (`loadState()` + `migrateLegacyState()`), recomputes current hashes, emits added/removed/modified diffs and affected folder list, and exits non-zero if state is absent.
- `cmdUpdate()` recomputes full state from existing metadata and persists it, used after targeted fixers finish updates.
- `codemap` skill invocation path in SKILL workflow is explicit: Step 1 checks `.slim/codemap.json` or `.slim/cartography.json`, then Step 2/3 selects init or incremental path.

## Integration

- Installed under OpenCode through `src/cli/custom-skills.ts` as `name: 'codemap'`, `sourcePath: 'src/skills/codemap'`.
- `src/cli/install.ts` copies this directory into the user skill directory; OpenCode executes `scripts/codemap.mjs` from that context.
- `src/hooks/filter-available-skills/index.ts` applies agent-level skill gating via names from `getSkillPermissionsForAgent()`.
- `scripts/verify-release-artifact.ts` includes codemap skill metadata and runtime checks as required packaged files.
