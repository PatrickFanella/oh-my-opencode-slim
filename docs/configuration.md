# Configuration Reference

Complete reference for all configuration files and options in oh-my-opencode-slim.

---

## Config Files

| File | Purpose |
|------|---------|
| `~/.config/opencode/opencode.json` | OpenCode core settings (plugin registration, providers) |
| `~/.config/opencode/oh-my-opencode-slim.json` | Plugin settings — agents, multiplexer, MCPs, council |
| `~/.config/opencode/oh-my-opencode-slim.jsonc` | Same, but with JSONC (comments + trailing commas). Takes precedence over `.json` if both exist |
| `.opencode/oh-my-opencode-slim.json` | Project-local overrides (optional, checked first) |

> **💡 JSONC recommended:** Use the `.jsonc` extension to add comments and trailing commas. If both `.jsonc` and `.json` exist, `.jsonc` takes precedence.

If OmO-slim detects an invalid plugin config for the current project, the TUI
full-board sidebar shows a warning. The sidebar is collapsible: it defaults to
compact mode with CORE visible and custom groups collapsed. The sidebar is a
render-only slot, so collapse state is controlled through real OpenCode commands:
`/board-toggle`, `/board-full`, `/board-compact`, `/board-minimal`, and
`/board-off`. Run `oh-my-opencode-slim doctor` from your project root for full
diagnostics.

---

## OMOC as Distribution Layer

For a single-plugin setup, keep OpenCode host config minimal:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["oh-my-opencode-slim"]
}
```

Ownership split:

- OpenCode host config (`~/.config/opencode/opencode.json`) owns auth,
  provider registration, model refresh, and host runtime behavior.
- OMOC behavior belongs in
  `~/.config/opencode/oh-my-opencode-slim.jsonc` (agents, presets, MCP
  assignments, multiplexer/session behavior, council, bundled skill
  permissions).

DCP and quota systems are intentionally separate from OMOC. Keep them outside
OMOC config; the clone-based bootstrap writes their sidecar defaults when
`--with-dcp` or `--with-quota` is selected.

For this distribution path, prefer config-first behavior in
`~/.config/opencode/oh-my-opencode-slim.jsonc`, not new behavior environment
variables.

---

## Prompt Overriding

Customize agent prompts without modifying source code. Create markdown files in `~/.config/opencode/oh-my-opencode-slim/`:

| File | Effect |
|------|--------|
| `{agent}.md` | Replaces the agent's default prompt entirely |
| `{agent}_append.md` | Appends custom instructions to the default prompt |

When a `preset` is active, the plugin checks `~/.config/opencode/oh-my-opencode-slim/{preset}/` first, then falls back to the root directory.

**Example directory structure:**

```
~/.config/opencode/oh-my-opencode-slim/
  ├── best/
  │   ├── orchestrator.md        # Preset-specific override (used when preset=best)
  │   └── explorer_append.md
  ├── orchestrator.md            # Fallback override
  ├── orchestrator_append.md
  ├── explorer.md
  └── ...
```

Both `{agent}.md` and `{agent}_append.md` can coexist — the full replacement takes effect first, then the append. If neither exists, the built-in default prompt is used.

---

## JSONC Format

All config files support **JSONC** (JSON with Comments):

- Single-line comments (`//`)
- Multi-line comments (`/* */`)
- Trailing commas in arrays and objects

**Example:**

```jsonc
{
  // Active preset
  "preset": "openai",

  /* Agent model mappings */
  "presets": {
    "openai": {
      "oracle": { "model": "openai/gpt-5.5" },
      "explorer": { "model": "openai/gpt-5.4-mini" },
    },
  },

  // Optional: defaults to tmux/main-vertical/60 when omitted
  "multiplexer": { "layout": "tiled" },
}
```

---

## Package Composition

Use `packages` and `packageDefinitions` to keep reusable agent, preset, skill,
and MCP assignments in one config file while still emitting normal OmO-slim
`presets` and `agents` behavior at runtime.

Packages are resolved before the active `preset` is applied. Package contents are
lower precedence than direct root config for `presets` and `agents`: explicit
root values win over package-provided values. Global disables are additive:
`disabled_agents` and `disabled_mcps` from selected packages are merged with
root disables, so a package disable remains disabled.

