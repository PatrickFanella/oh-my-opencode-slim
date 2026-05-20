# Control Center Codemap

## Responsibility

`src/control-center/` implements the scheduled-task control center described in
`docs/tui-control-center.md`. It keeps task monitoring reusable by separating
renderer-neutral domain/services from OpenTUI terminal rendering and the local
web HTTP/SSE transport.

## Files

- `types.ts`: stable task, run, health, stream, service, and snapshot contracts.
- `domain.ts`: frontmatter parsing, cron validation/next-run derivation,
  permission safety checks, task draft rendering, run-status normalization, and
  summary derivation.
- `adapters.ts`: local filesystem readers for `tasks/` and `task-reports/`, a
  tolerant read-only SQLite adapter for `.tasks.db`, and scheduler status/log
  adapters around `bunx opencode-tasks`, `systemctl`, and `journalctl`.
- `services.ts`: composes adapters into `TaskService`, `HealthService`,
  `StreamService`, and a single dashboard snapshot function.
- `tui-render.ts`: pure text rendering and view-state helpers for task lists,
  detail panels, stream tabs, filters, and health summaries.
- `tui-app.ts`: OpenTUI lifecycle, keyboard handling, refresh polling, and
  screen updates.
- `web-api.ts`: read-only HTTP/SSE routes over the shared services plus static
  asset serving for the Vite web dashboard.
- `index.ts`: public barrel for non-CLI consumers.

## Flow

```text
cli/control-center.ts
  └─ createControlCenterServices()
      ├─ TaskDefinitionFileRepository -> ~/.config/opencode/tasks/*.md
      ├─ SqliteTaskRunRepository -> ~/.config/opencode/.tasks.db
      ├─ SchedulerHealthAdapter -> bunx/systemctl/journalctl
      └─ ReportRepository -> ~/.config/opencode/task-reports/*.md
  └─ snapshot()
      ├─ OpenTUI dashboard (default)
      ├─ plain text snapshot (--no-tui)
      └─ JSON snapshot (--json)

cli/control-center-web.ts
  └─ startControlCenterWebServer()
      ├─ /api/snapshot, /api/tasks, /api/health/scheduler
      ├─ /api/events/scheduler (SSE)
      └─ apps/control-center-web/dist static assets
```

## Design Notes

- The monitor view is read-only; service-layer create/update helpers validate
  and render recurring task files but are not exposed from the TUI without a
  future confirmation flow.
- The SQLite adapter introspects table/column names instead of assuming the
  external `opencode-tasks` schema is stable.
- OpenTUI code imports the shared services directly. The React web UI uses
  `web-api.ts` HTTP/SSE routes and shares only domain types, not terminal
  components.
