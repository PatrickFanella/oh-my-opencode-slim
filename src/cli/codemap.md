# CLI Module Codemap

## Responsibility

`src/cli/` provides the plugin installation workflow and the utilities that generate and persist runtime configuration.

Current responsibilities:

- parse/install command arguments
- install-time validation and environment checks
- OpenCode configuration mutation (atomic)
- lite config generation for provider/agent presets
- host MCP definition installation for OpenCode-native auth handling
- code-managed bundled skill availability toggles
- clone-based bootstrap defaults for host permissions, compaction, legacy
  external skill path cleanup, and DCP/quota sidecar files
- optional TUI plugin registration for integrations with TUI panels, currently
  quota
- companion TUI plugin behavior lives in `src/tui.ts`, including collapsible
  OMOC board density modes (`compact`, `full`, `minimal`, `off`)

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

The CLI is intentionally non-interactive-only now; it prints usage and steps to stdout with exit codes.

### Module decomposition

- `paths.ts`: config directory and file discovery (`opencode.json`/`.jsonc`, lite config path).
- `config-io.ts`: JSON/JSONC parsing, normalize write behavior, atomic writes (`.tmp` + backups directory), plugin registration, default-agent disabling.
- `providers.ts`: provider model mapping + `generateLiteConfig()`.
- `system.ts`: OpenCode binary/version/path checks.
- `skills.ts`: skill permission metadata shared by agent config generation.
- `custom-skills.ts`: bundled skill registry and manual copy helper; not used by the default installer.
- `config-manager.ts`: re-export barrel for CLI config utilities.
- `install.ts`: end-to-end install orchestration and console messaging.
- `bootstrap.ts`: clone-based machine bootstrap, full config-directory backup
  and reset, optional integration plugin registration, trusted host defaults,
  DCP/quota sidecar defaults, and shell helper installation.
- `types.ts`: install/config DTOs.

## Flow

```text
CLI install command
  └─> install.ts (runInstall)
      1) check OpenCode installed
      2) add plugin entry to main OpenCode config
      3) add built-in MCP definitions to host OpenCode config
      4) disable legacy default agents
      5) write/preview generated lite config
```

`generateLiteConfig(installConfig)` behavior:

- writes only `$schema` for the default install path
- materializes only the selected generated preset when `--preset` is provided
- install-time `--preset` only selects between generated presets
- maps each built-in agent name to provider-specific model/variant
- omits `skillProfiles` when skills are enabled so code-owned built-in defaults apply
- writes explicit empty skill profiles for all built-in agents when `--skills=no`
- injects default MCP sets from `DEFAULT_AGENT_MCPS`
- includes tmux block (`layout`, `main_pane_size`) when enabled

`writeLiteConfig()` writes target file atomically and supports `--reset`/dry-run branching in `install.ts`.

`bootstrap()` first backs up the entire existing `~/.config/opencode` tree into
`backups/omoc-bootstrap-*`, then resets the config directory while preserving
`backups/`. It calls the installer, applies trusted host defaults in OpenCode's
config (`permission: "allow"`, compaction defaults, and legacy
`~/.agents/skills` path removal), and finalizes the expected base layout
(`backups/`, `commands/`, `plugins/`, `skills/`, `oh-my-opencode-slim/`,
`.gitignore`, and `package.json`). When DCP or quota are selected, it also
writes sidecar defaults to `dcp.jsonc` and `opencode-quota/quota-toast.json`.
`--with-quota` also adds the quota plugin to `tui.json(c)` so its TUI
sidebar/status panels load.

## Runtime integration

- Output file produced by install (`oh-my-opencode-slim.json`) is consumed by runtime `config/loader.ts`.
- Permission defaults for resolved skill profiles are shared with `agents/index.ts` via `cli/skills.ts`.
- Generated provider/multiplexer settings are consumed by OpenCode session runtime via `src/index.ts` bootstrap.

## Notes for architecture/docs accuracy

- TUI sidebar controls are real OpenCode commands backed by shared TUI state;
  the sidebar slot itself remains render-only.
- `installSkills` controls whether generated config allows code-owned default
  skill profiles or writes explicit empty profiles.
- Built-in preset support includes `openai`, `opencode-go`, `kimi`, `copilot`, and `zai-plan`.
