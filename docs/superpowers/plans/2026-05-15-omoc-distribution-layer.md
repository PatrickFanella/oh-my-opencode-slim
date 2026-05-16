# OMOC Distribution Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make oh-my-opencode-slim viable as the primary OpenCode distribution layer while keeping DCP and quota concerns separate.

**Architecture:** OpenCode remains the host runtime for auth, providers, schema validation, and core session execution. OMOC becomes the config-driven composition layer for agents, MCP defaults, tools, hooks, presets, bundled skills, install docs, and migration guidance. DCP and quota stay outside OMOC except for explicit integration boundaries documented as non-goals.

**Tech Stack:** TypeScript, Bun, Zod, OpenCode plugin API, OpenCode JSON/JSONC config, Biome.

**pipeline-type:** full
**persistence-mode:** hybrid
**change-name:** omoc-distribution-layer

---

## Approved Scope

User decisions from requirements interview:

- Use OMOC as the main OpenCode plugin/distribution layer.
- Keep DCP and quota separate.
- Prefer config over new environment variables for behavior settings.
- Accept manual migration and curated bundling rather than magic import from `.agents`.
- Proceed with a full written plan plus review gate.
- Persist planning artifacts with `hybrid` mode.

## Complexity Assessment

| Dimension | Rating | Reason |
| --- | --- | --- |
| Logic depth | Medium | Mostly config/install/docs wiring, but installer and runtime config must stay coherent. |
| Contract sensitivity | High | Touches OpenCode plugin/config contract and startup behavior. |
| Context span | High | Spans config schema, CLI installer, skill registry, docs, and runtime boundaries. |
| Discovery need | Medium | Current OMOC surface is known; user-specific `.agents` inventory is not. |
| Failure cost | Medium | Bad config can break startup, but changes are reversible. |
| Concern coupling | High | Agents, skills, MCPs, OpenCode host config, DCP/quota boundaries, and docs interact. |

Route: **full written plan + review gate**.

## Non-Goals

- Do not replace OpenCode itself.
- Do not move auth/provider registry/model refresh into OMOC.
- Do not merge DCP into OMOC.
- Do not merge quota management into OMOC.
- Do not add new behavior env vars for this migration unless a future requirement explicitly demands it.
- Do not auto-import arbitrary `.agents` content in the first pass.

## File Structure

Potential files to modify during implementation:

- Modify: `src/config/schema.ts`
  - Add any explicit distribution-mode config only if needed after inventory. Prefer existing `packages`, `packageDefinitions`, `agents`, `presets`, `disabled_mcps`, and skill permissions before adding fields.
- Modify: `src/cli/custom-skills.ts`
  - Add curated OMOC-bundled skills copied from `src/skills/` into OpenCode config skills dir.
- Modify: `src/cli/skills.ts`
  - Keep external recommended skills minimal; do not grow this into an uncontrolled `.agents` mirror.
- Modify: `src/cli/install.ts`
  - Ensure install output explains OMOC-as-distribution usage and skill install boundaries.
- Modify: `docs/configuration.md`
  - Document minimal OpenCode config, OMOC config ownership, DCP/quota boundaries, and no-new-env stance.
- Modify: `docs/skills.md`
  - Document bundled vs recommended vs permission-only skill categories and migration criteria.
- Modify: `docs/installation.md`
  - Add “single OMOC plugin” setup path and rollback steps.
- Modify: `docs/mcps.md`
  - Document OMOC MCP defaults and where non-OMOC MCPs should live.
- Create: `docs/omoc-distribution-layer.md`
  - User-facing architecture and migration guide.
- Test: `src/config/schema.test.ts` or nearest existing config tests
  - Validate any new config shape or package composition behavior.
- Test: `src/cli/custom-skills.test.ts` if present or create nearby test only if installer behavior changes.
  - Validate curated skill registry behavior.

## Implementation Tasks

### Task 1: Inventory Current Boundaries

**Files:**
- Read: `src/config/schema.ts`
- Read: `src/config/loader.ts`
- Read: `src/index.ts`
- Read: `src/cli/custom-skills.ts`
- Read: `src/cli/skills.ts`
- Read: `src/cli/install.ts`
- Read: `docs/configuration.md`
- Read: `docs/skills.md`
- Read: `docs/mcps.md`
- Read: `docs/installation.md`

- [ ] **Step 1: Confirm no DCP namespace exists in OMOC**

Run:

```bash
rg -n "DCP|dcp|quota|Quota" src docs
```

Expected:

- No first-class DCP config namespace.
- Quota only appears as rate-limit/error fallback language if at all.

- [ ] **Step 2: Confirm behavior config is config-first**

Run:

```bash
rg -n "process\.env|OH_MY_OPENCODE_SLIM|OPENCODE_" src/config src/cli docs/configuration.md
```

Expected:

- Env vars mostly locate config/state/log dirs.
- `OH_MY_OPENCODE_SLIM_PRESET` is the only behavior-style override found in prior discovery.

