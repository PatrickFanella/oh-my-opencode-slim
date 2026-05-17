# Installation Guide

Complete installation instructions for oh-my-opencode-slim.

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
bunx oh-my-opencode-slim@latest install
```

Or use non-interactive mode:

```bash
bunx oh-my-opencode-slim@latest install --no-tui --skills=yes
```

### Clone-Based Bootstrap

For a full machine bootstrap from a cloned checkout:

```bash
git clone https://github.com/patrickfanella/oh-my-opencode-slim.git
cd oh-my-opencode-slim
bun run bootstrap --yes --with-dcp --with-quota --with-rtk --with-scheduled-tasks
```

The bootstrap command:

- backs up existing OpenCode config files under
  `~/.config/opencode/backups/omoc-bootstrap-*`
- checks for `tmux`
- installs or updates OpenCode with `curl -fsSL https://opencode.ai/install | bash`
- runs `bun install --yes` and `bun run build`
- runs the OMOC installer from the local checkout
- optionally adds `@tarquinen/opencode-dcp@latest` and
  `@slkiser/opencode-quota` to OpenCode's plugin list
- optionally installs RTK with its official install script, then runs
  `rtk init -g --opencode --auto-patch` so OpenCode gets the RTK rewrite
  integration
- optionally adds `opencode-scheduled-tasks`, installs its launchd/systemd
  scheduler daemon with `npx -y opencode-scheduled-tasks --install`, and
  installs its agent skill with `npx -y opencode-scheduled-tasks --install-skill`
- inserts a managed `omos` helper into `.zshrc`/`.bashrc` for launching
  OpenCode with a random `OPENCODE_PORT` for tmux panes

Useful bootstrap flags:

| Option | Description |
|--------|-------------|
| `--with-dcp` | Add `@tarquinen/opencode-dcp@latest` |
| `--with-quota` | Add `@slkiser/opencode-quota` |
| `--with-rtk` | Install RTK and run `rtk init -g --opencode --auto-patch` |
| `--with-scheduled-tasks` | Add `opencode-scheduled-tasks`, install daemon, and install skill |
| `--skip-opencode` | Do not run the OpenCode install/update command |
| `--skip-build` | Do not run `bun install --yes` or `bun run build` |
| `--skip-shell-helper` | Do not modify `.zshrc`/`.bashrc` |
| `--skip-rtk-init` | Install RTK but do not run `rtk init` |
| `--skip-scheduled-tasks-daemon` | Add plugin but skip launchd/systemd daemon install |
| `--skip-scheduled-tasks-skill` | Add plugin/daemon but skip scheduled-tasks skill install |
| `--opencode-install-cmd=<cmd>` | Override the OpenCode install/update command |
| `--rtk-install-cmd=<cmd>` | Override the RTK install command |
| `--scheduled-tasks-daemon-cmd=<cmd>` | Override scheduled-tasks daemon install command |
| `--scheduled-tasks-skill-cmd=<cmd>` | Override scheduled-tasks skill install command |
| `--dry-run` | Show intended actions without writing files |

### Configuration Options

The installer supports the following options:

| Option | Description |
|--------|-------------|
| `--skills=yes|no` | Install recommended and bundled skills (default: yes) |
| `--preset=<name>` | Active generated config preset: `openai` or `opencode-go` (default: `openai`) |
| `--no-tui` | Non-interactive mode |
| `--dry-run` | Simulate install without writing files |
| `--reset` | Force overwrite of existing configuration |

### Non-Destructive Behavior

By default, the installer is non-destructive. If an `oh-my-opencode-slim.json` configuration file already exists, the installer will **not** overwrite it. Instead, it will display a message:

```
[i] Configuration already exists at ~/.config/opencode/oh-my-opencode-slim.json. Use --reset to overwrite.
```

To force overwrite of your existing configuration, use the `--reset` flag:

```bash
bunx oh-my-opencode-slim@latest install --reset
```

**Note:** When using `--reset`, the installer creates a `.bak` backup file before overwriting, so your previous configuration is preserved.

### After Installation

The installer generates both OpenAI and OpenCode Go presets, with OpenAI active by default (using `gpt-5.5` and `gpt-5.4-mini` models). To make OpenCode Go active during install, run `bunx oh-my-opencode-slim@latest install --preset=opencode-go`. That preset uses GLM-5.1 for Orchestrator, so the installer also enables Observer with `opencode-go/kimi-k2.6` for visual analysis. To switch providers later or build a mixed setup, use **[Configuration Reference](configuration.md)** for the full option reference and the preset docs for copyable examples.

Then:

```bash
opencode auth login
# Select your provider and complete OAuth flow
```

```bash
opencode models --refresh
```

Open your generated config at `~/.config/opencode/oh-my-opencode-slim.json`
and adjust models if needed.

