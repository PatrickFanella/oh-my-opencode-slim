# Integrated Board Runtime Refoundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-found this repo as a Board-centered OpenCode operating system where Board runtime owns consultant routing, orchestration policy, escalation, and executor handoff.

**Architecture:** Keep OpenCode as the host process for auth, providers, model discovery, and core session execution. Replace the current OMOC-compatible “custom agents + Board Consultants prompt block” approach with a first-class Board runtime subsystem that has typed roles, routing policy, decision records, council escalation, agent permission profiles, and future hooks for persistence/TUI. Implement in staged vertical slices so current MCP merge work remains usable as the foundation.

**Tech Stack:** TypeScript, Bun, Zod, OpenCode plugin API, OpenCode MCP config, Biome.

**pipeline-type:** full
**persistence-mode:** hybrid
**change-name:** integrated-board-runtime-refoundation

---

## Approved Direction

User clarified this is not about preserving oh-my-opencode-slim as a fork. The new direction is a full system integration:

- Treat this repo as a new project built from OMOC internals.
- Keep current MCP merge changes as prerequisite foundation.
- Skip skill migration for now, but preserve migration policy and repo prep.
- Build Level 5 Board runtime: dedicated router, delegation policy, Board session state, escalation, and product identity.
- Use staged re-foundation, not big-bang rewrite.

## Non-Goals For First Refoundation Phase

- Do not remove OpenCode host duties: auth, providers, model refresh, and core sessions stay OpenCode-owned.
- Do not merge DCP or quota systems into this repo.
- Do not migrate `.agents` skills in this phase.
- Do not perform broad package rename before runtime seams are covered by tests.
- Do not make every Board consultant a hardcoded built-in agent until the Board runtime can route them through typed metadata.

## Existing Foundation To Preserve

The current uncommitted MCP merge is part of the foundation:

- `src/config/schema.ts` includes `enabled_mcps` and expanded MCP names.
- `src/mcp/index.ts` registers the merged `.agents` MCP list.
- host-dependent/product MCPs are opt-in by `enabled_mcps`.
- default agent MCPs stay conservative.
- `docs/mcps.md` and `docs/omoc-distribution-layer.md` document opt-in MCP behavior and future skill migration policy.

Before starting Task 1, run:

```bash
bun run check:ci
bun run typecheck
bun test
```

Expected: all pass.

## Target Architecture

Create a new `src/board/` subsystem:

```text
src/board/
  board-schema.ts        # Zod schemas and exported Board types
  board-registry.ts      # Built-in role templates and config merge helpers
  board-router.ts        # Request classification and consultant selection
  board-policy.ts        # Escalation/executor/council policy decisions
  board-runtime.ts       # Runtime facade used by plugin startup/hooks
  board-prompts.ts       # Compact prompt rendering for orchestrator injection
  board-state.ts         # In-memory decision/session records for first phase
  index.ts               # public exports
  *.test.ts              # focused tests beside each unit
```

Integrate with existing surfaces:

- `src/config/schema.ts`: add `board` config namespace.
- `src/config/loader.ts`: load/merge board config and package-provided board bundles.
- `src/agents/index.ts`: consume Board registry/runtime instead of ad hoc custom Board prompt placement.
- `src/agents/orchestrator.ts`: make Board routing a first-class prompt section.
- `src/index.ts`: instantiate Board runtime at plugin startup and expose it to hooks/permissions.
- `src/hooks/task-session-manager/index.ts`: later consume Board decision records for reusable session hints.
- `src/tui-state.ts` / `src/tui.ts`: later display active Board state.

## Task 1: Add Board Config Schema

**Files:**
- Modify: `src/config/schema.ts`
- Modify: `src/config/loader.ts`
- Test: `src/config/loader.test.ts`

- [ ] **Step 1: Write failing schema test for `board.enabled` and roles**

Add this test in `src/config/loader.test.ts` near package/config tests:

