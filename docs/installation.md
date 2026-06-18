# Installation Guide

Complete installation instructions for blacktower.

For planned installer improvements such as simpler commands, an install TUI,
default agent materialization, and scheduler/task-list work, see
[Future Plans](future-plans.md).

## Table of Contents

- [For Humans](#for-humans)
- [For LLM Agents](#for-llm-agents)
- [Troubleshooting](#troubleshooting)
- [Uninstallation](#uninstallation)

---

## For Humans

### Quick Install

Run the interactive installer:

```bash
bunx blacktower@latest install
```

Or use non-interactive mode:

```bash
bunx blacktower@latest install --no-tui --skills=yes
```

For a cloned checkout, the short commands are:

```bash
bun run setup
bun run preview
bun run update
bun run repair
bun run control-center
bun run control-center:web
```

`setup` is the recommended full bootstrap path. Advanced bootstrap flags still
work when you need them:

```bash
bun run src/cli/index.ts bootstrap --with-dcp --with-quota --with-rtk
```

### Clone-Based Bootstrap

For a full machine bootstrap from a cloned checkout:

```bash
git clone https://github.com/blacktower/blacktower.git
cd blacktower
bun run setup
```

The bootstrap flow:

- backs up the entire existing OpenCode config directory under
  `~/.config/opencode/backups/blacktower-bootstrap-*`
- resets `~/.config/opencode` before recreating the desired directory layout,
  preserving only `backups/`
- checks for `tmux`
- installs or updates OpenCode with `curl -fsSL https://opencode.ai/install | bash`
- runs `bun install --yes` and `bun run build`
- runs the Blacktower installer from the local checkout
- optionally adds `@tarquinen/opencode-dcp@latest` and
  `@slkiser/opencode-quota` to OpenCode's plugin list; quota is also added
  to `tui.json(c)` so its TUI panels load
- applies trusted host defaults to `opencode.json(c)`: `permission: "allow"`,
  compaction `{ auto: false, prune: true, reserved: 10000 }`, and removes the
  legacy `~/.agents/skills` path
- when DCP/quota are selected, writes sidecar defaults to `dcp.jsonc` and
  `opencode-quota/quota-toast.json`
- optionally installs RTK with its official install script, then runs
  `rtk init -g --opencode --auto-patch` so OpenCode gets the RTK rewrite
  integration
- adds `opencode-tasks` by default, installs its launchd/systemd scheduler
  daemon with `bunx opencode-tasks --install`, installs its `/loop` slash
  commands with `bunx opencode-tasks --install-commands`, writes disabled
  recurring-task templates under `~/.config/opencode/task-templates/`, and
  prepares OpenCode's `opencode-tasks` plugin cache with the
  `@opencode-ai/plugin` runtime peer dependency; the `scheduled-tasks` agent
  skill is bundled and managed by Blacktower
- inserts managed `opencode`, `oc`, and `occ` helpers into
  `.zshrc`/`.bashrc` for launching OpenCode with a random `OPENCODE_PORT` for
  tmux panes; `occ` runs `opencode --continue`

Useful bootstrap flags:

| Option | Description |
|--------|-------------|
| `--with-dcp` | Add `@tarquinen/opencode-dcp@latest` |
| `--with-quota` | Add `@slkiser/opencode-quota` to OpenCode and TUI plugin lists |
| `--with-rtk` | Install RTK and run `rtk init -g --opencode --auto-patch` |
| `--with-scheduled-tasks` | Add `opencode-tasks`, install daemon/commands, and write templates (default) |
| `--no-scheduled-tasks` | Skip `opencode-tasks`, daemon/commands, and templates |
| `--skip-opencode` | Do not run the OpenCode install/update command |
| `--skip-build` | Do not run `bun install --yes` or `bun run build` |
| `--skip-shell-helper` | Do not modify `.zshrc`/`.bashrc` |
| `--skip-rtk-init` | Install RTK but do not run `rtk init` |
| `--skip-scheduled-tasks-daemon` | Add plugin but skip launchd/systemd daemon install |
| `--skip-scheduled-tasks-commands` | Add plugin/daemon but skip `/loop` command install |
| `--skip-scheduled-task-templates` | Add plugin/daemon but skip writing disabled task templates |
| `--opencode-install-cmd=<cmd>` | Override the OpenCode install/update command |
| `--rtk-install-cmd=<cmd>` | Override the RTK install command |
| `--scheduled-tasks-daemon-cmd=<cmd>` | Override scheduled-tasks daemon install command |
| `--scheduled-tasks-commands-cmd=<cmd>` | Override scheduled-tasks command install command |
| `--dry-run` | Show intended actions without writing files |

### Configuration Options

The installer supports the following options:

| Option | Description |
|--------|-------------|
| `--skills=yes|no` | Enable code-managed bundled skills (default: yes); `no` writes explicit empty skill profiles |
| `--background-subagents=ask|yes|no` | Configure `OPENCODE_EXPERIMENTAL_BACKGROUND_SUBAGENTS=true` in shell startup files for native OpenCode background subagents (`ask` by default for interactive installs, `no` with `--no-tui`) |
| `--preset=<name>` | Active generated config preset: `openai` or `opencode-go` (default: `openai`) |
| `--board-provider=<provider>` | Materialize board agents for `github-copilot`, `openai`, `openrouter`, `anthropic`, or `gemini` |
| `--no-tui` | Non-interactive mode |
| `--dry-run` | Simulate install without writing files |
| `--reset` | Force overwrite of existing configuration |

### Non-Destructive Behavior

By default, the installer is non-destructive. If an `blacktower.json` configuration file already exists, the installer will **not** overwrite it. Instead, it will display a message:

```
[i] Configuration already exists at ~/.config/opencode/blacktower.json. Use --reset to overwrite.
```

To force overwrite of your existing configuration, use the `--reset` flag:

```bash
bunx blacktower@latest install --reset
```

**Note:** When using `--reset`, the installer backs up the previous file under
`~/.config/opencode/backups/blacktower-install-*` before overwriting it.

### After Installation

The default installer writes a schema-only Blacktower config and lets code-owned defaults choose the active agent models. Passing `--preset=<name>` writes only that generated preset. It also writes built-in MCP definitions into `opencode.json(c)` so OpenCode's native MCP auth flow owns any OAuth/API authentication. It can add `OPENCODE_EXPERIMENTAL_BACKGROUND_SUBAGENTS=true` to Bash, Zsh, and Fish startup files for OpenCode's native background-subagent runtime; use `--background-subagents=yes` to force this in non-interactive installs or `--background-subagents=no` to skip it. It materializes the BUILD, OPS, GROWTH, PRODUCT, and MYTH custom board agent JSON files into `~/.config/opencode/blacktower/agents/` without overwriting existing files. It does not copy the whole bundled skill catalog into `~/.config/opencode/skills` or depend on `~/.agents/skills`; with the default `--skills=yes`, the plugin materializes only the curated union of code-owned skills referenced by enabled agents into a managed skill directory, then controls per-agent skill access through permissions. To make OpenCode Go active during install, run `bunx blacktower@latest install --preset=opencode-go`. That preset uses GLM-5.1 for Orchestrator, so the installer also enables Observer with `opencode-go/kimi-k2.6` for visual analysis. To switch every board agent later, including built-in specialists such as Explorer, Oracle, Librarian, Designer, Fixer, Observer, Council, and Orchestrator, run `bunx blacktower@latest switch-agents <provider>`. The command refreshes custom board JSON files and writes an active `board-<provider>` preset to `~/.config/opencode/blacktower.json`; restart OpenCode after switching. To build a mixed setup, use **[Configuration Reference](configuration.md)** for the full option reference and the preset docs for copyable examples.

The clone-based `bootstrap` command also applies trusted machine defaults in
OpenCode's host config. Those defaults intentionally trust the local machine by
setting `permission: "allow"`, tuning OpenCode compaction, removing the legacy
`~/.agents/skills` path, and writing DCP/quota sidecar config when those
integrations are selected.

Scheduled task templates are offered but not enabled. Bootstrap writes them to
`~/.config/opencode/task-templates/`; review one, copy it to
`~/.config/opencode/tasks/`, and change `enabled: false` to `enabled: true` when
you want it to run.

The control-center command gives scheduled work a local dashboard:

```bash
bun run control-center
bun run control-center -- --no-tui
bun run control-center -- --json
```

It reads `~/.config/opencode/tasks/*.md`, `~/.config/opencode/.tasks.db`,
`~/.config/opencode/task-reports/*.md`, `bunx opencode-tasks --status`, and
available `systemctl`/`journalctl` user-unit status without mutating task files
from the monitor view.

For a browser dashboard with the same read-only data, run:

```bash
bun run control-center:web
bun run control-center:web -- --open
bun run control-center:web:api
bun run control-center:web:dev
```

The web command binds to `127.0.0.1:47671` by default, serves built Vite assets
when available, and exposes only read-only `/api/*` and scheduler SSE routes.
Use `--allow-network` only if you intentionally want to expose task metadata,
cwd paths, reports, scheduler logs, and session IDs beyond loopback.

Then:

```bash
opencode auth login
# Select your provider and complete OAuth flow
```

```bash
opencode models --refresh
```

Open your generated config at `~/.config/opencode/blacktower.json`
and adjust models if needed.

The installer also registers the Blacktower TUI sidebar plugin in
`~/.config/opencode/tui.json`. If OpenCode shows the sidebar but the Blacktower
panel is absent, open the TUI plugin manager and enable the
`blacktower:tui` module once. The panel shows the full board by
default with a compact density: CORE agents stay visible, custom BUILD/OPS/
GROWTH/PRODUCT/MYTH groups start collapsed, and config/MCP/LSP/plugin/todo/diff status
stays visible. The sidebar itself is render-only; use the real OpenCode
commands `/board-toggle`, `/board-full`, `/board-compact`, `/board-minimal`,
and `/board-off` to switch density or hide the Blacktower sidebar content.

Then run OpenCode and verify the agents:

```text
ping all agents
```

> **💡 Tip: Models are fully customizable.** The installer sets sensible defaults, but you can assign *any* model to *any* agent. Edit `~/.config/opencode/blacktower.json` (or `.jsonc` for comments support) to override models, adjust reasoning effort, or disable agents entirely.

### Single-plugin setup

If OpenCode is your only harness, Blacktower can be your main distribution layer:

1. Install Blacktower normally.
2. Keep `~/.config/opencode/opencode.json` focused on plugin registration and
   OpenCode host settings.
3. Put Blacktower behavior in `~/.config/opencode/blacktower.jsonc`.
4. Keep DCP and quota tooling separate from Blacktower.
5. Migrate only the skills and MCPs you actually use.

Rollback path: remove `blacktower` from OpenCode's `plugin` array,
then restart OpenCode.

### Alternative: Ask Any Coding Agent

Paste this into Claude Code, AmpCode, Cursor, or any coding agent:

```
Install and configure by following the instructions here:
https://raw.githubusercontent.com/blacktower/blacktower/refs/heads/master/README.md
```

---

## For LLM Agents

If you're an LLM Agent helping set up blacktower, follow these steps.

### Step 1: Check OpenCode Installation

```bash
opencode --version
```

If not installed, direct the user to https://opencode.ai/docs first.

### Step 2: Run the Installer

The default installer writes a schema-only Blacktower config. Passing `--preset=<name>` writes only that generated preset:

```bash
bunx blacktower@latest install --no-tui --skills=yes
```

**Examples:**
```bash
# Interactive install
bunx blacktower@latest install

# Non-interactive with code-managed bundled skills
bunx blacktower@latest install --no-tui --skills=yes

# Make the generated OpenCode Go preset active
bunx blacktower@latest install --preset=opencode-go

# Non-interactive without skills
bunx blacktower@latest install --no-tui --skills=no

# Force overwrite existing configuration
bunx blacktower@latest install --reset
```

The installer automatically:
- Adds the plugin to `~/.config/opencode/opencode.json` (or `.jsonc` if it exists)
- Adds built-in MCP definitions to `opencode.json(c)` for native auth handling
- Disables default OpenCode agents
- Enables OpenCode LSP integration when no explicit `lsp` setting exists
- Generates agent model mappings in `~/.config/opencode/blacktower.json` (or `.jsonc`)
- Leaves multiplexer settings to plugin defaults: tmux, `main-vertical`, and
  `main_pane_size: 60`. Override `multiplexer` in plugin config only when you
  want a different layout/backend or `type: "none"`.

### Step 3: Authenticate with Providers

Ask user to run the following command. Don't run it yourself, it requires user interaction.

```bash
opencode auth login
# Select your provider and complete OAuth flow
```

### Step 4: Verify Installation

Ask the user to:

1. Authenticate: `opencode auth login`
2. Refresh models: `opencode models --refresh`
3. Start OpenCode: `opencode`
4. Run: `ping all agents`

Verify all agents respond successfully.

**Crucial Advice for the User:**
- They can easily assign **different models to different agents** by editing `~/.config/opencode/blacktower.json` (or `.jsonc`).
- If they want to add a different provider later (OpenCode Go, Kimi, GitHub Copilot, ZAI), they can update this file manually. See **[Configuration Reference](configuration.md)** and the preset docs for examples.
- Read the generated `~/.config/opencode/blacktower.json` (or `.jsonc`) file to understand the current configuration.

---

## Troubleshooting

### Installer Fails

Check the expected config format:
```bash
bunx blacktower@latest install --help
```

Then manually create the config files at:
- `~/.config/opencode/blacktower.json` (or `.jsonc`)

### Configuration Already Exists

If the installer reports that the configuration already exists, you have two options:

If both `blacktower.jsonc` and `blacktower.json` exist,
the installer updates/reports the JSONC file because it is the file loaded at
runtime.

1. **Keep existing config**: The installer will skip the configuration step and continue with other operations (like adding the plugin or installing skills).

2. **Reset configuration**: Use `--reset` to overwrite:
   ```bash
   bunx blacktower@latest install --reset
   ```
   A backup will be created automatically under
   `~/.config/opencode/backups/blacktower-install-*`.

### Agents Not Responding

1. Check your authentication:
   ```bash
   opencode auth status
   ```

2. From your project root, verify your config file exists and is valid:
   ```bash
   bunx blacktower@latest doctor
   ```

3. Check that your provider is configured in `~/.config/opencode/opencode.json`

### Authentication Issues

If providers are not working:

1. Check your authentication status:
   ```bash
   opencode auth status
   ```

2. Re-authenticate if needed:
   ```bash
   opencode auth login
   ```

3. Verify your config file has the correct provider configuration:
   ```bash
   cat ~/.config/opencode/blacktower.json
   ```

### Editor Validation

Add a `$schema` reference to your config for autocomplete and inline validation:

```jsonc
{
  "$schema": "https://unpkg.com/blacktower@latest/blacktower.schema.json",
  // your config...
}
```

Works in VS Code, Neovim (with `jsonls`), and any editor that supports JSON Schema. Catches typos and wrong nesting immediately.

### Tmux Integration Not Working

Make sure you're running OpenCode with the `--port` flag and the port matches your `OPENCODE_PORT` environment variable:

```bash
tmux
export OPENCODE_PORT=4096
opencode --port 4096
```

See the [Multiplexer Integration Guide](multiplexer-integration.md) for more details.

---

## Uninstallation

1. **Remove the plugin from your OpenCode config**:

   Edit `~/.config/opencode/opencode.json` and remove `"blacktower"` from the `plugin` array.

2. **Remove configuration files (optional)**:
   ```bash
   rm -f ~/.config/opencode/blacktower.json
   rm -rf ~/.config/opencode/backups/blacktower-install-*
   ```

3. **Remove skills (optional)**:
   ```bash
   npx skills remove agent-browser
   rm -rf ~/.config/opencode/skills/simplify
   rm -rf ~/.config/opencode/skills/codemap
   ```
