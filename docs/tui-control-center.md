# TUI Control Center

Status: implemented as a read-only scheduled-task control center with an
OpenTUI terminal dashboard, text/JSON snapshot modes, and reusable backend
services. The mutating task-creation/editing and future web renderer paths are
prepared at the domain/service boundary but are not exposed from the monitor UI.

Run it from a cloned checkout:

```bash
bun run control-center
```

Or use the installed CLI:

```bash
bunx oh-my-opencode-slim control-center
```

Useful non-interactive modes:

```bash
bun run control-center -- --no-tui
bun run control-center -- --json
bun run control-center -- --config-dir=/path/to/opencode --no-tui
```

The dashboard is intentionally read-only. It reads scheduled-task definitions,
recent run history, scheduler status, scheduler logs, and task reports, then
shows what is running, what failed, and where the output lives.

## Goal

Build a first-class `oh-my-opencode-slim` control center that starts as an
OpenTUI-based terminal UI and can later support a web React UI without sharing
renderer components.

The TUI and future web UI should share the same backend/domain layer, not the
same visual components.

## Decision

Use **OpenTUI + TypeScript** for the terminal UI.

This is preferred over Bubble Tea or Ratatui because the feature is expected to
become part of the main `oh-my-opencode-slim` app rather than a narrow external
ops monitor. The project is already TypeScript/Bun-based, already exposes a TUI
entrypoint, and future web UI work can reuse backend services, schemas, state
derivation, and action workflows.

## Non-goals

- Do not try to share visual components between terminal and web.
- Do not make OpenTUI components own business logic.
- Do not couple task monitoring directly to the scheduler implementation.
- Do not require a web server for the local TUI MVP.
- Do not delete, disable, or mutate scheduled tasks from monitor views without
  explicit future action/confirmation flows.

## Architecture

```text
packages / src modules
  domain        Pure types, validation, status derivation, schedule logic
  services      Backend use cases: tasks, runs, streams, sessions, actions
  adapters      Filesystem, SQLite, journalctl/systemd, opencode CLI/SDK
  tui           OpenTUI renderer and terminal-specific interactions
  web           Future React web renderer and transport client
```

In this repository, the first implementation can live under `src/tui/` or a
nearby feature folder while preserving these boundaries:

```text
src/
  control-center/
    domain/
    services/
    adapters/
    tui/
```

The existing `src/tui.ts` sidebar entrypoint can remain separate until the
control center is ready to integrate.

Current implementation:

| Path | Responsibility |
|------|----------------|
| `src/control-center/types.ts` | Renderer-neutral domain/service contracts. |
| `src/control-center/domain.ts` | Frontmatter parsing, cron validation, next-run derivation, task draft rendering, run-status normalization, summaries. |
| `src/control-center/adapters.ts` | Filesystem task/report readers, tolerant read-only SQLite run reader, scheduler health/log command adapters. |
| `src/control-center/services.ts` | Local task/health/stream services and snapshot composition. |
| `src/control-center/tui-render.ts` | Pure text layout for task list, detail panel, health, and stream tabs. |
| `src/control-center/tui-app.ts` | OpenTUI renderer lifecycle, keybindings, refresh loop, and dashboard state. |
| `src/cli/control-center.ts` | CLI parser and `control-center` command runner. |

## Shared backend boundary

The shared backend should expose stable TypeScript interfaces that both the TUI
and future web UI can consume.

```ts
export interface TaskService {
  listTasks(): Promise<TaskSummary[]>;
  getTask(taskName: string): Promise<TaskDetail>;
  listRuns(taskName: string, limit?: number): Promise<TaskRun[]>;
  validateRecurringTask(input: RecurringTaskDraft): ValidationResult;
  createRecurringTask(input: RecurringTaskDraft): Promise<TaskDefinition>;
  updateRecurringTask(input: RecurringTaskUpdate): Promise<TaskDefinition>;
}

export interface StreamService {
  streamSchedulerLogs(): AsyncIterable<SchedulerLogEvent>;
  streamTaskSession(sessionId: string): AsyncIterable<SessionEvent>;
  streamReport(path: string): AsyncIterable<ReportEvent>;
}

export interface HealthService {
  getSchedulerHealth(): Promise<SchedulerHealth>;
  watchSchedulerHealth(): AsyncIterable<SchedulerHealth>;
}
```

For the local TUI, these services can call local adapters directly. For the
future web UI, the same service contracts can be wrapped by HTTP/WebSocket or
Server-Sent Events.

## Data sources

Initial local adapters should read:

- `~/.config/opencode/.tasks.db` for task runs, sessions, statuses, errors,
  loop state, and run history.
- `~/.config/opencode/tasks/*.md` for recurring task definitions, schedules,
  prompts, enabled state, and permissions.
- `journalctl --user -u opencode-tasks.timer -u opencode-tasks.service` for
  scheduler/timer/service health and live logs.
- `bunx opencode-tasks --status` for an end-user-compatible scheduler summary.
- `opencode -s <session-id>` or a future structured session API for task session
  output.
- `~/.config/opencode/task-reports/*.md` for report streams and summaries.

## Domain model

Keep these models renderer-neutral:

- `TaskDefinition`
  - task name
  - file path
  - schedule
  - enabled state
  - permissions
  - prompt/body
  - parse/validation diagnostics