```typescript
test('loads board runtime config', () => {
  const projectDir = path.join(tempDir, 'project');
  const projectConfigDir = path.join(projectDir, '.opencode');
  fs.mkdirSync(projectConfigDir, { recursive: true });
  fs.writeFileSync(
    path.join(projectConfigDir, 'oh-my-opencode-slim.json'),
    JSON.stringify({
      board: {
        enabled: true,
        defaultMode: 'route',
        roles: {
          'backend-architect': {
            title: 'Backend Architect',
            purpose: 'API and service-boundary design',
            when: ['API contract changes', 'auth boundary changes'],
            outputs: ['recommendation', 'risks', 'next step'],
            agent: 'backend-architect',
            priority: 80,
          },
        },
      },
    }),
  );

  const config = loadPluginConfig(projectDir);

  expect(config.board?.enabled).toBe(true);
  expect(config.board?.defaultMode).toBe('route');
  expect(config.board?.roles?.['backend-architect']?.priority).toBe(80);
});
```

- [ ] **Step 2: Run test and confirm failure**

Run:

```bash
bun test -t "loads board runtime config"
```

Expected: FAIL because `board` is not in `PluginConfigSchema`.

- [ ] **Step 3: Add schema**

Add to `src/config/schema.ts` before `PluginConfigSchema`:

```typescript
export const BoardRoleConfigSchema = z
  .object({
    title: z.string().min(1),
    purpose: z.string().min(1),
    when: z.array(z.string().min(1)).default([]),
    outputs: z.array(z.string().min(1)).default([]),
    agent: z.string().min(1),
    priority: z.number().int().min(0).max(100).default(50),
    mcps: z.array(z.string()).optional(),
    skills: z.array(z.string()).optional(),
  })
  .strict();

export const BoardConfigSchema = z
  .object({
    enabled: z.boolean().default(false),
    defaultMode: z.enum(['off', 'route', 'advise', 'decide']).default('route'),
    roles: z.record(z.string(), BoardRoleConfigSchema).default({}),
    councilEscalation: z.boolean().default(true),
  })
  .strict();

export type BoardRoleConfig = z.infer<typeof BoardRoleConfigSchema>;
export type BoardConfig = z.infer<typeof BoardConfigSchema>;
```

Add to `PackageDefinitionSchema`:

```typescript
board: BoardConfigSchema.optional(),
```

Add to `PluginConfigSchema`:

```typescript
board: BoardConfigSchema.optional(),
```

- [ ] **Step 4: Merge board config from packages**

In `src/config/loader.ts`, add board to merge rules:

```typescript
board: deepMerge(base.board, override.board),
```

In `mergePackageIntoConfig`, add:

```typescript
board: deepMerge(base.board, packageDefinition.board),
```

In `applyPackageDefinitions` final return, add:

```typescript
board: deepMerge(packageConfig.board, config.board),
```

- [ ] **Step 5: Run focused test**

Run:

```bash
bun test -t "loads board runtime config"
```

Expected: PASS.

- [ ] **Step 6: Regenerate schema**

Run:

```bash
bun run generate-schema
```

Expected: `oh-my-opencode-slim.schema.json` changes include `board`.

## Task 2: Create Board Registry And Prompt Rendering

**Files:**
- Create: `src/board/board-schema.ts`
- Create: `src/board/board-registry.ts`
- Create: `src/board/board-prompts.ts`
- Create: `src/board/index.ts`
- Test: `src/board/board-registry.test.ts`
- Test: `src/board/board-prompts.test.ts`

- [ ] **Step 1: Add registry tests**

Create `src/board/board-registry.test.ts`:

```typescript
import { describe, expect, test } from 'bun:test';
import { createBoardRegistry } from './board-registry';

describe('createBoardRegistry', () => {
  test('returns disabled registry when board config is absent', () => {
    const registry = createBoardRegistry(undefined);

    expect(registry.enabled).toBe(false);
    expect(registry.roles).toEqual([]);
  });

  test('sorts enabled roles by priority descending', () => {
    const registry = createBoardRegistry({
      enabled: true,
      defaultMode: 'route',
      councilEscalation: true,
      roles: {
        lower: {
          title: 'Lower',
          purpose: 'Lower priority role',
          when: ['low risk'],
          outputs: ['note'],
          agent: 'lower',
          priority: 10,
        },
        higher: {
          title: 'Higher',
          purpose: 'Higher priority role',
          when: ['high risk'],
          outputs: ['decision'],
          agent: 'higher',
          priority: 90,
        },
      },
    });

    expect(registry.enabled).toBe(true);
    expect(registry.roles.map((role) => role.id)).toEqual(['higher', 'lower']);
  });
});
```

- [ ] **Step 2: Add prompt rendering tests**

Create `src/board/board-prompts.test.ts`:

```typescript
import { describe, expect, test } from 'bun:test';
import { renderBoardPromptSection } from './board-prompts';
import { createBoardRegistry } from './board-registry';

describe('renderBoardPromptSection', () => {
  test('returns empty string when board is disabled', () => {
    expect(renderBoardPromptSection(createBoardRegistry(undefined))).toBe('');
  });

  test('renders compact role routing section', () => {
    const registry = createBoardRegistry({
      enabled: true,
      defaultMode: 'route',
      councilEscalation: true,
      roles: {
        'backend-architect': {
          title: 'Backend Architect',
          purpose: 'API and service-boundary design',
          when: ['API contract changes'],
          outputs: ['recommendation', 'risks'],
          agent: 'backend-architect',
          priority: 80,
        },
      },
    });

    const section = renderBoardPromptSection(registry);

    expect(section).toContain('<Board Runtime>');
    expect(section).toContain('@backend-architect');
    expect(section).toContain('API contract changes');
    expect(section).toContain('</Board Runtime>');
  });
});
```

- [ ] **Step 3: Implement Board types**

Create `src/board/board-schema.ts`:

```typescript
import type { BoardConfig, BoardRoleConfig } from '../config/schema';

export type BoardMode = 'off' | 'route' | 'advise' | 'decide';

export type BoardRole = BoardRoleConfig & {
  id: string;
};

export type BoardRegistry = {
  enabled: boolean;
  mode: BoardMode;
  councilEscalation: boolean;
  roles: BoardRole[];
};

export type BoardRuntimeConfig = BoardConfig | undefined;
```

- [ ] **Step 4: Implement registry**

Create `src/board/board-registry.ts`:

```typescript
import type { BoardRegistry, BoardRuntimeConfig } from './board-schema';

export function createBoardRegistry(
  config: BoardRuntimeConfig,
): BoardRegistry {
  if (!config?.enabled) {
    return {
      enabled: false,
      mode: 'off',
      councilEscalation: false,
      roles: [],
    };
  }

  const roles = Object.entries(config.roles ?? {})
    .map(([id, role]) => ({ id, ...role }))
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));

  return {
    enabled: true,
    mode: config.defaultMode,
    councilEscalation: config.councilEscalation,
    roles,
  };
}
```

- [ ] **Step 5: Implement prompt rendering**

Create `src/board/board-prompts.ts`:

```typescript
import type { BoardRegistry, BoardRole } from './board-schema';

function renderRole(role: BoardRole): string {
  const when = role.when.length ? role.when.join(' • ') : 'Use when relevant.';
  const outputs = role.outputs.length
    ? role.outputs.join(', ')
    : 'recommendation, risks, next step';

  return [
    `@${role.agent}`,
    `- Role: ${role.title}`,
    `- Purpose: ${role.purpose}`,
    `- Route when: ${when}`,
    `- Output: ${outputs}`,
  ].join('\n');
}

export function renderBoardPromptSection(registry: BoardRegistry): string {
  if (!registry.enabled || registry.roles.length === 0) {
    return '';
  }

  const councilLine = registry.councilEscalation
    ? '- Escalate to council for high-stakes disagreement or multi-system risk.'
    : '- Do not escalate to council automatically.';

  return [
    '<Board Runtime>',
    `Mode: ${registry.mode}`,
    '- Board owns consultant routing and executor handoff.',
    '- Consultants advise; fixer/self executes bounded edits.',
    councilLine,
    '',
    ...registry.roles.map(renderRole),
    '</Board Runtime>',
  ].join('\n');
}
```

