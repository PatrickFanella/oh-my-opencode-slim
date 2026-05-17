# Go MCP server guide

Prefer Go for local or long-running MCP servers when the integration benefits from static binaries, low memory use, simple deployment, or strong concurrency.

## Shape

- `cmd/<server>/main.go` — parse config, choose stdio or HTTP transport.
- `internal/<service>/client.go` — typed API client.
- `internal/<service>/tools.go` — tool schemas and handlers.
- `internal/<service>/errors.go` — actionable errors for agents.

## Rules

- Accept `context.Context` in every handler.
- Keep tool names action-oriented: `<service>_<verb>_<object>`.
- Return compact structured JSON plus short text summaries.
- Mark destructive tools clearly in descriptions and annotations when supported.
- Use `go test ./...` and `go vet ./...` before release.
- Prefer env vars for secrets; never write tokens to generated examples.

## TypeScript fallback

Use TypeScript when the target client/runtime has better TypeScript MCP SDK support, when distributing through npm/MCPB, or when the integration is mostly JSON/HTTP glue.