- `TaskRun`
  - run ID
  - task name
  - status
  - started/completed timestamps
  - session ID
  - error
  - PID if available
- `TaskSummary`
  - definition plus latest run
  - next run time when known
  - health badges/warnings
- `SchedulerHealth`
  - timer loaded/enabled/active state
  - service result/status
  - recent failure count
  - DB existence/growth status
  - task file validation status
  - empty-loop status
- `StreamEvent`
  - source kind: scheduler, session, report, database
  - timestamp
  - severity
  - task/session association
  - text payload

## TUI UX

The initial OpenTUI layout should optimize for watching and drilling into live
jobs:

```text
┌──────────────────────┬──────────────────────────────────────────────┐
│ Tasks                │ Selected task / scheduler health             │
│                      │                                              │
│ ○ watch              │ status, schedule, latest run, session, error │
│ ✓ observe-tune       ├──────────────────────────────────────────────┤
│ ✓ daily-maintenance  │ Streams                                      │
│ · weekly-hygiene     │ [scheduler] [session] [runs] [report]        │
│                      │                                              │
└──────────────────────┴──────────────────────────────────────────────┘
```

Suggested keybindings:

- `j/k` or arrow keys: move task selection
- `Tab`: switch stream tab
- `/`: filter tasks/logs
- `r`: refresh snapshots
- `f`: follow/unfollow live stream
- `o`: show the `opencode -s <session-id>` command for the latest run
- `q`: quit

The current monitor does not expose `n`, `e`, or `d`. Mutations remain behind the
service layer so future UI flows can require explicit validation, preview, and
confirmation before writing task files.

## Stream strategy

Treat streams as independent inputs into a shared event buffer:

- Scheduler logs come from `journalctl -f`.
- DB/run updates come from polling `.tasks.db` at a modest interval, then later
  can use file notifications if needed.
- Report updates come from file stat/tail behavior.
- Session output should prefer a structured OpenCode API if one is available.
  If not, the MVP can open `opencode -s <session-id>` as a separate pane or
  terminal process rather than trying to scrape an interactive nested TUI.

## Future web UI path

The web UI should reuse the backend service contracts and domain models, but
implement separate web components.

```text
OpenTUI app
  imports services directly
  uses terminal-specific panes and keybindings

Web app
  calls same service contracts through HTTP/SSE/WebSocket transport
  uses browser-specific routes, forms, tables, and log viewers
```

Transport can be added later with a thin wrapper:

- `GET /api/tasks`
- `GET /api/tasks/:name`
- `GET /api/tasks/:name/runs`
- `GET /api/health/scheduler`
- `GET /api/streams/scheduler` via SSE/WebSocket
- `POST /api/tasks` for future task creation
- `PATCH /api/tasks/:name` for future edit/enable/disable flows

## MVP phases

### Phase 1: Read-only backend

- [x] Add typed domain models.
- [x] Add `.tasks.db` read adapter.
- [x] Add recurring task file parser/validator.
- [x] Add scheduler health adapter using `systemctl`/`journalctl`.
- [x] Add tests for parsing, status derivation, and validation.

### Phase 2: Read-only OpenTUI dashboard

- [x] Task list with enabled/status badges.
- [x] Selected task detail panel.
- [x] Recent run list.
- [x] Scheduler health summary.
- [x] Report viewer for matching report files.

### Phase 3: Live streams

- [x] Stream recent scheduler logs into the dashboard event buffer.
- [x] Poll DB for new runs/status transitions on dashboard refresh.
- [x] Show selected report file tail in the report tab.
- [x] Provide `opencode -s <session-id>` command discovery for task sessions.

### Phase 4: Task creation

- [ ] Add recurring task creation wizard.
- [x] Validate frontmatter before writing in the service layer.
- [x] Render resulting markdown drafts in the domain layer.
- [ ] Require interactive confirmation before write.
- [x] Keep permission rules explicit and reject scheduled-task `ask` permissions.

### Phase 5: Web-ready backend

- [ ] Wrap services behind HTTP/SSE/WebSocket.
- [ ] Add a separate React web renderer.
- [x] Keep web components independent from OpenTUI components by sharing only the
  backend contracts and domain types.

## Risks and open questions

- **Session streaming:** structured session output may not be available. Avoid
  scraping nested TUI output as the long-term solution.
- **Scheduler ownership:** `opencode-tasks` may remain an external package; keep
  adapters tolerant of schema/CLI changes.
- **Permissions:** task creation must make scheduled-task permissions explicit,
  especially `external_directory`, because background tasks cannot answer prompts.
- **DB locking:** read-only SQLite access should avoid interfering with the
  scheduler. Prefer short-lived read connections or read-only mode.
- **Cross-platform support:** `journalctl` and systemd are Linux-specific. Model
  scheduler adapters by platform so macOS launchd support can be added later.

## Success criteria

- The TUI can answer “what is running, what failed, and where is the output?”
  without shelling out manually.
- The backend domain/service layer can be reused by a future web UI.
- Terminal and web renderers do not share visual components.
- Task creation can be added without rewriting monitoring internals.
- The implementation remains compatible with current `oh-my-opencode-slim`
  TypeScript/Bun conventions.