```jsonc
{
  "packages": ["core", "board-engineering"],
  "preset": "dev",

  "packageDefinitions": {
    "core": {
      "presets": {
        "dev": {
          "orchestrator": { "skills": ["*"], "mcps": ["websearch", "grep_app"] },
          "oracle": { "skills": ["review-quality", "systematic-debugging"] },
          "librarian": { "mcps": ["websearch", "context7", "grep_app"] }
        }
      }
    },
    "board-engineering": {
      "extends": ["core"],
      "agents": {
        "backend-architect": {
          "model": "openai/gpt-5.5",
          "skills": ["architecture-patterns", "api-design-principles"],
          "mcps": [],
          "prompt": "You are Backend Architect...",
          "orchestratorPrompt": "@backend-architect\n- Role: Backend architecture advisor\n- Delegate when: API design, auth boundaries, service architecture\n- Output: recommendation, risks, next step"
        }
      }
    }
  },

  // Direct root overrides still win over package defaults.
  "agents": {
    "oracle": { "temperature": 0.2 }
  }
}
```

Package fields:

| Field | Type | Description |
|-------|------|-------------|
| `description` | string | Human-readable package note |
| `extends` | string[] | Parent packages resolved before this package |
| `presets` | object | Preset fragments using normal `presets.<name>.<agent>` shape |
| `agents` | object | Root agent fragments, including custom Board agents |
| `disabled_agents` | string[] | Agents disabled when the package is selected |
| `disabled_mcps` | string[] | Host MCPs marked disabled when the package is selected |
| `enabled_mcps` | string[] | Host MCPs force-enabled when the package is selected |
| `toolkits` | object | Toolkit enable flags merged like `board` (`pluginHealth`, `github`, `review`, `observe`, `caveman`, `rtk`) |
| `skillProfiles` | object | Focused global/per-agent skill profile fragments |

Missing packages and package cycles are non-fatal warnings. Direct root config is
kept so a typo does not erase existing agent settings.

## Skill Profiles

Use `skillProfiles` to define the global skill bundle and each agent's role
skills while keeping unrelated niche skills out of each prompt context. By
default, the installer omits `skillProfiles` so OMOC's code-owned built-in
agent defaults control availability. If an agent has an explicit `skills` array
in the active preset or `agents` override, that explicit array wins. If it does
not, OMOC resolves:

1. `skillProfiles.global` (or built-in global defaults if omitted)
2. `skillProfiles.agents.<agent>` (or built-in focused defaults if omitted)

```jsonc
{
  "skillProfiles": {
    "global": [
      "summarization",
      "systematic-debugging",
      "github-pro",
      "deep-research",
      "review-quality",
      "writing-plans",
      "session-handoff"
    ],
    "agents": {
      "orchestrator": ["codemap", "clonedeps", "cartography"],
      "oracle": ["improve-codebase-architecture", "security-threat-model"],
      "librarian": ["web-search", "openai-docs"],
      "designer": ["frontend-design", "react-pro", "agent-browser"],
      "fixer": ["tdd", "typescript-pro", "python-tooling-patterns"]
    }
  }
}
```

Keep OpenCode host config minimal. OMOC materializes only the curated union of
bundled skills referenced by enabled agents into a managed skill directory at
startup, so you do not need broad external host paths like
`"skills": { "paths": ["~/.agents/skills"] }`. The installer no longer
bulk-copies OMOC's whole bundled skill catalog and bootstrap removes the legacy
`~/.agents/skills` path. Assign availability through `skillProfiles` or
explicit agent `skills` arrays; the plugin's skill permissions and prompt
filtering enforce those code-owned allow lists per agent.

### Runtime Preset Switching

Presets can also be switched at runtime without restarting using the `/preset` command. See [Preset Switching](preset-switching.md) for details.

### Toolkit Gates

Toolkit flags are opt-in and default to `false`:

```jsonc
{
  "toolkits": {
    "pluginHealth": true,
    "github": true,
    "review": true,
    "observe": true,
    "caveman": true,
    "rtk": true
  }
}
```

