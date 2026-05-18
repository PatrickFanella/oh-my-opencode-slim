# src/mcp/

## Responsibility

- Define and expose the built-in MCP endpoints (websearch, context7, grep.app, browser/local/product MCPs) alongside shared type aliases so installer and runtime policy code can treat remote and local MCPs uniformly (`src/mcp/index.ts`, `src/mcp/types.ts`).
- Provide host-config helpers (`createHostBuiltinMcps`) for writing MCP definitions to `opencode.json(c)` while honoring feature flags/disabled lists.

## Design

- `types.ts` defines the discriminated union `McpConfig` with `RemoteMcpConfig` and `LocalMcpConfig`, keeping the shape of every connector explicit and easy to validate at compile time.
- Each service file exports a `RemoteMcpConfig` literal that points at the remote URL. Host-config helpers avoid embedding process env secrets so OpenCode's native MCP auth flow owns OAuth/API credentials (`websearch.ts`, `context7.ts`, `grep-app.ts`).
- `index.ts` aggregates the built-in configs in a `Record<McpName, McpConfig>` and exposes helpers/types for external consumers, keeping the set of hard-coded MCPs centralized.

## Flow

- During install, `createHostBuiltinMcps` iterates over the in-module registry,
  filters disabled MCPs, keeps built-ins enabled by default, sanitizes remote
  auth fields, and writes the result into host OpenCode config.
- At runtime, `src/index.ts` no longer exports MCP definitions from the plugin;
  it only applies `enabled_mcps`/`disabled_mcps` policy to host-installed MCPs
  before agent permissions are calculated.

## Integration

- `src/cli/config-io.ts` imports `createHostBuiltinMcps` to install MCP definitions into OpenCode's host config.
- Types exported from `src/mcp/types.ts` are re-exported by `src/mcp/index.ts`, letting other modules reference `McpConfig`, `LocalMcpConfig`, and `RemoteMcpConfig` without reaching into individual files.
- Remote configs are pure data objects consumed by the runtime's MCP execution layer (via the `McpConfig` contract) and depend only on environment-provided credentials and the URLs defined here.
