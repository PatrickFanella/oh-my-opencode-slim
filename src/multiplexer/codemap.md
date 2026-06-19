# src/multiplexer/

## Responsibility

- Provide multiplexer-backed visualization for spawned subagent sessions.
- Select and instantiate terminal backend based on config/env:
  `auto`, `tmux`, `zellij`, or `none`.
- Manage lifecycle of child session panes with lifecycle hooks from OpenCode
  events plus health/polling fallback.
- Keep pane cleanup safe and graceful (best-effort interrupt + kill).

## Design

- `types.ts`
  - Defines shared abstractions:
    - `Multiplexer` (`spawnPane`, `closePane`, `applyLayout`, `isAvailable`,
      `isInsideSession`),
    - `PaneResult`,
    - `isServerRunning(serverUrl, timeoutMs?, maxAttempts?)` for readiness checks.

- `factory.ts`
  - Creates fresh multiplexer instance per call (no cache) so env-specific
    state (`TMUX`, `ZELLIJ`) is captured accurately.
  - `auto` mode resolves strictly by env vars and can become no-op `none`.
  - Exposes `getAutoMultiplexerType` and `startAvailabilityCheck` for diagnostics.

- `tmux/index.ts` (`TmuxMultiplexer`)
  - Detects binary lazily via `which/where` + `tmux -V`.
  - `spawnPane` executes `opencode attach` in a split pane,
    sets pane title, and applies layout.
  - `closePane` sends `C-c`, waits briefly, then `kill-pane`.
  - `applyLayout` handles main layout sizing and rebalance.

- `zellij/index.ts` (`ZellijMultiplexer`)
  - Detects and reuses/creates `opencode-agents` tab.
  - First child uses default pane in that tab; additional children create panes.
  - Falls back to first available pane ID heuristics and restores original tab
    context around cross-tab operations.
  - Layout configuration is accepted but effectively no-op (tool semantics differ
    from tmux).

- `session-manager.ts` (`MultiplexerSessionManager`)
  - Thin OpenCode-event/timer adapter initialized once from plugin context and
    config.
  - Delegates pane lifecycle policy to `SessionLifecycle` and owns polling timer
    start/stop/update plus backend availability setup.

- `session-lifecycle.ts` (`SessionLifecycle`)
  - Owns mirrored session state, known-session tracking, in-flight spawn tokens,
    close promises, respawn policy, polling fallback decisions, and cleanup.
  - Handles `session.created`, `session.status`, and `session.deleted` with
    stale-spawn protection so panes returned after deletion/cleanup are closed
    instead of orphaned.
  - `cleanup()` quiesces creation/respawn, waits in-flight spawn and close paths,
    then closes all tracked panes before returning.

- `index.ts`
  - Re-exports factory, manager, and implementations for external import.

## Flow

- `src/index.ts` reads multiplexer config and creates
  `MultiplexerSessionManager(ctx, config)`.
- On startup `getMultiplexer(config)` determines backend and whether manager is
  enabled (`type != none`, multiplexer present, running inside session).
- On `session.created`:
  - `MultiplexerSessionManager` forwards the event to `SessionLifecycle`,
  - lifecycle checks backend health via `isServerRunning(serverUrl)`,
  - spawns a new pane with token-based stale-spawn protection,
  - manager starts background polling when lifecycle reports tracked/closing work.
- On `session.status`:
  - `idle` → mark idle; close only after the session has been observed `busy`
    and idle persists past the grace window,
  - `busy` → mark busy and `respawnIfKnown` if session was previously known.
- On `session.deleted`:
  - close and remove pane, clear known-session mapping.
- `cleanup()` stops polling, asks lifecycle to quiesce spawn/close work, closes
  all panes, and clears tracking maps.

## Integration

- Integrates with OpenCode session events and server URL from plugin input.
- Uses helper endpoints defined by `src/config` multiplexer settings:
  `type`, `layout`, `main_pane_size`.
- Implementations in `src/multiplexer/tmux` and `src/multiplexer/zellij` are used
  through the shared abstraction.
- Validation coverage:
  - `src/multiplexer/factory.test.ts`
  - `src/multiplexer/session-manager.test.ts`
