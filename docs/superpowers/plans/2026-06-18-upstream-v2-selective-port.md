# Upstream v2 Selective Port Implementation Plan

> **For agentic workers:** Execute this plan task-by-task. Recommended path:
> dispatch a fresh subagent per task, review each result with `review-quality`,
> then continue. For complex multi-agent splits, use
> `parallel-feature-development`, `team-composition-patterns`, and
> `team-communication-protocols`. Steps use checkbox (`- [ ]`) syntax for
> tracking.

**Goal:** Cherry-pick the useful upstream `oh-my-opencode-slim` v2 reliability
features into blacktower without breaking blacktower-specific orchestration,
configuration, Divoom/control-center, `subtask`, or todo continuation.

**Architecture:** Treat upstream v2.0.4 as a reference implementation, not a
merge target. Add a blacktower-native background job board and cancellation
layer beside the existing task-session manager first, then incrementally wire it
into existing hooks and tools. Keep all OpenCode SDK calls timeout-guarded and
preserve the recently-added event-handler isolation.

**Tech Stack:** TypeScript, Bun, OpenCode plugin SDK, Zod, Biome, existing
blacktower hook/tool factory patterns.

---

## Non-negotiables

- Do not wholesale merge upstream v2.
- Do not remove `src/tools/subtask/`.
- Do not remove `src/hooks/todo-continuation/`.
- Do not replace `src/divoom/`, `src/control-center/`, or
  `apps/control-center-web/`.
- Do not remove `fallback.chains` support.
- Do not break `grep_app` compatibility.
- Keep all SDK session operations behind timeout helpers from
  `src/utils/session.ts`.
- Keep event hook steps isolated through `runEventStep` in `src/index.ts`.
- Do not change default user-facing orchestration behavior until the new job
  board has tests and a rollback path.

## Feature decisions

| Upstream v2 feature | Decision | Why |
|---|---|---|
| Smartfetch secondary-session cleanup retries | Port first | Small isolated reliability win. |
| `BackgroundJobBoard` | Adapt | Core reliability primitive; must preserve blacktower aliases/timeouts. |
| Rebuilt task-session manager | Partially adapt | Reuse ideas, not file wholesale; blacktower has valuable alias behavior. |
| `cancel_task` | Port after board | Needs board/session-manager integration to be safe. |
| Native background subagent installer support | Add later | Useful, but config/install behavior is user-facing. |
| ACP bridge | Defer | Separate integration surface; not required for hang mitigation. |
| Companion replacing Divoom | Reject for this plan | Product direction conflict with blacktower Divoom/control-center. |
| `grep_app` → `gh_grep` rename | Alias only, if needed | Avoid breaking existing configs. |

## File structure

### Create

- `src/utils/background-job-board.ts` — blacktower-native background job state
  model, alias lookup, state transitions, reconciliation metadata, and prompt
  formatting helpers.
- `src/utils/background-job-board.test.ts` — unit tests for board transitions,
  aliases, cancellation marks, duplicate events, and terminal states.
- `src/tools/cancel-task.ts` — `cancel_task` OpenCode tool for delegated task
  session cancellation.
- `src/tools/cancel-task.test.ts` — cancellation tool unit tests with mocked SDK
  session abort behavior.
- `docs/background-orchestration.md` — blacktower docs for observable delegated
  jobs and cancellation semantics.

### Modify

- `src/tools/smartfetch/secondary-model.ts` — add cleanup retry helper around
  temporary secondary session deletion/abort.
- `src/hooks/task-session-manager/index.ts` — publish task lifecycle events to
  `BackgroundJobBoard` while preserving current alias behavior.
- `src/index.ts` — instantiate the board, pass it to task-session manager,
  register `cancel_task`, and include new hook/tool state in existing isolated
  event flow.
- `src/tools/index.ts` — export `createCancelTaskTool`.
- `src/config/schema.ts` — add optional additive background job config only if
  required; do not remove existing keys.
- `src/config/loader.ts` — merge optional background job config only if schema
  is added.
- `README.md`, `docs/tools.md`, `docs/session-management.md`,
  `docs/installation.md` — document only shipped behavior.

### Reference only

