# Cartography Full Guide

Detailed reference for repository mapping. Keep `SKILL.md` as activation-only.

## Include/Exclude Rules

Prioritize core implementation and config files.

- **Include examples**: `src/**/*.ts`, `src/**/*.js`, `package.json`, runtime config files.
- **Mandatory exclusions**:
  - Tests: `**/*.test.ts`, `**/*.spec.ts`, `tests/**`, `__tests__/**`
  - Docs: `docs/**`, `*.md` (except root `README.md` if needed), `LICENSE`
  - Build/deps: `node_modules/**`, `dist/**`, `build/**`, `*.min.js`
- `.gitignore` should be respected.

## State Model

- `.lite/cartography.json` stores file/folder hashes used for change detection.
- `init` creates state + scaffolds empty `codemap.md` files for relevant folders.
- `changes` reports added/removed/modified files and affected folders.
- `update` writes refreshed state after codemap updates are complete.

## Detailed Workflow

### 1) Bootstrap (No state present)

1. Read repository structure and decide include/exclude patterns.
2. Run `init`.
3. Spawn one explorer per mapped folder for technical discovery.
4. Dispatch quick to write folder `codemap.md` from findings.

### 2) Incremental Run (State present)

1. Run `changes`.
2. Update only affected folders.
3. Run `update` to persist new state.

### 3) Root Atlas

After folder codemaps are ready:

1. Create/update root `codemap.md`.
2. Document project responsibility + system entry points.
3. Add aggregated directory table/list summarizing each folder responsibility.
4. Link each row to the folder-level `codemap.md`.

### 4) AGENTS.md registration

Ensure repo root `AGENTS.md` contains:

```markdown
## Repository Map

A full codemap is available at `codemap.md` in the project root.

Before working on any task, read `codemap.md` to understand:
- Project architecture and entry points
- Directory responsibilities and design patterns
- Data flow and integration points between modules

For deep work on a specific folder, also read that folder's `codemap.md`.
```

Idempotent rule: if the section already exists, do not duplicate.

## Codemap Writing Standard

Each folder `codemap.md` should contain:

- **Responsibility**: exact engineering role.
- **Design**: major patterns, abstractions, interfaces.
- **Flow**: clear sequence of function/module interactions.
- **Integration**: dependencies, consumers, hooks/endpoints/events.

### Example Folder Codemap

```markdown
# src/agents/

## Responsibility
Defines agent personalities and manages their configuration lifecycle.

## Design
Each agent is a prompt + permission set. Config system uses:
- Default prompts (orchestrator.ts, explorer.ts, etc.)
- User overrides from ~/.config/opencode/oh-my-opencode-lite.json
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

### Example Root Atlas

```markdown
# Repository Atlas: oh-my-opencode-lite

## Project Responsibility
A high-performance, low-latency agent orchestration plugin for OpenCode, focusing on specialized sub-agent delegation and native task orchestration.

## System Entry Points
- `src/index.ts`: Plugin initialization and OpenCode integration.
- `package.json`: Dependency manifest and build scripts.
- `oh-my-opencode-lite.json`: User configuration schema.

## Directory Map (Aggregated)
| Directory | Responsibility Summary | Detailed Map |
|-----------|------------------------|--------------|
| `src/agents/` | Defines agent personalities (Orchestrator, Explorer) and manages model routing. | [View Map](src/agents/codemap.md) |
| `src/features/` | Core logic for tmux integration, background task spawning, and session state. | [View Map](src/features/codemap.md) |
| `src/config/` | Implements the configuration loading pipeline and environment variable injection. | [View Map](src/config/codemap.md) |
```
