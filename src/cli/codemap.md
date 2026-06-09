# CLI Module Codemap

## Responsibility

`src/cli/` provides the plugin installation workflow and the utilities that generate and persist runtime configuration.

Current responsibilities:

- parse/install command arguments
- expose copyable shortcut commands for common bootstrap/install flows
- expose scheduled-task control-center launchers for OpenTUI, snapshots, and
  the local web dashboard
- install-time validation and environment checks
- OpenCode configuration mutation (atomic)
- lite config generation for provider/agent presets
- host MCP definition installation for OpenCode-native auth handling
- default BUILD/OPS/GROWTH/MYTH custom board agent materialization into
  `blacktower/agents/`
- code-managed bundled skill availability toggles
- clone-based bootstrap defaults for host permissions, compaction, legacy
  external skill path cleanup, scheduled-task install/templates, and DCP/quota
  sidecar files
- optional TUI plugin registration for integrations with TUI panels, currently
  quota
- companion TUI plugin behavior lives in `src/tui.ts`, including collapsible
  Blacktower board density modes (`compact`, `full`, `minimal`, `off`)

## Design

### Command surface

- `src/cli/index.ts` only dispatches:
  - `install` subcommand and flags
    - `--skills=yes|no`
    - `--preset=<name>`
    - `--no-tui`
    - `--dry-run`
    - `--reset`
    - `--help`
- shortcut entrypoints expand before parsing:
  - `setup` → `bootstrap --with-dcp --with-quota --with-rtk`
  - `preview` → same as `setup` plus `--dry-run`
  - `update` → `install --no-tui --skills=yes`
  - `repair` → `bootstrap --with-dcp --with-quota --with-rtk --reset`
  - scheduled-task plugin/daemon/commands/templates are bootstrap defaults;
    `--no-scheduled-tasks` opts out
- `control-center` launches the read-only scheduled-task dashboard:
  - default: OpenTUI dashboard
  - `--no-tui`: plain text snapshot
  - `--json`: backend snapshot JSON
  - `--config-dir=<path>`: alternate OpenCode config directory
- `control-center-web` launches the read-only browser dashboard:
  - default: serve built Vite assets plus local `/api/*` routes
  - `--api-only`: serve only the API for a separate Vite dev server
  - `--host=<host>` / `--port=<port>`: bind address
  - `--open`: open the dashboard URL in the default browser

The CLI is intentionally non-interactive-only now; it prints usage and steps to stdout with exit codes.

### Module decomposition

- `paths.ts`: config directory and file discovery (`opencode.json`/`.jsonc`, lite config path).
- `config-io.ts`: JSON/JSONC parsing, normalize write behavior, atomic writes (`.tmp` + backups directory), plugin registration, default-agent disabling, default board-agent materialization.
- `providers.ts`: provider model mapping + `generateBlacktowerConfig()`.
- `system.ts`: OpenCode binary/version/path checks.
- `skills.ts`: skill permission metadata shared by agent config generation.
- `custom-skills.ts`: bundled skill registry and manual copy helper; not used by the default installer.
- `config-manager.ts`: re-export barrel for CLI config utilities.
- `install.ts`: end-to-end install orchestration and console messaging.
- `bootstrap.ts`: clone-based machine bootstrap, full config-directory backup
  and reset, optional integration plugin registration, trusted host defaults,
  DCP/quota sidecar defaults, and shell helper installation.
- `control-center.ts`: CLI parser/runner for the scheduled-task control center.
- `control-center-web.ts`: CLI parser/runner for the local web dashboard and
  read-only API server.
- `types.ts`: install/config DTOs.

## Flow

```text
CLI install command
  └─> install.ts (runInstall)
      1) check OpenCode installed
      2) add plugin entry to main OpenCode config
      3) add built-in MCP definitions to host OpenCode config
      4) disable legacy default agents
      5) materialize default board custom agents
      6) write/preview generated lite config
```

`generateBlacktowerConfig(installConfig)` behavior:

- writes only `$schema` for the default install path
- materializes only the selected generated preset when `--preset` is provided
- install-time `--preset` only selects between generated presets
- maps each built-in agent name to provider-specific model/variant
- omits `skillProfiles` when skills are enabled so code-owned built-in defaults apply
- writes explicit empty skill profiles for all built-in agents when `--skills=no`
- injects default MCP sets from `DEFAULT_AGENT_MCPS`
- includes tmux block (`layout`, `main_pane_size`) when enabled

`writeBlacktowerConfig()` writes target file atomically and supports `--reset`/dry-run branching in `install.ts`.

`bootstrap()` first backs up the entire existing `~/.config/opencode` tree into
`backups/blacktower-bootstrap-*`, then resets the config directory while preserving
`backups/`. It calls the installer, applies trusted host defaults in OpenCode's
config (`permission: "allow"`, compaction defaults, and legacy
`~/.agents/skills` path removal), and finalizes the expected base layout
(`backups/`, `commands/`, `plugins/`, `skills/`, `blacktower/`,
`.gitignore`, and `package.json`). When DCP or quota are selected, it also
writes sidecar defaults to `dcp.jsonc` and `opencode-quota/quota-toast.json`.
`--with-quota` also adds the quota plugin to `tui.json(c)` so its TUI
sidebar/status panels load.
Scheduled-task support is enabled by default: bootstrap installs the
`opencode-tasks` plugin/daemon/commands, prepares the plugin cache, and writes
disabled examples under `task-templates/` unless `--no-scheduled-tasks` or
`--skip-scheduled-task-templates` is used.

## Runtime integration

- Output file produced by install (`blacktower.json`) is consumed by runtime `config/loader.ts`.
- Permission defaults for resolved skill profiles are shared with `agents/index.ts` via `cli/skills.ts`.
- Generated provider/multiplexer settings are consumed by OpenCode session runtime via `src/index.ts` bootstrap.

## Notes for architecture/docs accuracy

- TUI sidebar controls are real OpenCode commands backed by shared TUI state;
  the sidebar slot itself remains render-only.
- `installSkills` controls whether generated config allows code-owned default
  skill profiles or writes explicit empty profiles.
- Built-in preset support includes `openai`, `opencode-go`, `kimi`, `copilot`, and `zai-plan`.
