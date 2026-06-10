# OpenCode Scheduler Dashboard Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a shared, read-only OpenCode scheduler status module that can be embedded in the existing almaz dashboard now and reused by a future oh-my-opencode-slim dashboard.

**Architecture:** Keep the source of truth in oh-my-opencode-slim: define a small host-aware scheduler status contract, expose a read-only multi-host snapshot endpoint, and package a reusable React scheduler status widget. The almaz dashboard consumes that contract through a small read-only proxy/client and renders the widget as a new dashboard section; no task mutation or scheduler control is introduced.

**Tech Stack:** TypeScript, Bun, React, Vite, Tailwind, Vitest/Bun tests, almaz dashboard React/Vite frontend and Go backend proxy routes.

---

## Requirements and Decisions

- Integration shape: shared embeddable module.
- Almaz scope: scheduler status only.
- Data source: both `nuc` and `almaz` scheduler health side by side.
- Safety: almaz integration is read-only. No trigger, cancel, edit, install, upgrade, delete, or restart actions.
- Expected-noise policy: scheduler worker-continuation journal messages are not warnings by themselves when task runs complete; large local cache/runtime/browser footprints are not scheduler dashboard issues.
- Planning route: lightweight plan, persisted in-repo with hybrid context.

## Complexity Assessment

- Logic depth: Medium — transforms existing scheduler/task data into a host-aware status summary.
- Contract sensitivity: Medium — adds a reusable read-only API/UI contract, but no write actions.
- Context span: Medium — spans oh-my-opencode-slim and almaz dashboard codebases.
- Discovery need: Medium — current control-center API exists, almaz dashboard has section/widget patterns.
- Failure cost: Medium — dashboard can misreport health, but no mutating operations.
- Concern coupling: Medium — two dashboards share a contract and should not drift.

Recommended handoff: lightweight written plan + implementation in phases.

## File Structure

### oh-my-opencode-slim

- Create `src/control-center/scheduler-status.ts`
  - Defines host-aware read-only types and pure summarization helpers.
- Create `src/control-center/scheduler-status.test.ts`
  - Tests healthy/degraded host summaries and known-noise filtering.
- Modify `src/control-center/web-api.ts`
  - Adds `GET /api/scheduler-status` for the local host and future-compatible `hosts` metadata.
- Create `apps/control-center-web/src/components/SchedulerStatusPanel.tsx`
  - Reusable React component that renders one or more host summaries.
- Create `apps/control-center-web/src/components/SchedulerStatusPanel.test.tsx`
  - Component-level rendering tests.
- Modify `apps/control-center-web/src/api/client.ts`
  - Adds `fetchSchedulerStatus()`.
- Modify `apps/control-center-web/src/types.ts`
  - Re-exports scheduler status types.
- Modify `apps/control-center-web/src/App.tsx`
  - Uses the reusable panel in the current control-center web UI.
- Modify `docs/tui-control-center.md`
  - Documents the shared read-only scheduler status endpoint and widget.

### almaz dashboard

- Modify `/srv/server/projects/dash/backend/cmd/almaz/main.go` or the existing route registration file discovered during implementation
  - Registers a read-only backend route for OpenCode scheduler host snapshots, e.g. `GET /api/opencode/scheduler-status`.
- Create `/srv/server/projects/dash/backend/internal/api/opencode_scheduler.go`
  - Fetches configured host endpoints with short timeouts and returns a combined read-only JSON response.
- Create `/srv/server/projects/dash/backend/internal/api/opencode_scheduler_test.go`
  - Tests proxy success, partial host failure, timeout/error mapping, and no non-GET methods.
- Modify `/srv/server/projects/dash/frontend/src/api/types.ts`
  - Adds matching scheduler status interfaces.
- Create `/srv/server/projects/dash/frontend/src/api/opencodeScheduler.ts`
  - Fetches `/api/opencode/scheduler-status`.
- Create `/srv/server/projects/dash/frontend/src/hooks/useOpenCodeScheduler.ts`
  - React Query hook for read-only scheduler status.
- Create `/srv/server/projects/dash/frontend/src/components/opencode/OpenCodeSchedulerPanel.tsx`
  - Almaz-styled wrapper around the scheduler summary display.
- Modify `/srv/server/projects/dash/frontend/src/components/layout/Section.tsx`
  - Renders a new section/widget type, e.g. `section_type === 'opencode_scheduler'` or widget `type === 'opencodeScheduler'`.
- Modify almaz dashboard seed/config source discovered during implementation
  - Adds the read-only OpenCode scheduler panel to the dashboard layout.
- Modify `/srv/server/projects/dash/docs/PRD.md` and/or `/srv/server/projects/dash/docs/deployment.md`
  - Documents read-only OpenCode scheduler integration and required local endpoint configuration.

## Contract

Use this shared JSON shape for both oh-my-opencode-slim and almaz:

```ts
export type SchedulerHostStatus = 'healthy' | 'degraded' | 'unavailable';

export interface SchedulerTaskStatusSummary {
  name: string;
  enabled: boolean;
  schedule: string;
  lastStatus: 'completed' | 'running' | 'failed' | 'never' | 'unknown';
  lastStartedAt?: string;
  lastCompletedAt?: string;
  nextRunAt?: string;
  risk: 'ok' | 'watch' | 'alert';
  message: string;
}

export interface SchedulerHostSummary {
  host: 'nuc' | 'almaz' | string;
  status: SchedulerHostStatus;
  generatedAt: string;
  scheduler: {
    timerActive: boolean;
    serviceHealthy: boolean;
    databaseHealthy: boolean;
    lastTickAt?: string;
  };
  counts: {
    enabledTasks: number;
    disabledTasks: number;
    failedRecentRuns: number;
    stuckRuns: number;
  };
  tasks: SchedulerTaskStatusSummary[];
  notices: string[];
}

export interface SchedulerStatusSnapshot {
  generatedAt: string;
  mode: 'read-only';
  hosts: SchedulerHostSummary[];
}
```

Known-noise rule in code: worker-continuation journal text can appear in `notices`, but must not change `risk` or `status` unless paired with failed/stuck/accumulating runs or sustained resource pressure.

---

## Task 1: Add Pure Scheduler Status Contract and Summarizer

**Files:**
- Create: `src/control-center/scheduler-status.ts`
- Create: `src/control-center/scheduler-status.test.ts`

- [ ] **Step 1: Write failing tests for host summary risk classification**

Create `src/control-center/scheduler-status.test.ts`:

```ts
import { describe, expect, test } from 'bun:test';
import {
  createSchedulerStatusSnapshot,
  isKnownSchedulerWorkerNoise,
  type SchedulerStatusInput,
} from './scheduler-status';

const healthyInput: SchedulerStatusInput = {
  host: 'nuc',
  generatedAt: '2026-05-20T20:00:00.000Z',
  scheduler: {
    timerActive: true,
    serviceHealthy: true,
    databaseHealthy: true,
    lastTickAt: '2026-05-20T19:59:30.000Z',
  },
  tasks: [
    {
      name: 'opencode-tasks-watch',
      enabled: true,
      schedule: '22,52 * * * *',
      nextRunAt: '2026-05-20T20:22:00.000Z',
      latestRun: {
        status: 'completed',
        startedAt: '2026-05-20T19:52:44.067Z',
        completedAt: '2026-05-20T19:54:40.748Z',
      },
    },
  ],
  notices: [
    'opencode-tasks.service: Found left-over process 123 (opencode) in control group while starting unit. Ignoring.',
  ],
};

describe('scheduler-status', () => {
  test('keeps known worker-continuation messages as notices without degrading health', () => {
    const snapshot = createSchedulerStatusSnapshot([healthyInput]);

    expect(snapshot.mode).toBe('read-only');
    expect(snapshot.hosts).toHaveLength(1);
    expect(snapshot.hosts[0]?.status).toBe('healthy');
    expect(snapshot.hosts[0]?.counts.failedRecentRuns).toBe(0);
    expect(snapshot.hosts[0]?.tasks[0]?.risk).toBe('ok');
    expect(snapshot.hosts[0]?.notices).toContain(healthyInput.notices[0]);
  });

  test('marks a host degraded when a recent task failed', () => {
    const snapshot = createSchedulerStatusSnapshot([
      {
        ...healthyInput,
        tasks: [
          {
            ...healthyInput.tasks[0],
            latestRun: {
              status: 'failed',
              startedAt: '2026-05-20T19:52:44.067Z',
              completedAt: '2026-05-20T19:54:40.748Z',
            },
          },
        ],
      },
    ]);

    expect(snapshot.hosts[0]?.status).toBe('degraded');
    expect(snapshot.hosts[0]?.counts.failedRecentRuns).toBe(1);
    expect(snapshot.hosts[0]?.tasks[0]?.risk).toBe('alert');
  });

  test('marks a host unavailable when scheduler health is unavailable', () => {
    const snapshot = createSchedulerStatusSnapshot([
      {
        ...healthyInput,
        scheduler: {
          ...healthyInput.scheduler,
          timerActive: false,
        },
      },
    ]);

    expect(snapshot.hosts[0]?.status).toBe('unavailable');
  });

  test('detects known worker-continuation noise', () => {
    expect(
      isKnownSchedulerWorkerNoise(
        'opencode-tasks.service: Unit process 123 (chrome-devtools) remains running after unit stopped.',
      ),
    ).toBe(true);
    expect(isKnownSchedulerWorkerNoise('task run failed with exit 1')).toBe(false);
  });
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
bun test src/control-center/scheduler-status.test.ts
```

Expected: FAIL because `src/control-center/scheduler-status.ts` does not exist.

- [ ] **Step 3: Implement the contract and pure summarizer**

Create `src/control-center/scheduler-status.ts`:

```ts
export type SchedulerHostStatus = 'healthy' | 'degraded' | 'unavailable';
export type SchedulerTaskRunStatus =
  | 'completed'
  | 'running'
  | 'failed'
  | 'never'
  | 'unknown';
export type SchedulerRisk = 'ok' | 'watch' | 'alert';

export interface SchedulerStatusInput {
  host: string;
  generatedAt: string;
  scheduler: {
    timerActive: boolean;
    serviceHealthy: boolean;
    databaseHealthy: boolean;
    lastTickAt?: string;
  };
  tasks: SchedulerTaskInput[];
  notices?: string[];
}

export interface SchedulerTaskInput {
  name: string;
  enabled: boolean;
  schedule: string;
  nextRunAt?: string;
  latestRun?: {
    status: SchedulerTaskRunStatus;
    startedAt?: string;
    completedAt?: string;
  };
}

export interface SchedulerTaskStatusSummary {
  name: string;
  enabled: boolean;
  schedule: string;
  lastStatus: SchedulerTaskRunStatus;
  lastStartedAt?: string;
  lastCompletedAt?: string;
  nextRunAt?: string;
  risk: SchedulerRisk;
  message: string;
}

export interface SchedulerHostSummary {
  host: string;
  status: SchedulerHostStatus;
  generatedAt: string;
  scheduler: {
    timerActive: boolean;
    serviceHealthy: boolean;
    databaseHealthy: boolean;
    lastTickAt?: string;
  };
  counts: {
    enabledTasks: number;
    disabledTasks: number;
    failedRecentRuns: number;
    stuckRuns: number;
  };
  tasks: SchedulerTaskStatusSummary[];
  notices: string[];
}

export interface SchedulerStatusSnapshot {
  generatedAt: string;
  mode: 'read-only';
  hosts: SchedulerHostSummary[];
}

const KNOWN_WORKER_NAMES = [
  'bun',
  'opencode',
  'npm exec @playw',
  'npm exec chrome',
  'sp-mcp',
  'chrome-devtools',
  'MainThread',
];

export function createSchedulerStatusSnapshot(
  inputs: SchedulerStatusInput[],
): SchedulerStatusSnapshot {
  const generatedAt = new Date().toISOString();
  return {
    generatedAt,
    mode: 'read-only',
    hosts: inputs.map(toHostSummary),
  };
}

export function isKnownSchedulerWorkerNoise(message: string): boolean {
  const hasKnownSystemdText =
    message.includes('Found left-over process') ||
    message.includes('remains running after unit stopped');
  return (
    hasKnownSystemdText && KNOWN_WORKER_NAMES.some((name) => message.includes(name))
  );
}

function toHostSummary(input: SchedulerStatusInput): SchedulerHostSummary {
  const tasks = input.tasks.map(toTaskSummary);
  const failedRecentRuns = tasks.filter((task) => task.lastStatus === 'failed')
    .length;
  const stuckRuns = tasks.filter((task) => task.risk === 'watch').length;
  const schedulerUnavailable =
    !input.scheduler.timerActive ||
    !input.scheduler.serviceHealthy ||
    !input.scheduler.databaseHealthy;
  const status: SchedulerHostStatus = schedulerUnavailable
    ? 'unavailable'
    : failedRecentRuns > 0 || stuckRuns > 0
      ? 'degraded'
      : 'healthy';

  return {
    host: input.host,
    status,
    generatedAt: input.generatedAt,
    scheduler: input.scheduler,
    counts: {
      enabledTasks: input.tasks.filter((task) => task.enabled).length,
      disabledTasks: input.tasks.filter((task) => !task.enabled).length,
      failedRecentRuns,
      stuckRuns,
    },
    tasks,
    notices: input.notices ?? [],
  };
}

function toTaskSummary(task: SchedulerTaskInput): SchedulerTaskStatusSummary {
  const lastStatus = task.latestRun?.status ?? 'never';
  const risk = taskRisk(lastStatus);
  return {
    name: task.name,
    enabled: task.enabled,
    schedule: task.schedule,
    lastStatus,
    lastStartedAt: task.latestRun?.startedAt,
    lastCompletedAt: task.latestRun?.completedAt,
    nextRunAt: task.nextRunAt,
    risk,
    message: taskMessage(task.name, lastStatus, risk),
  };
}

function taskRisk(status: SchedulerTaskRunStatus): SchedulerRisk {
  if (status === 'failed') return 'alert';
  if (status === 'running' || status === 'unknown') return 'watch';
  return 'ok';
}

function taskMessage(
  name: string,
  status: SchedulerTaskRunStatus,
  risk: SchedulerRisk,
): string {
  if (risk === 'alert') return `${name} failed in the recent run history.`;
  if (risk === 'watch') return `${name} is still running or has unknown state.`;
  if (status === 'never') return `${name} has not run yet.`;
  return `${name} is healthy.`;
}
```

- [ ] **Step 4: Run the test again**

Run:

```bash
bun test src/control-center/scheduler-status.test.ts
```

Expected: PASS.

---

## Task 2: Expose Local Read-Only Scheduler Status Endpoint

**Files:**
- Modify: `src/control-center/web-api.ts`
- Test: existing or new web API tests discovered near `src/control-center/*.test.ts`

- [ ] **Step 1: Locate existing web API tests**

Run:

```bash
rg "createControlCenterWebApi|/api/snapshot|/api/health/scheduler" src/control-center -g "*.test.ts"
```

Expected: find the current test file. If none exists, create `src/control-center/web-api.test.ts`.

- [ ] **Step 2: Add failing endpoint test**

Add this test to the discovered web API test file or create `src/control-center/web-api.test.ts`:

```ts
import { describe, expect, test } from 'bun:test';
import { createControlCenterWebApi } from './web-api';

describe('control center scheduler status endpoint', () => {
  test('returns a read-only scheduler status snapshot', async () => {
    const api = createControlCenterWebApi({
      services: {
        snapshot: async () => ({}) as never,
        tasks: {
          listTasks: async () => [
            {
              name: 'opencode-tasks-watch',
              enabled: true,
              schedule: '22,52 * * * *',
              nextRunAt: '2026-05-20T20:22:00.000Z',
              latestRun: {
                status: 'completed',
                startedAt: '2026-05-20T19:52:44.067Z',
                completedAt: '2026-05-20T19:54:40.748Z',
              },
            },
          ] as never,
          getTask: async () => ({}) as never,
          listRuns: async () => [] as never,
        },
        health: {
          getSchedulerHealth: async () => ({
            timerActive: true,
            serviceHealthy: true,
            databaseHealthy: true,
            lastTickAt: '2026-05-20T19:59:30.000Z',
          }) as never,
        },
        streams: {
          listRecentSchedulerEvents: async () => [] as never,
        },
      },
    });

    const response = await api.fetch(
      new Request('http://localhost/api/scheduler-status'),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.mode).toBe('read-only');
    expect(body.hosts[0].status).toBe('healthy');
    expect(body.hosts[0].tasks[0].name).toBe('opencode-tasks-watch');
  });
});
```