- [ ] **Step 3: Write findings into implementation notes**

Add a short “Boundary Findings” section to `docs/omoc-distribution-layer.md` in Task 4. Do not modify code in this task.

- [ ] **Step 4: Commit inventory doc changes only if Task 4 file already exists**

If Task 4 has not created the guide yet, skip commit until Task 4.

### Task 2: Decide Skill Bundling Policy

**Files:**
- Modify: `docs/skills.md`
- Modify only if policy requires registry change: `src/cli/custom-skills.ts`
- Modify only if external recommended install changes: `src/cli/skills.ts`

- [ ] **Step 1: Add skill category definitions to docs**

Add this policy to `docs/skills.md`:

```markdown
## Skill Packaging Policy

OMOC treats skills in three categories:

1. **Bundled custom skills** live in `src/skills/` and are copied into the OpenCode config directory by the installer. Use this for skills that are core to OMOC workflows and maintained with this repo.
2. **Recommended external skills** are installed through the skills CLI during setup. Use this only for skills with an upstream owner or external runtime dependency.
3. **Permission-only skills** are not installed by OMOC. OMOC only grants agent permission for users who already have them.

For the OMOC distribution-layer path, prefer bundled custom skills for core orchestration workflows and keep DCP/quota-related skills outside OMOC unless a future design explicitly defines an integration boundary.
```

- [ ] **Step 2: Run docs check**

Run:

```bash
bun run check:ci
```

Expected:

- PASS, or only pre-existing unrelated failures.

- [ ] **Step 3: Commit docs-only policy**

```bash
git add docs/skills.md
git commit -m "docs: define skill packaging policy"
```

### Task 3: Add Minimal Distribution Config Guidance

**Files:**
- Modify: `docs/configuration.md`
- Modify: `docs/installation.md`

- [ ] **Step 1: Document minimal OpenCode host config**

Add a section to `docs/configuration.md` near “Config Files”:

```markdown
## OMOC as Distribution Layer

For a single-plugin setup, keep OpenCode core config small:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["oh-my-opencode-slim"]
}
```

OpenCode should continue owning auth, provider registration, model refresh, and host runtime behavior. OMOC owns its own plugin config in `~/.config/opencode/oh-my-opencode-slim.jsonc`: agents, presets, MCP assignments, multiplexer/session behavior, council, and bundled skill permissions.

DCP and quota systems are intentionally separate. Do not add them to OMOC config unless a future integration plan defines a narrow contract.
```

- [ ] **Step 2: Add install path to installation docs**

Add a short “Single-plugin setup” section to `docs/installation.md`:

```markdown
## Single-plugin setup

If you use OpenCode as your only harness, OMOC can act as your main distribution layer:

1. Install OMOC normally.
2. Keep `~/.config/opencode/opencode.json` focused on plugin registration and OpenCode host settings.
3. Put OMOC behavior in `~/.config/opencode/oh-my-opencode-slim.jsonc`.
4. Keep DCP and quota tooling separate from OMOC.
5. Migrate only the skills and MCPs you actually use.

Rollback is simple: remove `oh-my-opencode-slim` from OpenCode's `plugin` array and restart OpenCode.
```

- [ ] **Step 3: Validate docs formatting**

Run:

```bash
bun run check:ci
```

Expected: PASS.

- [ ] **Step 4: Commit config docs**

```bash
git add docs/configuration.md docs/installation.md
git commit -m "docs: describe OMOC distribution setup"
```

### Task 4: Create Migration Guide

**Files:**
- Create: `docs/omoc-distribution-layer.md`
- Modify: `README.md`

- [ ] **Step 1: Create guide**

Create `docs/omoc-distribution-layer.md` with:

```markdown
# OMOC as an OpenCode Distribution Layer

OMOC can be used as the main OpenCode plugin/distribution layer for users who do not need multiple harnesses.

## Ownership Model

OpenCode owns:

- Authentication
- Provider registry
- Model discovery and refresh
- Host config schema
- Core runtime/session execution

OMOC owns:

- Specialist agents and orchestrator routing
- Agent model presets
- MCP defaults and per-agent MCP permissions
- Built-in tools and runtime commands
- Runtime hooks
- Bundled custom skills
- Session reuse and multiplexer integration
- Council orchestration

External systems stay external:

- DCP
- Quota management
- User-specific private skills that are not curated into OMOC

## Migration Path

1. Start with a minimal OpenCode config containing only OMOC plugin registration and host-level settings.
2. Move OMOC behavior into `~/.config/opencode/oh-my-opencode-slim.jsonc`.
3. Inventory skills used in real workflows.
4. Bundle only core OMOC workflow skills into `src/skills/`.
5. Keep externally maintained skills as recommended installs or permission-only skills.
6. Keep DCP and quota outside OMOC.
7. Run `bun run check:ci`, `bun run typecheck`, and `bun test` before publishing changes.