- `/tmp/opencode/oh-my-opencode-slim/src/utils/background-job-board.ts`
- `/tmp/opencode/oh-my-opencode-slim/src/hooks/task-session-manager/index.ts`
- `/tmp/opencode/oh-my-opencode-slim/src/tools/cancel-task.ts`
- `/tmp/opencode/oh-my-opencode-slim/src/cli/background-subagents.ts`

---

## Phase A: Low-risk reliability patch

### Task A1: Port smartfetch cleanup retries

**Files:**
- Modify: `src/tools/smartfetch/secondary-model.ts`
- Test: existing smartfetch tests, or add focused tests beside current module if
  no coverage exists.

- [ ] **Step 1: Inspect the current blacktower file and upstream reference**

  Read:

  ```bash
  # Use Read tool, not cat, during agent execution.
  src/tools/smartfetch/secondary-model.ts
  /tmp/opencode/oh-my-opencode-slim/src/tools/smartfetch/secondary-model.ts
  ```

- [ ] **Step 2: Add retry constants**

  Add near existing timeout constants:

  ```ts
  const SESSION_DELETE_RETRIES = 3;
  const SESSION_DELETE_RETRY_DELAY_MS = 500;
  ```

- [ ] **Step 3: Add a bounded cleanup helper**

  Implement cleanup with existing timeout helpers. Shape:

  ```ts
  async function deleteSessionSafely(
    client: App['client'],
    sessionID: string,
  ): Promise<void> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= SESSION_DELETE_RETRIES; attempt++) {
      try {
        await abortSessionWithTimeout(client, sessionID, 1000);
        return;
      } catch (error) {
        lastError = error;
        if (attempt < SESSION_DELETE_RETRIES) {
          await delay(SESSION_DELETE_RETRY_DELAY_MS);
        }
      }
    }

    console.warn('[smartfetch] failed to clean up temporary session', {
      sessionID,
      error: lastError instanceof Error ? lastError.message : String(lastError),
    });
  }
  ```

  Import or reuse the repo's existing `delay` helper if available; otherwise add
  a tiny local promise-based delay.

- [ ] **Step 4: Replace direct temporary-session cleanup**

  Replace direct `session.delete`, `session.abort`, or one-shot cleanup calls in
  `secondary-model.ts` with:

  ```ts
  await deleteSessionSafely(client, session.id);
  ```

- [ ] **Step 5: Verify**

  Run:

  ```bash
  bun run check:ci
  bun run typecheck
  bun test src/tools/smartfetch
  ```

  Expected: all pass. If `bun test src/tools/smartfetch` has no matching tests,
  run `bun test -t smartfetch` and then full `bun test` before completing the
  phase.

---

## Phase B: Add `BackgroundJobBoard` as an internal primitive

### Task B1: Create the board type and tests

**Files:**
- Create: `src/utils/background-job-board.ts`
- Create: `src/utils/background-job-board.test.ts`

- [ ] **Step 1: Write failing tests for board behavior**

  Add tests covering:

  ```ts
  import { describe, expect, test } from 'bun:test';
  import { BackgroundJobBoard } from './background-job-board';

  describe('BackgroundJobBoard', () => {
    test('creates parent-scoped aliases by agent prefix', () => {
      const board = new BackgroundJobBoard();

      const job = board.recordLaunch({
        parentSessionID: 'parent-1',
        taskID: 'task-1',
        agent: 'explorer',
        description: 'map files',
        objective: 'find relevant code',
        source: 'task',
      });

      expect(job.alias).toBe('exp-1');
      expect(board.resolve('parent-1', 'exp-1')?.taskID).toBe('task-1');
      expect(board.resolve('other-parent', 'exp-1')).toBeUndefined();
    });

    test('updates states idempotently', () => {
      const board = new BackgroundJobBoard();
      board.recordLaunch({
        parentSessionID: 'parent-1',
        taskID: 'task-1',
        agent: 'fixer',
        description: 'edit file',
        objective: 'apply bounded change',
        source: 'task',
      });

      board.updateState('task-1', 'running');
      board.updateState('task-1', 'running');

      expect(board.get('task-1')?.state).toBe('running');
    });

    test('marks cancellation requested without deleting the job', () => {
      const board = new BackgroundJobBoard();
      board.recordLaunch({
        parentSessionID: 'parent-1',
        taskID: 'task-1',
        agent: 'oracle',
        description: 'review plan',
        objective: 'advise',
        source: 'task',
      });

      board.markCancellationRequested('task-1');

      expect(board.get('task-1')?.cancellationRequested).toBe(true);
      expect(board.get('task-1')?.state).toBe('cancelling');
    });
  });
  ```