The installer also registers the companion TUI sidebar plugin in
`~/.config/opencode/tui.json`. If OpenCode shows the sidebar but the OMOC
panel is absent, open the TUI plugin manager and enable the
`oh-my-opencode-slim:tui` module once.

Then run OpenCode and verify the agents:

```text
ping all agents
```

> **💡 Tip: Models are fully customizable.** The installer sets sensible defaults, but you can assign *any* model to *any* agent. Edit `~/.config/opencode/oh-my-opencode-slim.json` (or `.jsonc` for comments support) to override models, adjust reasoning effort, or disable agents entirely.

### Single-plugin setup

If OpenCode is your only harness, OMOC can be your main distribution layer:

1. Install OMOC normally.
2. Keep `~/.config/opencode/opencode.json` focused on plugin registration and
   OpenCode host settings.
3. Put OMOC behavior in `~/.config/opencode/oh-my-opencode-slim.jsonc`.
4. Keep DCP and quota tooling separate from OMOC.
5. Migrate only the skills and MCPs you actually use.

Rollback path: remove `oh-my-opencode-slim` from OpenCode's `plugin` array,
then restart OpenCode.

### Alternative: Ask Any Coding Agent

Paste this into Claude Code, AmpCode, Cursor, or any coding agent:

```
Install and configure by following the instructions here:
https://raw.githubusercontent.com/patrickfanella/oh-my-opencode-slim/refs/heads/master/README.md
```

---

## For LLM Agents

If you're an LLM Agent helping set up oh-my-opencode-slim, follow these steps.

### Step 1: Check OpenCode Installation

```bash
opencode --version
```

If not installed, direct the user to https://opencode.ai/docs first.

### Step 2: Run the Installer

The installer generates OpenAI and OpenCode Go presets, with OpenAI active by default:

```bash
bunx oh-my-opencode-slim@latest install --no-tui --skills=yes
```

**Examples:**
```bash
# Interactive install (asks about tmux and skills)
bunx oh-my-opencode-slim@latest install

# Non-interactive with default skills
bunx oh-my-opencode-slim@latest install --no-tui --skills=yes

# Make the generated OpenCode Go preset active
bunx oh-my-opencode-slim@latest install --preset=opencode-go

# Non-interactive without skills
bunx oh-my-opencode-slim@latest install --no-tui --skills=no

# Force overwrite existing configuration
bunx oh-my-opencode-slim@latest install --reset
```

The installer automatically:
- Adds the plugin to `~/.config/opencode/opencode.json`
- Disables default OpenCode agents
- Enables OpenCode LSP integration when no explicit `lsp` setting exists
- Generates agent model mappings in `~/.config/opencode/oh-my-opencode-slim.json` (or `.jsonc`)

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
- They can easily assign **different models to different agents** by editing `~/.config/opencode/oh-my-opencode-slim.json` (or `.jsonc`).
- If they want to add a different provider later (OpenCode Go, Kimi, GitHub Copilot, ZAI), they can update this file manually. See **[Configuration Reference](configuration.md)** and the preset docs for examples.
- Read the generated `~/.config/opencode/oh-my-opencode-slim.json` (or `.jsonc`) file to understand the current configuration.

---

## Troubleshooting

### Installer Fails

Check the expected config format:
```bash
bunx oh-my-opencode-slim@latest install --help
```

Then manually create the config files at:
- `~/.config/opencode/oh-my-opencode-slim.json` (or `.jsonc`)

### Configuration Already Exists

If the installer reports that the configuration already exists, you have two options:

1. **Keep existing config**: The installer will skip the configuration step and continue with other operations (like adding the plugin or installing skills).

2. **Reset configuration**: Use `--reset` to overwrite:
   ```bash
   bunx oh-my-opencode-slim@latest install --reset
   ```
   A `.bak` backup file will be created automatically.

### Agents Not Responding

1. Check your authentication:
   ```bash
   opencode auth status
   ```

2. From your project root, verify your config file exists and is valid:
   ```bash
   bunx oh-my-opencode-slim@latest doctor
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
   cat ~/.config/opencode/oh-my-opencode-slim.json
   ```

### Editor Validation

Add a `$schema` reference to your config for autocomplete and inline validation:

```jsonc
{
  "$schema": "https://unpkg.com/oh-my-opencode-slim@latest/oh-my-opencode-slim.schema.json",
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

   Edit `~/.config/opencode/opencode.json` and remove `"oh-my-opencode-slim"` from the `plugin` array.

2. **Remove configuration files (optional)**:
   ```bash
   rm -f ~/.config/opencode/oh-my-opencode-slim.json
   rm -f ~/.config/opencode/oh-my-opencode-slim.json.bak
   ```

3. **Remove skills (optional)**:
   ```bash
   npx skills remove agent-browser
   rm -rf ~/.config/opencode/skills/simplify
   rm -rf ~/.config/opencode/skills/codemap
   ```