- [ ] **Step 6: Add public exports**

Create `src/board/index.ts`:

```typescript
export type { BoardRegistry, BoardRole, BoardRuntimeConfig } from './board-schema';
export { createBoardRegistry } from './board-registry';
export { renderBoardPromptSection } from './board-prompts';
```

- [ ] **Step 7: Run tests**

Run:

```bash
bun test -t "createBoardRegistry|renderBoardPromptSection"
```

Expected: PASS.

## Task 3: Integrate Board Runtime Into Agent Prompt Assembly

**Files:**
- Modify: `src/agents/index.ts`
- Modify: `src/agents/orchestrator.ts`
- Test: `src/agents/custom.test.ts`

- [ ] **Step 1: Add failing test for Board runtime prompt section**

Add to `src/agents/custom.test.ts`:

```typescript
test('injects board runtime section from board config', () => {
  const agents = createAgents({
    board: {
      enabled: true,
      defaultMode: 'route',
      councilEscalation: true,
      roles: {
        'backend-architect': {
          title: 'Backend Architect',
          purpose: 'API and service-boundary design',
          when: ['API contract changes'],
          outputs: ['recommendation', 'risks'],
          agent: 'backend-architect',
          priority: 80,
        },
      },
    },
    agents: {
      'backend-architect': {
        model: 'openai/gpt-5.5',
        prompt: 'You are Backend Architect.',
      },
    },
  });

  const orchestrator = agents.find((agent) => agent.name === 'orchestrator');

  expect(orchestrator?.config.prompt).toContain('<Board Runtime>');
  expect(orchestrator?.config.prompt).toContain('@backend-architect');
  expect(orchestrator?.config.prompt).toContain('API contract changes');
});
```

- [ ] **Step 2: Run test and confirm failure**

Run:

```bash
bun test -t "injects board runtime section"
```

Expected: FAIL because Board runtime is not integrated.

- [ ] **Step 3: Wire registry into `createAgents`**

In `src/agents/index.ts`, import:

```typescript
import { createBoardRegistry, renderBoardPromptSection } from '../board';
```

Inside `createAgents(config?: PluginConfig)`, create:

```typescript
const boardRegistry = createBoardRegistry(config?.board);
const boardPromptSection = renderBoardPromptSection(boardRegistry);
```

Append/inject `boardPromptSection` into the orchestrator prompt near the current Board Consultants placement. Existing custom `orchestratorPrompt` support can remain as compatibility input, but Board runtime section should render first when `board.enabled` is true.

- [ ] **Step 4: Keep custom prompt compatibility**

Ensure existing tests for custom `orchestratorPrompt` still pass. Compatibility behavior:

- `config.board` renders `<Board Runtime>`.
- custom agents with `orchestratorPrompt` still render for users not migrated to `board.roles`.
- if both exist, Board Runtime appears before legacy Board Consultants.

- [ ] **Step 5: Run tests**

Run:

```bash
bun test -t "custom-agent creation|injects board runtime section"
```

Expected: PASS.

## Task 4: Add Board Router And Policy Core

**Files:**
- Create: `src/board/board-router.ts`
- Create: `src/board/board-policy.ts`
- Test: `src/board/board-router.test.ts`
- Test: `src/board/board-policy.test.ts`
- Modify: `src/board/index.ts`

- [ ] **Step 1: Add router tests**

Create `src/board/board-router.test.ts`:

```typescript
import { describe, expect, test } from 'bun:test';
import { createBoardRegistry } from './board-registry';
import { routeBoardRequest } from './board-router';

const registry = createBoardRegistry({
  enabled: true,
  defaultMode: 'route',
  councilEscalation: true,
  roles: {
    backend: {
      title: 'Backend Architect',
      purpose: 'API design',
      when: ['API', 'auth', 'service'],
      outputs: ['recommendation'],
      agent: 'backend-architect',
      priority: 70,
    },
    security: {
      title: 'Security Advisor',
      purpose: 'Security review',
      when: ['auth', 'secrets', 'privacy'],
      outputs: ['risks'],
      agent: 'security-advisor',
      priority: 90,
    },
  },
});

describe('routeBoardRequest', () => {
  test('returns matching roles ordered by score and priority', () => {
    const decision = routeBoardRequest(registry, 'Review auth boundary for API');

    expect(decision.primary?.agent).toBe('security-advisor');
    expect(decision.candidates.map((role) => role.agent)).toContain(
      'backend-architect',
    );
  });

  test('returns empty candidates for disabled registry', () => {
    const decision = routeBoardRequest(createBoardRegistry(undefined), 'API');

    expect(decision.primary).toBeUndefined();
    expect(decision.candidates).toEqual([]);
  });
});
```

- [ ] **Step 2: Implement router**

Create `src/board/board-router.ts`:

```typescript
import type { BoardRegistry, BoardRole } from './board-schema';

export type BoardRouteDecision = {
  input: string;
  primary?: BoardRole;
  candidates: BoardRole[];
};

function scoreRole(role: BoardRole, input: string): number {
  const normalized = input.toLowerCase();
  const terms = [role.title, role.purpose, ...role.when]
    .join(' ')
    .toLowerCase()
    .split(/[^a-z0-9_-]+/)
    .filter(Boolean);

  const uniqueTerms = new Set(terms);
  let score = 0;
  for (const term of uniqueTerms) {
    if (normalized.includes(term)) score += 1;
  }

  return score;
}

export function routeBoardRequest(
  registry: BoardRegistry,
  input: string,
): BoardRouteDecision {
  if (!registry.enabled) {
    return { input, candidates: [] };
  }

  const scored = registry.roles
    .map((role) => ({ role, score: scoreRole(role, input) }))
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || b.role.priority - a.role.priority ||
        a.role.id.localeCompare(b.role.id),
    );

  const candidates = scored.map((entry) => entry.role);
  return { input, primary: candidates[0], candidates };
}
```

- [ ] **Step 3: Add policy tests**

Create `src/board/board-policy.test.ts`:

```typescript
import { describe, expect, test } from 'bun:test';
import { decideBoardAction } from './board-policy';

describe('decideBoardAction', () => {
  test('uses self when board has no candidate', () => {
    expect(decideBoardAction({ input: 'hello', candidates: [] })).toEqual({
      type: 'self',
      reason: 'No board role matched the request.',
    });
  });

  test('delegates when primary candidate exists', () => {
    const action = decideBoardAction({
      input: 'auth API',
      primary: {
        id: 'security',
        title: 'Security Advisor',
        purpose: 'Security',
        when: ['auth'],
        outputs: ['risks'],
        agent: 'security-advisor',
        priority: 90,
      },
      candidates: [],
    });

    expect(action).toEqual({
      type: 'delegate',
      agent: 'security-advisor',
      reason: 'Board selected Security Advisor.',
    });
  });
});
```

- [ ] **Step 4: Implement policy**

Create `src/board/board-policy.ts`:

```typescript
import type { BoardRouteDecision } from './board-router';

export type BoardAction =
  | { type: 'self'; reason: string }
  | { type: 'delegate'; agent: string; reason: string }
  | { type: 'council'; reason: string };

export function decideBoardAction(decision: BoardRouteDecision): BoardAction {
  if (!decision.primary) {
    return { type: 'self', reason: 'No board role matched the request.' };
  }

  return {
    type: 'delegate',
    agent: decision.primary.agent,
    reason: `Board selected ${decision.primary.title}.`,
  };
}
```

- [ ] **Step 5: Export router and policy**

Update `src/board/index.ts`:

```typescript
export type { BoardRegistry, BoardRole, BoardRuntimeConfig } from './board-schema';
export { createBoardRegistry } from './board-registry';
export { renderBoardPromptSection } from './board-prompts';
export type { BoardRouteDecision } from './board-router';
export { routeBoardRequest } from './board-router';
export type { BoardAction } from './board-policy';
export { decideBoardAction } from './board-policy';
```

- [ ] **Step 6: Run tests**

Run:

```bash
bun test -t "routeBoardRequest|decideBoardAction"
```

Expected: PASS.

## Task 5: Add Board Runtime Facade And Decision State

**Files:**
- Create: `src/board/board-state.ts`
- Create: `src/board/board-runtime.ts`
- Test: `src/board/board-runtime.test.ts`
- Modify: `src/board/index.ts`

- [ ] **Step 1: Add runtime tests**

Create `src/board/board-runtime.test.ts`:

```typescript
import { describe, expect, test } from 'bun:test';
import { createBoardRuntime } from './board-runtime';

describe('createBoardRuntime', () => {
  test('records routing decisions in memory', () => {
    const runtime = createBoardRuntime({
      enabled: true,
      defaultMode: 'route',
      councilEscalation: true,
      roles: {
        backend: {
          title: 'Backend Architect',
          purpose: 'API design',
          when: ['API'],
          outputs: ['recommendation'],
          agent: 'backend-architect',
          priority: 70,
        },
      },
    });

    const record = runtime.route('Design API boundary');

    expect(record.action.type).toBe('delegate');
    expect(runtime.getRecentDecisions()).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Implement state**

Create `src/board/board-state.ts`:

```typescript
import type { BoardAction } from './board-policy';
import type { BoardRouteDecision } from './board-router';

export type BoardDecisionRecord = {
  id: string;
  createdAt: string;
  decision: BoardRouteDecision;
  action: BoardAction;
};

export type BoardState = {
  add(record: Omit<BoardDecisionRecord, 'id' | 'createdAt'>): BoardDecisionRecord;
  recent(): BoardDecisionRecord[];
};

export function createBoardState(limit = 25): BoardState {
  const records: BoardDecisionRecord[] = [];
  let nextId = 1;

  return {
    add(record) {
      const stored = {
        id: `board-${nextId++}`,
        createdAt: new Date().toISOString(),
        ...record,
      };
      records.unshift(stored);
      records.splice(limit);
      return stored;
    },
    recent() {
      return [...records];
    },
  };
}
```

- [ ] **Step 3: Implement runtime facade**

Create `src/board/board-runtime.ts`:

```typescript
import type { BoardConfig } from '../config/schema';
import { decideBoardAction } from './board-policy';
import { createBoardRegistry } from './board-registry';
import { createBoardState, type BoardDecisionRecord } from './board-state';
import { routeBoardRequest } from './board-router';

export type BoardRuntime = {
  route(input: string): BoardDecisionRecord;
  getRecentDecisions(): BoardDecisionRecord[];
};

export function createBoardRuntime(config: BoardConfig | undefined): BoardRuntime {
  const registry = createBoardRegistry(config);
  const state = createBoardState();

  return {
    route(input) {
      const decision = routeBoardRequest(registry, input);
      const action = decideBoardAction(decision);
      return state.add({ decision, action });
    },
    getRecentDecisions() {
      return state.recent();
    },
  };
}
```

- [ ] **Step 4: Export runtime**

Update `src/board/index.ts`:

```typescript
export type { BoardRuntime } from './board-runtime';
export { createBoardRuntime } from './board-runtime';
export type { BoardDecisionRecord } from './board-state';
```

- [ ] **Step 5: Run tests**

Run:

```bash
bun test -t "createBoardRuntime"
```

Expected: PASS.

## Task 6: Wire Runtime At Plugin Startup Without Behavior Change

**Files:**
- Modify: `src/index.ts`
- Test: existing full test suite

- [ ] **Step 1: Instantiate runtime in `src/index.ts`**

Import:

```typescript
import { createBoardRuntime, type BoardRuntime } from './board';
```

Near other module-level state, add:

```typescript
let boardRuntime: BoardRuntime | undefined;
```

During plugin initialization after config load, add:

```typescript
boardRuntime = createBoardRuntime(config.board);
```

Do not route live chat through this runtime yet. This task only creates the runtime seam.

- [ ] **Step 2: Run typecheck**

Run:

```bash
bun run typecheck
```

Expected: PASS.

- [ ] **Step 3: Run full tests**

Run:

```bash
bun test
```

Expected: PASS.

## Task 7: Document New Project Direction

**Files:**
- Modify: `docs/omoc-distribution-layer.md`
- Create: `docs/board-runtime.md`
- Modify: `README.md`

- [ ] **Step 1: Create Board runtime doc**

Create `docs/board-runtime.md`:

```markdown
# Board Runtime