- [ ] **Step 2: Implement minimal board API**

  Implement these exported types and methods:

  ```ts
  export type BackgroundJobState =
    | 'pending'
    | 'running'
    | 'completed'
    | 'failed'
    | 'cancelled'
    | 'cancelling'
    | 'unknown'
    | 'reconciled';

  export type BackgroundJobSource = 'task' | 'subtask' | 'council' | 'native-background';

  export interface BackgroundJobRecord {
    taskID: string;
    parentSessionID: string;
    alias: string;
    agent: string;
    description: string;
    objective: string;
    source: BackgroundJobSource;
    state: BackgroundJobState;
    createdAt: number;
    updatedAt: number;
    cancellationRequested: boolean;
    timedOut: boolean;
    statusUncertain: boolean;
    terminalUnreconciled: boolean;
    lastError?: string;
    resultSummary?: string;
    contextFiles: string[];
  }
  ```

  Required methods:

  ```ts
  recordLaunch(input: Omit<BackgroundJobRecord,
    | 'alias'
    | 'state'
    | 'createdAt'
    | 'updatedAt'
    | 'cancellationRequested'
    | 'timedOut'
    | 'statusUncertain'
    | 'terminalUnreconciled'
    | 'contextFiles'
  > & { contextFiles?: string[] }): BackgroundJobRecord

  get(taskID: string): BackgroundJobRecord | undefined
  resolve(parentSessionID: string, idOrAlias: string): BackgroundJobRecord | undefined
  updateState(taskID: string, state: BackgroundJobState, details?: {
    lastError?: string;
    resultSummary?: string;
    timedOut?: boolean;
    statusUncertain?: boolean;
  }): BackgroundJobRecord | undefined
  markCancellationRequested(taskID: string): BackgroundJobRecord | undefined
  markReconciled(taskID: string): BackgroundJobRecord | undefined
  listForParent(parentSessionID: string): BackgroundJobRecord[]
  removeForParent(parentSessionID: string): void
  formatForPrompt(parentSessionID: string): string
  ```

- [ ] **Step 3: Keep the board synchronous**

  The board must not call `ctx.client`, `session.abort`, `session.messages`, or
  any OpenCode SDK method. It is an in-memory state model only.

- [ ] **Step 4: Verify**

  Run:

  ```bash
  bun test src/utils/background-job-board.test.ts
  bun run check:ci
  bun run typecheck
  ```

---

## Phase C: Integrate board with current task-session manager

### Task C1: Publish task lifecycle into the board

**Files:**
- Modify: `src/hooks/task-session-manager/index.ts`
- Modify: `src/index.ts`
- Test: existing `src/hooks/task-session-manager` tests, plus new cases if
  missing.

- [ ] **Step 1: Extend task-session manager options**

  Add an optional `backgroundJobBoard` option to `createTaskSessionManagerHook`.
  Shape:

  ```ts
  import type { BackgroundJobBoard } from '../../utils/background-job-board';

  interface TaskSessionManagerOptions {
    maxSessionsPerAgent?: number;
    shouldManageSession?: (sessionID: string) => boolean;
    backgroundJobBoard?: BackgroundJobBoard;
  }
  ```

- [ ] **Step 2: Record pending task metadata in `tool.execute.before`**

  Preserve existing alias rewrite and pending-call behavior. Add board metadata
  only after the current code has accepted the task call as manageable.

  Store enough in the existing pending-call record to later call
  `recordLaunch` after `parseTaskIdFromTaskOutput` succeeds:

  ```ts
  {
    parentSessionID,
    agent: args.subagent_type,
    description: args.description ?? args.prompt.slice(0, 80),
    objective: args.prompt,
    source: 'task' as const,
  }
  ```

- [ ] **Step 3: Record launched task in `tool.execute.after`**

  After the existing code parses a task ID and remembers the session, call:

  ```ts
  backgroundJobBoard?.recordLaunch({
    parentSessionID,
    taskID,
    agent: pending.agent,
    description: pending.label,
    objective: pending.prompt,
    source: 'task',
  });
  ```

  If the board already has the task ID, update it instead of creating a
  duplicate.