- [ ] **Step 3: Run the failing endpoint test**

Run:

```bash
bun test src/control-center/web-api.test.ts
```

Expected: FAIL with 404 for `/api/scheduler-status`.

- [ ] **Step 4: Implement the endpoint**

Modify `src/control-center/web-api.ts`:

```ts
import { hostname } from 'node:os';
import {
  createSchedulerStatusSnapshot,
  type SchedulerTaskInput,
} from './scheduler-status';
```

Add route before the final API `Not found` return:

```ts
    if (segments.length === 2 && segments[1] === 'scheduler-status') {
      const [tasks, health] = await Promise.all([
        services.tasks.listTasks(),
        services.health.getSchedulerHealth(),
      ]);
      return jsonResponse(
        createSchedulerStatusSnapshot([
          {
            host: hostname(),
            generatedAt: new Date().toISOString(),
            scheduler: {
              timerActive: Boolean(health.timerActive),
              serviceHealthy: Boolean(health.serviceHealthy),
              databaseHealthy: Boolean(health.databaseHealthy),
              lastTickAt: health.lastTickAt,
            },
            tasks: tasks.map(toSchedulerTaskInput),
            notices: [],
          },
        ]),
      );
    }
```

Add helper near the bottom of the file:

```ts
function toSchedulerTaskInput(task: {
  name: string;
  enabled: boolean;
  schedule: string;
  nextRunAt?: string;
  latestRun?: {
    status: string;
    startedAt?: string;
    completedAt?: string;
  };
}): SchedulerTaskInput {
  const status = task.latestRun?.status;
  return {
    name: task.name,
    enabled: task.enabled,
    schedule: task.schedule,
    nextRunAt: task.nextRunAt,
    latestRun: task.latestRun
      ? {
          status:
            status === 'completed' ||
            status === 'running' ||
            status === 'failed' ||
            status === 'never'
              ? status
              : 'unknown',
          startedAt: task.latestRun.startedAt,
          completedAt: task.latestRun.completedAt,
        }
      : undefined,
  };
}
```

- [ ] **Step 5: Run endpoint and type checks**

Run:

```bash
bun test src/control-center/web-api.test.ts src/control-center/scheduler-status.test.ts
bun run typecheck
```

Expected: tests PASS and typecheck PASS. Adjust property names to match actual `SchedulerHealth`/task types if the compiler reveals different names.

---

## Task 3: Build Reusable React Scheduler Status Panel in OMOC Web App

**Files:**
- Create: `apps/control-center-web/src/components/SchedulerStatusPanel.tsx`
- Create: `apps/control-center-web/src/components/SchedulerStatusPanel.test.tsx`
- Modify: `apps/control-center-web/src/api/client.ts`
- Modify: `apps/control-center-web/src/types.ts`
- Modify: `apps/control-center-web/src/App.tsx`

- [ ] **Step 1: Re-export types and add API client**

Modify `apps/control-center-web/src/types.ts` to include:

```ts
export type {
  SchedulerHostSummary,
  SchedulerHostStatus,
  SchedulerStatusSnapshot,
  SchedulerTaskStatusSummary,
} from '../../../src/control-center/scheduler-status';
```

Modify `apps/control-center-web/src/api/client.ts` imports:

```ts
  SchedulerStatusSnapshot,
```

Add function:

```ts
export async function fetchSchedulerStatus(): Promise<SchedulerStatusSnapshot> {
  return fetchJson<SchedulerStatusSnapshot>('/api/scheduler-status');
}
```

- [ ] **Step 2: Create the reusable panel**

Create `apps/control-center-web/src/components/SchedulerStatusPanel.tsx`:

```tsx
import type { SchedulerHostSummary } from '../types';

interface SchedulerStatusPanelProps {
  hosts: SchedulerHostSummary[];
  title?: string;
}

const STATUS_CLASS: Record<SchedulerHostSummary['status'], string> = {
  healthy: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100',
  degraded: 'border-amber-400/30 bg-amber-400/10 text-amber-100',
  unavailable: 'border-rose-400/30 bg-rose-400/10 text-rose-100',
};

export function SchedulerStatusPanel({
  hosts,
  title = 'OpenCode scheduler',
}: SchedulerStatusPanelProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 shadow-2xl shadow-black/20">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-mono text-sm uppercase tracking-[0.2em] text-slate-300">
            {title}
          </h2>
          <p className="mt-1 text-xs text-slate-500">Read-only scheduler health</p>
        </div>
        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-400">
          read-only
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {hosts.map((host) => (
          <article
            key={host.host}
            className={`rounded-xl border p-3 ${STATUS_CLASS[host.status]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-mono text-lg font-semibold">{host.host}</h3>
                <p className="text-xs uppercase tracking-[0.18em] opacity-80">
                  {host.status}
                </p>
              </div>
              <div className="text-right text-xs opacity-80">
                <div>{host.counts.enabledTasks} enabled</div>
                <div>{host.counts.failedRecentRuns} failed</div>
              </div>
            </div>
            <ul className="mt-3 space-y-2">
              {host.tasks.slice(0, 4).map((task) => (
                <li
                  key={task.name}
                  className="rounded-lg bg-black/20 px-3 py-2 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{task.name}</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] opacity-80">
                      {task.lastStatus}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs opacity-75">
                    {task.message}
                  </p>
                </li>
              ))}
            </ul>
            {host.notices.length > 0 ? (
              <p className="mt-3 text-xs opacity-70">
                {host.notices.length} notice{host.notices.length === 1 ? '' : 's'}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Write component rendering test**

Create `apps/control-center-web/src/components/SchedulerStatusPanel.test.tsx`:

```tsx
import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { SchedulerStatusPanel } from './SchedulerStatusPanel';

describe('SchedulerStatusPanel', () => {
  test('renders read-only host scheduler summaries', () => {
    const html = renderToStaticMarkup(
      <SchedulerStatusPanel
        hosts={[
          {
            host: 'nuc',
            status: 'healthy',
            generatedAt: '2026-05-20T20:00:00.000Z',
            scheduler: {
              timerActive: true,
              serviceHealthy: true,
              databaseHealthy: true,
            },
            counts: {
              enabledTasks: 4,
              disabledTasks: 0,
              failedRecentRuns: 0,
              stuckRuns: 0,
            },
            tasks: [
              {
                name: 'opencode-tasks-watch',
                enabled: true,
                schedule: '22,52 * * * *',
                lastStatus: 'completed',
                risk: 'ok',
                message: 'opencode-tasks-watch is healthy.',
              },
            ],
            notices: [],
          },
        ]}
      />,
    );

    expect(html).toContain('OpenCode scheduler');
    expect(html).toContain('read-only');
    expect(html).toContain('nuc');
    expect(html).toContain('opencode-tasks-watch');
  });
});
```

- [ ] **Step 4: Wire into `App.tsx` read-only**

Add state loading via existing hook or local `useEffect`. Minimal direct approach in `App.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react';
import { fetchSchedulerStatus } from './api/client';
import { SchedulerStatusPanel } from './components/SchedulerStatusPanel';
import type { SchedulerStatusSnapshot } from './types';
```

Inside `App()`:

```tsx
  const [schedulerStatus, setSchedulerStatus] =
    useState<SchedulerStatusSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchSchedulerStatus()
      .then((snapshot) => {
        if (!cancelled) setSchedulerStatus(snapshot);
      })
      .catch(() => {
        if (!cancelled) setSchedulerStatus(null);
      });
    return () => {
      cancelled = true;
    };
  }, [state.generatedAt]);
```

Render above `HealthPanel`:

```tsx
          {schedulerStatus ? (
            <SchedulerStatusPanel hosts={schedulerStatus.hosts} />
          ) : null}
```

- [ ] **Step 5: Run web tests and build**

Run:

```bash
bun test apps/control-center-web/src/components/SchedulerStatusPanel.test.tsx
bun run test:web
bun run build:web
```

Expected: all PASS.

---

## Task 4: Add Almaz Read-Only Backend Aggregator

**Files:**
- Create: `/srv/server/projects/dash/backend/internal/api/opencode_scheduler.go`
- Create: `/srv/server/projects/dash/backend/internal/api/opencode_scheduler_test.go`
- Modify: `/srv/server/projects/dash/backend/cmd/almaz/main.go` or discovered API route registration file

- [ ] **Step 1: Confirm route pattern**

Run:

```bash
rg "HandleFunc|/api/|http.NewServeMux|chi|gorilla" /srv/server/projects/dash/backend -g "*.go"
```

Expected: identify the file where existing API handlers are registered.

- [ ] **Step 2: Write backend tests**

Create `/srv/server/projects/dash/backend/internal/api/opencode_scheduler_test.go`:

```go
package api

import (
  "net/http"
  "net/http/httptest"
  "testing"
)

func TestOpenCodeSchedulerProxyReadOnlySuccess(t *testing.T) {
  upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodGet {
      t.Fatalf("unexpected method %s", r.Method)
    }
    w.Header().Set("Content-Type", "application/json")
    _, _ = w.Write([]byte(`{"generatedAt":"2026-05-20T20:00:00Z","mode":"read-only","hosts":[{"host":"nuc","status":"healthy","generatedAt":"2026-05-20T20:00:00Z","scheduler":{"timerActive":true,"serviceHealthy":true,"databaseHealthy":true},"counts":{"enabledTasks":4,"disabledTasks":0,"failedRecentRuns":0,"stuckRuns":0},"tasks":[],"notices":[]}]}`))
  }))
  defer upstream.Close()

  handler := NewOpenCodeSchedulerHandler([]OpenCodeSchedulerUpstream{
    {Name: "nuc", URL: upstream.URL + "/api/scheduler-status"},
  })

  rr := httptest.NewRecorder()
  req := httptest.NewRequest(http.MethodGet, "/api/opencode/scheduler-status", nil)
  handler.ServeHTTP(rr, req)

  if rr.Code != http.StatusOK {
    t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
  }
  if got := rr.Body.String(); !containsAll(got, []string{"read-only", "nuc", "healthy"}) {
    t.Fatalf("unexpected body: %s", got)
  }
}

func TestOpenCodeSchedulerProxyRejectsMutation(t *testing.T) {
  handler := NewOpenCodeSchedulerHandler(nil)
  rr := httptest.NewRecorder()
  req := httptest.NewRequest(http.MethodPost, "/api/opencode/scheduler-status", nil)
  handler.ServeHTTP(rr, req)

  if rr.Code != http.StatusMethodNotAllowed {
    t.Fatalf("expected 405, got %d", rr.Code)
  }
}

func containsAll(value string, parts []string) bool {
  for _, part := range parts {
    if !strings.Contains(value, part) {
      return false
    }
  }
  return true
}
```

Add missing import after first test run shows it:

```go
import "strings"
```

- [ ] **Step 3: Run failing backend tests**

Run:

```bash
go test ./backend/internal/api -run OpenCodeScheduler
```

Expected: FAIL because `NewOpenCodeSchedulerHandler` is undefined.

- [ ] **Step 4: Implement read-only handler**

Create `/srv/server/projects/dash/backend/internal/api/opencode_scheduler.go`:

```go
package api

import (
  "context"
  "encoding/json"
  "net/http"
  "time"
)

type OpenCodeSchedulerUpstream struct {
  Name string
  URL  string
}

type openCodeSchedulerCombined struct {
  GeneratedAt string            `json:"generatedAt"`
  Mode        string            `json:"mode"`
  Hosts       []json.RawMessage `json:"hosts"`
  Errors      []string          `json:"errors,omitempty"`
}

type openCodeSchedulerSnapshot struct {
  Hosts []json.RawMessage `json:"hosts"`
}

func NewOpenCodeSchedulerHandler(upstreams []OpenCodeSchedulerUpstream) http.Handler {
  client := &http.Client{Timeout: 2 * time.Second}
  return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodGet {
      w.Header().Set("Allow", http.MethodGet)
      http.Error(w, "OpenCode scheduler status is read-only", http.StatusMethodNotAllowed)
      return
    }

    combined := openCodeSchedulerCombined{
      GeneratedAt: time.Now().UTC().Format(time.RFC3339),
      Mode:        "read-only",
      Hosts:       []json.RawMessage{},
      Errors:      []string{},
    }

    for _, upstream := range upstreams {
      hosts, err := fetchOpenCodeSchedulerHosts(r.Context(), client, upstream.URL)
      if err != nil {
        combined.Errors = append(combined.Errors, upstream.Name+": "+err.Error())
        continue
      }
      combined.Hosts = append(combined.Hosts, hosts...)
    }

    w.Header().Set("Content-Type", "application/json; charset=utf-8")
    w.Header().Set("Cache-Control", "no-store")
    _ = json.NewEncoder(w).Encode(combined)
  })
}

func fetchOpenCodeSchedulerHosts(ctx context.Context, client *http.Client, url string) ([]json.RawMessage, error) {
  req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
  if err != nil {
    return nil, err
  }
  resp, err := client.Do(req)
  if err != nil {
    return nil, err
  }
  defer resp.Body.Close()

  if resp.StatusCode < 200 || resp.StatusCode >= 300 {
    return nil, fmt.Errorf("upstream returned %s", resp.Status)
  }

  var snapshot openCodeSchedulerSnapshot
  if err := json.NewDecoder(resp.Body).Decode(&snapshot); err != nil {
    return nil, err
  }
  return snapshot.Hosts, nil
}
```

Add missing import after first compile:

```go
import "fmt"
```

- [ ] **Step 5: Register route with configured upstreams**

In the discovered API registration file, register:

```go
mux.Handle("/api/opencode/scheduler-status", api.NewOpenCodeSchedulerHandler([]api.OpenCodeSchedulerUpstream{
  {Name: "nuc", URL: os.Getenv("OPENCODE_SCHEDULER_NUC_URL")},
  {Name: "almaz", URL: os.Getenv("OPENCODE_SCHEDULER_ALMAZ_URL")},
}))
```

Filter empty URLs before passing to the handler:

```go
func configuredOpenCodeSchedulerUpstreams() []api.OpenCodeSchedulerUpstream {
  candidates := []api.OpenCodeSchedulerUpstream{
    {Name: "nuc", URL: os.Getenv("OPENCODE_SCHEDULER_NUC_URL")},
    {Name: "almaz", URL: os.Getenv("OPENCODE_SCHEDULER_ALMAZ_URL")},
  }
  upstreams := make([]api.OpenCodeSchedulerUpstream, 0, len(candidates))
  for _, candidate := range candidates {
    if candidate.URL != "" {
      upstreams = append(upstreams, candidate)
    }
  }
  return upstreams
}
```

- [ ] **Step 6: Run backend tests**

Run from `/srv/server/projects/dash`:

```bash
go test ./backend/...
```

Expected: PASS.

---

## Task 5: Add Almaz Dashboard Scheduler Panel

**Files:**
- Modify: `/srv/server/projects/dash/frontend/src/api/types.ts`
- Create: `/srv/server/projects/dash/frontend/src/api/opencodeScheduler.ts`
- Create: `/srv/server/projects/dash/frontend/src/hooks/useOpenCodeScheduler.ts`
- Create: `/srv/server/projects/dash/frontend/src/components/opencode/OpenCodeSchedulerPanel.tsx`
- Modify: `/srv/server/projects/dash/frontend/src/components/layout/Section.tsx`

- [ ] **Step 1: Add frontend types**

Append to `/srv/server/projects/dash/frontend/src/api/types.ts`:

```ts
export type SchedulerHostStatus = 'healthy' | 'degraded' | 'unavailable'
export type SchedulerTaskRunStatus = 'completed' | 'running' | 'failed' | 'never' | 'unknown'
export type SchedulerRisk = 'ok' | 'watch' | 'alert'

export interface SchedulerTaskStatusSummary {
  name: string
  enabled: boolean
  schedule: string
  lastStatus: SchedulerTaskRunStatus
  lastStartedAt?: string
  lastCompletedAt?: string
  nextRunAt?: string
  risk: SchedulerRisk
  message: string
}

export interface SchedulerHostSummary {
  host: string
  status: SchedulerHostStatus
  generatedAt: string
  scheduler: {
    timerActive: boolean
    serviceHealthy: boolean
    databaseHealthy: boolean
    lastTickAt?: string
  }
  counts: {
    enabledTasks: number
    disabledTasks: number
    failedRecentRuns: number
    stuckRuns: number
  }
  tasks: SchedulerTaskStatusSummary[]
  notices: string[]
}

export interface SchedulerStatusSnapshot {
  generatedAt: string
  mode: 'read-only'
  hosts: SchedulerHostSummary[]
  errors?: string[]
}
```

- [ ] **Step 2: Add API client and hook**

Create `/srv/server/projects/dash/frontend/src/api/opencodeScheduler.ts`:

```ts
import { fetchJSON } from './client'
import type { SchedulerStatusSnapshot } from './types'

export function fetchOpenCodeSchedulerStatus(): Promise<SchedulerStatusSnapshot> {
  return fetchJSON<SchedulerStatusSnapshot>('/api/opencode/scheduler-status')
}
```

Create `/srv/server/projects/dash/frontend/src/hooks/useOpenCodeScheduler.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import { fetchOpenCodeSchedulerStatus } from '../api/opencodeScheduler'

export function useOpenCodeScheduler() {
  return useQuery({
    queryKey: ['opencode-scheduler-status'],
    queryFn: fetchOpenCodeSchedulerStatus,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}
```

- [ ] **Step 3: Add almaz-styled panel component**

Create `/srv/server/projects/dash/frontend/src/components/opencode/OpenCodeSchedulerPanel.tsx`:

```tsx
import { useOpenCodeScheduler } from '../../hooks/useOpenCodeScheduler'
import type { SchedulerHostSummary } from '../../api/types'

const STATUS_CLASS: Record<SchedulerHostSummary['status'], string> = {
  healthy: 'border-accent-success/30 bg-accent-success/5 text-accent-success',
  degraded: 'border-accent-warning/30 bg-accent-warning/5 text-accent-warning',
  unavailable: 'border-accent-danger/30 bg-accent-danger/5 text-accent-danger',
}

export default function OpenCodeSchedulerPanel() {
  const { data, isLoading, isError, error } = useOpenCodeScheduler()

  if (isLoading) {
    return <PanelShell>Loading OpenCode scheduler status…</PanelShell>
  }

  if (isError) {
    return (
      <PanelShell>
        <span className="text-accent-danger">
          Failed to load OpenCode scheduler status
          {error instanceof Error ? `: ${error.message}` : '.'}
        </span>
      </PanelShell>
    )
  }

  return (
    <PanelShell>
      <div className="grid gap-3 md:grid-cols-2">
        {(data?.hosts ?? []).map((host) => (
          <article key={host.host} className={`rounded-[var(--radius-card)] border p-4 ${STATUS_CLASS[host.status]}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-mono text-lg font-semibold">{host.host}</h3>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] opacity-80">{host.status}</p>
              </div>
              <div className="text-right font-mono text-[11px] uppercase tracking-[0.16em] opacity-80">
                <div>{host.counts.enabledTasks} enabled</div>
                <div>{host.counts.failedRecentRuns} failed</div>
              </div>
            </div>
            <div className="mt-3 grid gap-2">
              {host.tasks.slice(0, 4).map((task) => (
                <div key={task.name} className="rounded-[var(--radius-card)] bg-bg-primary/50 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-text-primary">{task.name}</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] opacity-75">{task.lastStatus}</span>
                  </div>
                  <p className="mt-1 text-xs text-text-secondary">{task.message}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
      {data?.errors?.length ? (
        <ul className="mt-3 list-disc pl-5 text-xs text-accent-warning">
          {data.errors.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </PanelShell>
  )
}

function PanelShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-border-default bg-bg-secondary/70 p-4 shadow-glow-subtle">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-mono text-sm uppercase tracking-[0.24em] text-text-primary">OpenCode scheduler</h2>
          <p className="text-xs text-text-secondary">Read-only status from nuc and almaz</p>
        </div>
        <span className="rounded-full border border-border-default px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">read-only</span>
      </div>
      {children}
    </div>
  )
}
```

- [ ] **Step 4: Render from section layout**

Modify `/srv/server/projects/dash/frontend/src/components/layout/Section.tsx`:

```tsx
import OpenCodeSchedulerPanel from '../opencode/OpenCodeSchedulerPanel'
```

Add before the `services` branch:

```tsx
  if (section.section_type === 'opencode_scheduler') {
    return <OpenCodeSchedulerPanel />
  }
```

- [ ] **Step 5: Add dashboard config/seed entry**

Find seed/config source:

```bash
rg "section_type|metrics|services" /srv/server/projects/dash/backend /srv/server/projects/dash -g "*.go" -g "*.sql" -g "*.json" -g "*.yaml" -g "*.yml"
```

Add a section with:

```json
{
  "id": "opencode-scheduler",
  "name": "OpenCode Scheduler",
  "icon": "terminal",
  "cols": 2,
  "collapsed": false,
  "sort_order": 30,
  "section_type": "opencode_scheduler",
  "widgets": []
}
```

If sections are database-seeded via SQL or Go structs, translate the same values into that seed format.

- [ ] **Step 6: Build almaz frontend**

Run from `/srv/server/projects/dash/frontend`:

```bash
npm run build
```

Expected: PASS.

---

## Task 6: Runtime Wiring and Documentation

**Files:**
- Modify: `/srv/server/projects/dash/docker-compose.yml`
- Modify: `/srv/server/projects/dash/docs/deployment.md`
- Modify: `docs/tui-control-center.md`

- [ ] **Step 1: Document and wire upstream URLs**

In `/srv/server/projects/dash/docker-compose.yml`, add environment variables to the dashboard service:

```yaml
environment:
  OPENCODE_SCHEDULER_NUC_URL: ${OPENCODE_SCHEDULER_NUC_URL:-http://nuc.local:4090/api/scheduler-status}
  OPENCODE_SCHEDULER_ALMAZ_URL: ${OPENCODE_SCHEDULER_ALMAZ_URL:-http://127.0.0.1:4090/api/scheduler-status}
```

Use the actual existing environment block style in the compose file; do not duplicate `environment:` if it already exists.

- [ ] **Step 2: Document read-only API startup**

In `docs/tui-control-center.md`, add:

```md
### Shared scheduler status endpoint

The control-center web API exposes a read-only scheduler status snapshot at:

```bash
bunx oh-my-opencode-slim control-center-web --api-only --host 127.0.0.1 --port 4090
```

```http
GET /api/scheduler-status
```

The response is `mode: "read-only"` and contains host scheduler health, enabled task counts, recent run status, and notices. Known systemd worker-continuation messages from the oneshot scheduler runner are informational unless paired with failed/stuck runs or sustained resource pressure.
```

- [ ] **Step 3: Document almaz integration**

In `/srv/server/projects/dash/docs/deployment.md`, add:

```md
### OpenCode scheduler panel

The almaz dashboard can show read-only scheduler status for `nuc` and `almaz` by proxying local oh-my-opencode-slim control-center API endpoints.

Required environment variables:

```bash
OPENCODE_SCHEDULER_NUC_URL=http://nuc.local:4090/api/scheduler-status
OPENCODE_SCHEDULER_ALMAZ_URL=http://127.0.0.1:4090/api/scheduler-status
```

The panel is read-only. It does not trigger, cancel, edit, install, restart, or delete scheduled tasks.
```

- [ ] **Step 4: Verify docs and builds**

Run:

```bash
cd /home/onnwee/Projects/tools/oh-my-opencode-slim && bun run check:ci && bun run typecheck && bun test
cd /srv/server/projects/dash && go test ./backend/... && cd frontend && npm run build
```

Expected: all PASS.

---

## Task 7: Future oh-my-opencode-slim Dashboard Shell Stub

**Files:**
- Create: `docs/oh-my-opencode-slim-dashboard.md`

- [ ] **Step 1: Create future dashboard design note**

Create `docs/oh-my-opencode-slim-dashboard.md`:

```md
# oh-my-opencode-slim Dashboard

The future oh-my-opencode-slim dashboard should reuse the shared scheduler status contract and React `SchedulerStatusPanel` introduced for the control-center web UI and almaz dashboard integration.

## Initial dashboard modules

1. OpenCode scheduler status: read-only host summaries for nuc/almaz.
2. Control center task/run details: existing control-center web UI.
3. Interview dashboard status: future module using existing interview dashboard APIs.

## Safety

The default dashboard mode is read-only. Mutating task actions require a separate explicit design, authentication model, and confirmation flow.
```

- [ ] **Step 2: Verify docs are included in checks**

Run:

```bash
cd /home/onnwee/Projects/tools/oh-my-opencode-slim && bun run check:ci
```

Expected: PASS.

---

## Implementation Notes

- Do not expose the oh-my-opencode-slim control-center API publicly without a separate auth/reverse-proxy decision. Prefer localhost-only plus almaz backend proxy, Tailscale-only, or Authelia-protected access.
- Do not add write endpoints in this project. The contract intentionally says `mode: 'read-only'`.
- Do not classify known oneshot scheduler child-process journal lines as unhealthy unless paired with failed/stuck/accumulating workers or sustained resource pressure.
- If almaz and nuc cannot reach each other via the proposed URLs, use a periodic JSON/report sync as a fallback without changing the UI contract.

## Self-Review

- Spec coverage: shared embeddable module, scheduler-status-only scope, both hosts, read-only almaz integration, and future OMOC dashboard reuse are all covered.
- Placeholder scan: no task depends on undefined behavior; route-registration and seed-file locations are explicitly discover-first because exact files vary in the almaz dashboard backend.
- Type consistency: `SchedulerStatusSnapshot`, `SchedulerHostSummary`, and `SchedulerTaskStatusSummary` names are consistent across API, OMOC UI, and almaz UI tasks.