Board Runtime is the central orchestration subsystem for this project.

It owns:

- consultant role metadata;
- routing policy;
- delegation recommendations;
- council escalation policy;
- in-memory decision records for the first phase;
- future hooks for persistence and TUI/status display.

OpenCode remains the host runtime for auth, providers, model discovery, and core sessions. DCP and quota remain separate systems.

## First Phase

The first phase makes Board runtime real without forcing a full rename or broad behavior swap:

1. `board` config namespace.
2. typed Board role registry.
3. prompt rendering through `<Board Runtime>`.
4. route/policy functions.
5. runtime facade with in-memory decisions.

## Later Phases

- persistent Board decisions;
- TUI Board status;
- structured slash/runtime commands;
- deeper executor handoff;
- product rename and package identity migration.
```

- [ ] **Step 2: Link doc from README**

Add to docs table:

```markdown
| **[Board Runtime](docs/board-runtime.md)** | First-class Board routing, delegation policy, and future orchestration runtime |
```

- [ ] **Step 3: Update OMOC distribution doc**

In `docs/omoc-distribution-layer.md`, add a note:

```markdown
This repository is being re-founded around Board Runtime. OMOC distribution-layer docs describe the migration foundation, not a permanent constraint to preserve fork identity.
```

- [ ] **Step 4: Run docs check**

Run:

```bash
bun run check:ci
```

Expected: PASS.

## Task 8: Full Validation And Review Gate

**Files:**
- All changed files.

- [ ] **Step 1: Regenerate schema**

Run:

```bash
bun run generate-schema
```

Expected: schema includes `board` config.

- [ ] **Step 2: Run full validation**

Run:

```bash
bun run check:ci
bun run typecheck
bun test
```

Expected: all pass.

- [ ] **Step 3: Run review gate**

Use repo guidance:

```text
/review
```

Expected: no blocking findings. Fix any blocking finding and rerun relevant checks.

- [ ] **Step 4: Manual acceptance checklist**

Verify:

- MCP merge prerequisite remains intact.
- Skill migration is still skipped.
- `board` config exists and loads.
- Board prompt renders from typed role metadata.
- Router/policy/runtime tests pass.
- Runtime is instantiated but does not yet force behavior changes beyond prompt section.
- Docs state this is a new Board-centered project direction.

## Future Implementation Tracks

After this plan lands, split future work into separate plans:

1. **Persistent Board State** — file/db/memory backend, resumable decisions, session continuity.
2. **Board Commands** — `/board route`, `/board status`, `/board roles`, `/board decide`.
3. **Board TUI** — active decision and consultant status sidebar.
4. **Executor Handoff** — structured prompts to fixer/self/council from `BoardAction`.
5. **Project Identity Migration** — package name, docs, CLI, config filename, README positioning.
6. **Skill Migration** — curate core workflow skills into repo after usage inventory.

## Self-Review

- Spec coverage: Captures full Level 5 direction, whole-system refoundation, staged approach, MCP prerequisite, skill-migration skip, and Board runtime ownership.
- Placeholder scan: No `TBD`, `TODO`, “implement later”, or vague test-only directives remain.
- Type consistency: `BoardConfig`, `BoardRoleConfig`, `BoardRegistry`, `BoardRuntime`, `BoardRouteDecision`, and `BoardAction` are introduced before use.