- [ ] **Step 4: Update board on stale/deleted sessions**

  On stale resume errors and `session.deleted`, mark matching board jobs as
  `unknown`, `cancelled`, or remove parent state consistently with existing
  `SessionManager` cleanup.

- [ ] **Step 5: Instantiate board in `src/index.ts`**

  Near other runtime managers:

  ```ts
  const backgroundJobBoard = new BackgroundJobBoard();
  ```

  Pass it into `createTaskSessionManagerHook`.

- [ ] **Step 6: Verify no prompt regression**

  Existing `### Resumable Sessions` output must remain stable. If adding a new
  prompt section, title it separately:

  ```md
  ### Background Jobs
  ```

  Do not replace the current resumable-session section in this phase.

- [ ] **Step 7: Run tests**

  ```bash
  bun test src/hooks/task-session-manager
  bun test src/utils/background-job-board.test.ts
  bun run check:ci
  bun run typecheck
  ```

---

## Phase D: Add `cancel_task`

### Task D1: Implement cancellation tool

**Files:**
- Create: `src/tools/cancel-task.ts`
- Create: `src/tools/cancel-task.test.ts`
- Modify: `src/tools/index.ts`
- Modify: `src/index.ts`
- Modify: `docs/tools.md`
- Modify: `docs/background-orchestration.md`

- [ ] **Step 1: Write failing tests**

  Cover:

  - cancel by board alias (`exp-1`)
  - cancel by raw task/session ID
  - unknown ID returns useful error
  - already completed job is idempotent
  - abort timeout returns uncertain status instead of hanging

- [ ] **Step 2: Implement tool factory**

  Export:

  ```ts
  export function createCancelTaskTool(options: {
    client: App['client'];
    backgroundJobBoard: BackgroundJobBoard;
  }): Tool.Definition
  ```

  Tool input:

  ```ts
  {
    id: z.string().describe('Task/session ID or Background Jobs alias'),
  }
  ```

- [ ] **Step 3: Resolve IDs safely**

  In execute, require `toolContext.sessionID`. Resolve in order:

  1. `backgroundJobBoard.resolve(parentSessionID, input.id)`
  2. `backgroundJobBoard.get(input.id)` only if `parentSessionID` matches
  3. otherwise return a message listing known aliases for that parent

- [ ] **Step 4: Abort through timeout helper**

  Use:

  ```ts
  await abortSessionWithTimeout(client, job.taskID, 1000);
  ```

  On success, mark `cancelled`. On timeout/error, mark `statusUncertain` and
  return an explicit warning that cancellation may still be in progress.

- [ ] **Step 5: Register tool**

  Export from `src/tools/index.ts`, then register in `src/index.ts` next to other
  public tools:

  ```ts
  cancel_task: createCancelTaskTool({
    client: ctx.client,
    backgroundJobBoard,
  }),
  ```

- [ ] **Step 6: Document scope**

  In docs, state: `cancel_task` cancels delegated OpenCode task sessions tracked
  by Background Jobs. It does not cancel scheduled tasks from the control center,
  and it does not roll back file edits already written by a worker.

- [ ] **Step 7: Verify**

  ```bash
  bun test src/tools/cancel-task.test.ts
  bun test src/hooks/task-session-manager
  bun run check:ci
  bun run typecheck
  bun test
  ```

---

## Phase E: Manual smoke testing for tmux/zellij/orphans

### Task E1: Validate delegated task lifecycle manually

**Files:**
- No code files unless bugs are found.

- [ ] **Step 1: Build locally**

  ```bash
  bun run build
  ```

- [ ] **Step 2: Run with local plugin**

  Configure OpenCode to load this checkout via `file:///path/to/blacktower`.

- [ ] **Step 3: Launch a long-running delegated task**

  In OpenCode:

  ```text
  @explorer scan src/ and summarize where task session state is managed
  ```

- [ ] **Step 4: Cancel it**

  Use `cancel_task` with the shown alias or raw task ID.

- [ ] **Step 5: Check no orphans remain**

  ```bash
  ps aux | grep "opencode attach" | grep -v grep
  ```

  Expected: no stale child attach processes after cancellation and cleanup.

- [ ] **Step 6: Check session reuse still works**

  Resume a non-cancelled remembered task alias and verify the existing
  task-session manager still rewrites aliases correctly.