## Decision Rules

Bundle a skill when it is core to OMOC's agent workflow and maintained with this repo.

Keep a skill external when it depends on another runtime, has its own upstream release process, or belongs to DCP/quota concerns.

Use permission-only registration when OMOC should allow an already-installed skill but should not install or vendor it.
```

- [ ] **Step 2: Link guide from README docs table**

Add one row under “Features & Workflows” or “Config & Reference”:

```markdown
| **[OMOC Distribution Layer](docs/omoc-distribution-layer.md)** | Use OMOC as the main OpenCode plugin layer while keeping OpenCode host duties and external systems separate |
```

- [ ] **Step 3: Validate docs**

Run:

```bash
bun run check:ci
```

Expected: PASS.

- [ ] **Step 4: Commit guide**

```bash
git add docs/omoc-distribution-layer.md README.md
git commit -m "docs: add OMOC distribution guide"
```

### Task 5: Add Curated Skill Migration Mechanism Only If Needed

**Files:**
- Modify if adding bundled skills: `src/cli/custom-skills.ts`
- Add if bundling new skill: `src/skills/<skill-name>/SKILL.md`
- Test if registry behavior changes: nearest existing CLI/config test

- [ ] **Step 1: Decide if any skill is core enough to bundle now**

Use this rubric:

```text
Bundle if all are true:
- Skill supports OMOC orchestration directly.
- Skill has no DCP/quota ownership.
- Skill has no external runtime install beyond normal OpenCode skill loading.
- User uses it frequently enough to justify package maintenance.

Do not bundle if any are true:
- Skill belongs to DCP/quota.
- Skill is harness-agnostic and better managed in ~/.agents.
- Skill has a separate upstream release process.
```

- [ ] **Step 2: If bundling, add registry entry**

Example implementation for a hypothetical `requirements-interview` bundle:

```typescript
{
  name: 'requirements-interview',
  description: 'Step-0 requirements discovery before non-trivial work',
  allowedAgents: ['orchestrator'],
  sourcePath: 'src/skills/requirements-interview',
},
```

Add it to `CUSTOM_SKILLS` in `src/cli/custom-skills.ts` only after the skill source exists in `src/skills/requirements-interview`.

- [ ] **Step 3: Run focused tests**

Run:

```bash
bun test -t "custom skill"
```

Expected:

- PASS if matching tests exist.
- If no matching tests exist, add/adjust tests before changing installer behavior.

- [ ] **Step 4: Run full validation**

```bash
bun run check:ci
bun run typecheck
bun test
```

Expected: PASS.

- [ ] **Step 5: Commit skill registry changes**

```bash
git add src/cli/custom-skills.ts src/skills
git commit -m "feat: bundle curated OMOC skill"
```

Skip this task entirely if no skill should be bundled in the first pass.

### Task 6: Review Gate

**Files:**
- Review all changed files from Tasks 2-5.

- [ ] **Step 1: Run repo checks**

```bash
bun run check:ci
bun run typecheck
bun test
```

Expected: PASS.

- [ ] **Step 2: Run pre-push review**

Use the repo-required review workflow:

```text
/review
```

Expected:

- No blocking findings.
- If findings exist, fix them and rerun relevant checks.

- [ ] **Step 3: Final manual acceptance checklist**

Verify:

- OpenCode remains host runtime.
- OMOC owns only plugin-layer behavior.
- DCP and quota are explicitly documented as separate.
- No new env var is introduced for behavior config.
- Minimal OpenCode config example is valid.
- Docs mention restart after config/plugin changes where applicable.

## Validation Matrix

| Change type | Required checks |
| --- | --- |
| Docs only | `bun run check:ci` |
| Config schema | `bun run check:ci`, `bun run typecheck`, config tests |
| Installer or skill registry | `bun run check:ci`, `bun run typecheck`, `bun test` |
| Runtime plugin behavior | `bun run check:ci`, `bun run typecheck`, `bun test`, manual OpenCode startup smoke test |

## Rollback Plan

If the migration path breaks startup:

1. Remove `oh-my-opencode-slim` from `~/.config/opencode/opencode.json` plugin array.
2. Restart OpenCode.
3. Restore previous skill path scanning or external `.agents` usage.
4. Re-enable OMOC after fixing config/docs/installer changes.

If a bundled skill causes problems:

1. Remove its entry from `CUSTOM_SKILLS`.
2. Remove its copied source from `src/skills/`.
3. Keep it as permission-only or external recommended skill if still useful.

## Self-Review

- Spec coverage: The plan covers OMOC as distribution layer, DCP/quota separation, config-first behavior, manual migration, docs, validation, and review gate.
- Placeholder scan: No `TBD`, `TODO`, “implement later”, or vague test-only directives remain.
- Type consistency: New code snippets refer to existing `CUSTOM_SKILLS` shape from `src/cli/custom-skills.ts`.
