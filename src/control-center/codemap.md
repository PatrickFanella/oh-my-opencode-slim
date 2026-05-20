# Control Center Codemap

## Responsibility

`src/control-center/` implements the scheduled-task control center described in
`docs/tui-control-center.md`. It keeps task monitoring reusable by separating
renderer-neutral domain/services from the OpenTUI terminal frontend.

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
```

## Design Notes

- The monitor view is read-only; service-layer create/update helpers validate
  and render recurring task files but are not exposed from the TUI without a
  future confirmation flow.
- The SQLite adapter introspects table/column names instead of assuming the
  external `opencode-tasks` schema is stable.
- OpenTUI code imports the shared services directly. A future web UI should wrap
  the same contracts with HTTP/SSE/WebSocket rather than share terminal
  components.