---

## Phase F: Add native background-subagent installer support

Only start this phase after Phases B–E are stable.

### Task F1: Add additive installer support

**Files:**
- Modify: `src/cli/install.ts`
- Create or modify: `src/cli/background-subagents.ts`
- Modify: `docs/installation.md`
- Modify: `README.md`

- [ ] **Step 1: Port shell-env writer as opt-in/additive**

  Implement a helper that ensures this line exists in bash/zsh/fish startup
  files without duplicating it:

  ```bash
  export OPENCODE_EXPERIMENTAL_BACKGROUND_SUBAGENTS=true
  ```

  For fish:

  ```fish
  set -gx OPENCODE_EXPERIMENTAL_BACKGROUND_SUBAGENTS true
  ```

- [ ] **Step 2: Add installer prompt/flag**

  Do not force this silently. Add an installer option equivalent to:

  ```text
  --background-subagents=ask|yes|no
  ```

  Default should be `ask` for interactive install and `no` for non-interactive
  install unless blacktower already has a convention for such flags.

- [ ] **Step 3: Preserve existing config behavior**

  Do not remove current `sessionManager`, `todoContinuation`, `subtask`,
  `divoom`, `fallback.chains`, or `grep_app` support.

- [ ] **Step 4: Verify installer behavior**

  Test with temp config homes under `/tmp/opencode`, not real user startup files.
  Verify:

  - fresh install writes one env line when enabled
  - rerun does not duplicate the line
  - disabled path writes nothing
  - existing blacktower config remains valid

---

## Phase G: Config/schema compatibility pass

### Task G1: Add only additive config if needed

**Files:**
- Modify: `src/config/schema.ts`
- Modify: `src/config/loader.ts`
- Modify: `blacktower.schema.json` via generator
- Test: config loader/schema tests

- [ ] **Step 1: Decide whether config is needed**

  If the board has no user-facing settings, skip this phase. If settings are
  needed, add a small optional section:

  ```ts
  backgroundJobs: z
    .object({
      enabled: z.boolean().default(true),
      maxJobsPerParent: z.number().int().positive().default(20),
    })
    .optional()
  ```

- [ ] **Step 2: Merge config additively**

  In `loadPluginConfig`, add `backgroundJobs` to nested merge only. Do not alter
  existing nested merge behavior for `sessionManager`, `fallback`, `council`,
  `multiplexer`, or `interview`.

- [ ] **Step 3: Generate schema**

  ```bash
  bun run generate-schema
  ```

  If there is no script named `generate-schema`, use the repository's schema
  generation command from `package.json`.

- [ ] **Step 4: Verify legacy configs**

  Add or run fixtures for:

  - legacy blacktower config
  - config with `fallback.chains`
  - config with `grep_app`
  - config with new `backgroundJobs`

---

## Deferred work

### ACP bridge

Defer until cancellation/background job reliability has soaked. When revisited,
plan it as a separate feature with protocol fixtures, subprocess timeout tests,
permission-mode tests, and docs for `acpAgents`.

### Companion migration

Reject for this plan. If blacktower wants a native sidecar later, evaluate it
against existing Divoom/control-center/TUI strategy in a separate product plan.

### Removing subtask/todo-continuation

Reject for this plan. Revisit only after native background subagents prove more
reliable in blacktower and migration docs exist.

---

## Final verification checklist

- [ ] `bun run check:ci`
- [ ] `bun run typecheck`
- [ ] `bun test`
- [ ] `bun run build`
- [ ] Manual delegated task launch works.
- [ ] Manual delegated task cancellation works.
- [ ] No orphaned `opencode attach` processes after cancellation.
- [ ] Existing `subtask` tool still works.
- [ ] Todo continuation still works.
- [ ] Multiplexer remains enabled and panes close on session deletion.
- [ ] README/docs updated for any user-facing behavior.
- [ ] If preparing to push, run `/review` before commit per `AGENTS.md`.

## Recommended release checkpoints

1. **Reliability patch:** Task A only.
2. **Internal observability:** Task B only, no public behavior change.
3. **Observable delegation:** Task C, with no prompt regression.
4. **Cancellable delegation:** Task D + E.
5. **Installer support:** Task F, only after cancellation is stable.
6. **Optional config:** Task G, only if runtime settings are genuinely needed.