## Full Option Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `preset` | string | — | Active preset name (e.g. `"openai"`, `"best"`) |
| `presets` | object | — | Named preset configurations |
| `presets.<name>.<agent>.model` | string | — | Model ID in `provider/model` format |
| `presets.<name>.<agent>.temperature` | number | — | Temperature (0–2) |
| `presets.<name>.<agent>.variant` | string | — | Reasoning effort: `"low"`, `"medium"`, `"high"` |
| `presets.<name>.<agent>.displayName` | string | — | Custom user-facing alias for the agent (e.g. `"advisor"` for `oracle`) |
| `presets.<name>.<agent>.skills` | string[] | — | Skills the agent can use (`"*"`, `"!item"`, explicit list) |
| `presets.<name>.<agent>.mcps` | string[] | — | MCPs the agent can use (`"*"`, `"!item"`, explicit list) |
| `presets.<name>.<agent>.options` | object | — | Provider-specific model options passed to the AI SDK (e.g., `textVerbosity`, `thinking` budget) |
| `packages` | string[] | — | Package names to compose before preset resolution |
| `packageDefinitions.<name>` | object | — | Reusable package fragments for presets, agents, and global disables |
| `skillProfiles.global` | string[] | focused defaults | Skills added to every agent when no explicit `skills` array overrides them |
| `skillProfiles.agents.<agent>` | string[] | focused defaults | Per-agent skill additions used with `skillProfiles.global` |
| `toolkits.pluginHealth` | boolean | `false` | Enable integrated plugin health tools and command templates |
| `toolkits.github` | boolean | `false` | Enable integrated GitHub toolkit |
| `toolkits.review` | boolean | `false` | Enable integrated review toolkit |
| `toolkits.observe` | boolean | `false` | Enable integrated observe toolkit |
| `toolkits.caveman` | boolean | `false` | Enable integrated caveman toolkit |
| `toolkits.rtk` | boolean | `false` | Enable integrated RTK toolkit |
| `agents.<customAgent>.model` | string\|array | — | Required for custom agents inferred from unknown `agents` keys |
| `agents.<customAgent>.prompt` | string | — | Full execution prompt for a custom agent |
| `agents.<customAgent>.orchestratorPrompt` | string | — | Compact `@agent` block injected into the orchestrator prompt's Board Consultants section; must start with `@<agent-name>` or its `displayName` |
| `agents.<agent>.displayName` | string | — | Custom user-facing alias for the agent in the active config |
| `disabled_agents` | string[] | `["observer"]` | Agent names to disable globally. Set to `[]` to enable Observer; this is global, not per-preset |
| `autoUpdate` | boolean | `true` | Automatically install plugin updates in the background; set to `false` for notification-only mode |
| `multiplexer.type` | string | `"tmux"` | Multiplexer mode: `auto`, `tmux`, `zellij`, or `none` |
| `multiplexer.layout` | string | `"main-vertical"` | Layout preset: `main-vertical`, `main-horizontal`, `tiled`, `even-horizontal`, `even-vertical` |
| `multiplexer.main_pane_size` | number | `60` | Main pane size as percentage (20–80) |
| `divoom.enabled` | boolean | `false` | Enable Divoom Bluetooth display status GIFs for plugin load and delegated agent calls |
| `divoom.python` | string | Divoom MiniToo bundled Python | Python executable used to run Divoom MiniToo's `divoom_send.py` helper |
| `divoom.script` | string | Divoom MiniToo `divoom_send.py` | Divoom sender script path |
| `divoom.size` | integer | `128` | Output GIF size passed to `divoom_send.py` |
| `divoom.fps` | integer | `8` | Output GIF FPS passed to `divoom_send.py` |
| `divoom.speed` | integer | `125` | Playback speed passed to `divoom_send.py` |
| `divoom.maxFrames` | integer | `24` | Maximum frames passed to `divoom_send.py` |
| `divoom.posterizeBits` | integer | `3` | Posterization bits passed to `divoom_send.py` |
| `divoom.gifs.<agent>` | string | bundled GIF | Optional per-agent GIF filename or absolute path override |
| `tmux.enabled` | boolean | `false` | Legacy alias. When present, `true` maps to `multiplexer.type = "tmux"`; `false` maps to `multiplexer.type = "none"` |
| `tmux.layout` | string | `"main-vertical"` | Legacy alias for `multiplexer.layout` |
| `tmux.main_pane_size` | number | `60` | Legacy alias for `multiplexer.main_pane_size` |
| `sessionManager.maxSessionsPerAgent` | integer | `2` | Maximum remembered resumable child sessions per specialist type in the current orchestrator session (1–10). See [Session Management](session-management.md) |
| `sessionManager.readContextMinLines` | integer | `10` | Minimum number of lines read from a file before it appears in resumable-session context (0–1000) |
| `sessionManager.readContextMaxFiles` | integer | `8` | Maximum number of recent read-context files shown per remembered child session (0–50) |
| `disabled_mcps` | string[] | `[]` | MCP server IDs to disable globally |
| `enabled_mcps` | string[] | `[]` | MCP server IDs to force-enable if host config or a package disabled them; built-ins are enabled by default |
| `fallback.enabled` | boolean | `false` | Enable model failover on timeout/error |
| `fallback.timeoutMs` | number | `15000` | Time before aborting and trying next model |
| `fallback.retryDelayMs` | number | `500` | Delay between retry attempts |
| `fallback.chains.<agent>` | string[] | — | Ordered fallback model IDs for an agent |
| `fallback.retry_on_empty` | boolean | `true` | Treat silent empty provider responses (0 tokens) as failures and retry. Set `false` to accept empty responses |
| `council.presets` | object | — | **Required if using council.** Named councillor presets |
| `council.presets.<name>.<councillor>.model` | string | — | Councillor model |
| `council.presets.<name>.<councillor>.variant` | string | — | Councillor variant |
| `council.presets.<name>.<councillor>.prompt` | string | — | Optional role guidance for the councillor |
| `council.default_preset` | string | `"default"` | Default preset when none is specified |
| `council.timeout` | number | `180000` | Per-councillor timeout (ms) |
| `council.councillor_execution_mode` | string | `"parallel"` | Run councillors in `parallel` or `serial`; use `serial` for single-model setups |
| `council.councillor_retries` | number | `3` | Max retries per councillor on empty provider response (0–5) |
| `todoContinuation.maxContinuations` | integer | `5` | Max consecutive auto-continuations before stopping (1–50) |
| `todoContinuation.cooldownMs` | integer | `3000` | Delay in ms before auto-continuing — gives user time to abort (0–30000) |
| `todoContinuation.autoEnable` | boolean | `false` | Automatically enable auto-continue when session has enough todos |
| `todoContinuation.autoEnableThreshold` | integer | `4` | Number of todos that triggers auto-enable (only used when `autoEnable` is true, 1–50) |
| `interview.maxQuestions` | integer | `2` | Max questions per interview round (1–10) |
| `interview.outputFolder` | string | `"interview"` | Directory where interview markdown files are written (relative to project root) |
| `interview.autoOpenBrowser` | boolean | `true` | Automatically open the interview UI in your default browser during interactive runs; suppressed in tests and CI |
| `interview.port` | integer | `0` | Interview server port (0–65535). `0` = OS-assigned random port (per-session mode). Any value > 0 enables [dashboard mode](interview.md#dashboard-mode) |
| `interview.dashboard` | boolean | `false` | Enable [dashboard mode](interview.md#dashboard-mode) on the default port (43211). Setting `port` > 0 also enables dashboard mode. If both are set, `port` takes precedence |

## Provider Switching

Use `bunx oh-my-opencode-slim@latest switch-agents <provider>` to move the
whole board to one provider. Supported providers are `github-copilot`, `openai`,
`anthropic`, and `gemini`.

The command updates two config surfaces:

- Custom BUILD, OPS, GROWTH, and MYTH JSON agents under
  `~/.config/opencode/oh-my-opencode-slim/agents/`
- The active OMOC config preset under
  `~/.config/opencode/oh-my-opencode-slim.json`

The generated preset is named `board-<provider>` and covers built-in
specialists such as Explorer, Oracle, Librarian, Designer, Fixer, Observer,
Council, and Orchestrator. Restart OpenCode after switching because plugin
config is loaded at startup.

### Agent definition files

OMOC has a central bundled agent registry under `src/agents/definitions/`.
Each core agent has one JSON manifest for default model, description,
temperature, skills, MCPs, enabled/protected flags, and the compact routing
prompt shown to Orchestrator.

You can add local custom agents without editing the main config by placing JSON
files in:

```text
~/.config/opencode/oh-my-opencode-slim/agents/*.json
```

Example:

```json
{
  "name": "researcher",
  "model": "openai/gpt-5.4-mini",
  "prompt": "You are a custom research specialist.",
  "orchestratorPrompt": "@researcher\n- Role: JSON-defined research agent",
  "skills": ["web-search"],
  "mcps": ["websearch"]
}
```

Fields mirror `agents.<name>` config: `model`, `variant`, `temperature`,
`skills`, `mcps`, `prompt`, `orchestratorPrompt`, `options`, and
`displayName`. Main `oh-my-opencode-slim.json` values win if both define the
same agent. Built-in protected agents such as `orchestrator` and `councillor`
still always exist.

### Council configuration note

- The **Council agent model** is configured like any other agent, for example in
  `presets.<name>.council.model`.
- The **councillor models** are configured separately under
  `council.presets.<name>.<councillor>.model`.
- Deprecated `council.master*` fields should not be used in new configs.

### Manual Update Mode

Set `autoUpdate` to `false` if you want update notifications without automatic
`bun install` runs.

```jsonc
{
  "autoUpdate": false
}
```

With `autoUpdate` set to `false`, this becomes notification-only mode: you'll
see that a new version is available, but the plugin won't install it
automatically.

> Pinned plugin entries in `opencode.json` (for example
> `"oh-my-opencode-slim@1.0.1"`) are the true version lock. Those stay pinned
> regardless of `autoUpdate`.

### Divoom Display Integration

Divoom integration is disabled by default. Install and start the Divoom MiniToo
macOS daemon from
[`divoom-minitoo-osx`](https://github.com/alvinunreal/divoom-minitoo-osx)
first, then enable this plugin integration. See the full
**[Divoom guide](divoom.md)** for setup, daemon startup, and troubleshooting.

When enabled, the plugin sends bundled GIFs to the Divoom MiniToo app's bundled
CLI:

- plugin load / waiting for user input: `intro.gif`
- orchestrator busy: `orchestrator.gif`
- first active delegated agent: that agent's GIF
- parallel delegated agents: the first agent keeps the display
- all delegated agents complete while orchestrator keeps working: `orchestrator.gif`
- orchestrator idle again: `intro.gif`

```jsonc
{
  "divoom": {
    "enabled": true
  }
}
```

For a one-off run without editing config:

```bash
OH_MY_OPENCODE_SLIM_DIVOOM=1 opencode
```

If `divoom.enabled` is explicitly set in config, the config value wins over the
environment variable.

The defaults target the macOS Divoom MiniToo app bundle:

```jsonc
{
  "divoom": {
    "enabled": true,
    "python": "/Applications/Divoom MiniToo.app/Contents/Resources/.venv/bin/python",
    "script": "/Applications/Divoom MiniToo.app/Contents/Resources/tools/divoom_send.py",
    "size": 128,
    "fps": 8,
    "speed": 125,
    "maxFrames": 24,
    "posterizeBits": 3
  }
}
```

To override a GIF, use either a bundled filename or an absolute path:

```jsonc
{
  "divoom": {
    "enabled": true,
    "gifs": {
      "oracle": "/Users/me/Pictures/oracle.gif"
    }
  }
}
```

### Session Management

Session management is enabled by default and does not need to be present in the
starter config. Add `sessionManager` only if you want to tune how many resumable
child-agent sessions are remembered or how much read context is shown. See
[Session Management](session-management.md) for the concept, defaults, and
examples.

### Agent Display Names

Use `displayName` to give an agent a user-facing alias while keeping the
internal agent name unchanged.

```jsonc
{
  "agents": {
    "oracle": {
      "displayName": "advisor"
    },
    "explorer": {
      "displayName": "researcher"
    }
  }
}
```

With this config, users can refer to `@advisor` and `@researcher`, while the
plugin still routes them to `oracle` and `explorer` internally.

Notes:

- `displayName` works in both top-level `agents` overrides and inside `presets`
- `@` prefixes and surrounding whitespace are normalized automatically
- Display names must be unique
- Display names cannot conflict with internal agent names like `oracle` or `explorer`

### Custom Agents

Unknown keys under `agents` are treated as custom subagents. A custom agent needs
its own `model`, a normal `prompt`, and optionally an `orchestratorPrompt` that
teaches the orchestrator exactly when to delegate to it. Keep this block compact:
it is injected into the orchestrator prompt's Board Consultants section.

```jsonc
{
  "agents": {
    "janitor": {
      "model": "github-copilot/gpt-5.5",
      "prompt": "You are Janitor. Audit codebase entropy, dead code, docs drift, naming inconsistencies, and unnecessary complexity. Prefer analysis and plans over direct edits.",
      "orchestratorPrompt": "@janitor\n- Role: Maintenance specialist for codebase cleanup and entropy reduction\n- Delegate when: cleanup/technical-debt review • dead code or docs drift suspected\n- Don't delegate when: feature implementation • urgent debugging • UI/UX work\n- Output: findings, risk, recommended next step"
    }
  }
}
```

Notes:

- Custom agent names must be safe identifiers such as `janitor` or `security-reviewer`
- Custom agents without a `model` are skipped with a warning
- Disabled custom agents are not registered or injected into the orchestrator prompt
- `orchestratorPrompt` must start with the custom agent name (for example `@janitor`) or its configured `displayName`
- Board consultant blocks should describe routing, not duplicate the full agent execution prompt
