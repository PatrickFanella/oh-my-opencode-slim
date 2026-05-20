# Control Center Web App Codemap

## Responsibility

`apps/control-center-web/` is a Vite/React/Tailwind renderer for the scheduled
task control center. It reuses only renderer-neutral TypeScript types from
`src/control-center/types.ts` and talks to the local read-only HTTP/SSE API.

## Files

- `src/api/client.ts`: browser fetch/EventSource client for `/api/*` routes.
- `src/hooks/use-control-center.ts`: snapshot polling, selection, filtering,
  follow state, and scheduler-event subscription.
- `src/components/`: web-only visual components for task list, health, detail,
  and stream tabs. These do not import OpenTUI renderers.
- `src/App.tsx`: dashboard composition and keyboard shortcut wiring.
- `vite.config.ts`: Vite React setup and `/api` development proxy to the local
  control-center API server.

## Flow

```text
control-center-web CLI
  └─ src/control-center/web-api.ts
      ├─ /api/snapshot
      ├─ /api/tasks
      ├─ /api/tasks/:name
      ├─ /api/tasks/:name/runs
      ├─ /api/health/scheduler
      └─ /api/events/scheduler (SSE)
  └─ apps/control-center-web/dist
      └─ React dashboard
```

## Design Notes

- The web app is read-only; it has no create/update/delete API calls.
- The UI is intentionally separate from `src/control-center/tui-render.ts`.
- Dev mode expects the API at `http://127.0.0.1:47671` unless
  `CONTROL_CENTER_API_URL` overrides it.
