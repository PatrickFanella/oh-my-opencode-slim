<div align="center">
  <img src="img/team.jpeg" alt="Pantheon agents" style="border-radius: 10px;">
  <p><i>Seven divine beings emerged from the dawn of code, each an immortal master of their craft await your command to forge order from chaos and build what was once thought impossible.</i></p>
  <p><b>Open Multi Agent Suite</b> · Mix any models · Auto delegate tasks</p>

  <p><sub>by <b>Boring Dystopia Development</b></sub></p>
  <p>
    <a href="https://boringdystopia.ai/"><img src="https://img.shields.io/badge/boringdystopia.ai-111111?style=for-the-badge&logo=vercel&logoColor=white" alt="boringdystopia.ai"></a>&nbsp;
    <a href="https://t.me/boringdystopiadevelopment"><img src="https://img.shields.io/badge/Telegram-Join%20channel-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram Join channel"></a>&nbsp;
  </p>
</div>

---

## What's This Plugin

blacktower is an agent orchestration plugin for OpenCode. It includes a built-in team of specialized agents that can scout a codebase, look up fresh documentation, review architecture, handle UI work, and execute well-scoped implementation tasks under one orchestrator.

The main idea is simple: instead of forcing one model to do everything, the plugin routes each part of the job to the agent best suited for it, balancing **quality, speed and cost**.

To explore the agents themselves, see **[Meet the Pantheon](#meet-the-pantheon)**. For the full feature set, see **[Features & Workflows](#features-and-workflows)** below.
For planned improvements, see **[Future Plans](docs/future-plans.md)**.

### Quick Start

Copy and paste this prompt to your LLM agent (Claude Code, AmpCode, Cursor, etc.):


```
Install and configure blacktower: https://raw.githubusercontent.com/blacktower/blacktower/refs/heads/master/README.md
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

`setup` is the recommended full bootstrap path. Advanced bootstrap flags are
still available when you need them:

```bash
bun run src/cli/index.ts bootstrap --with-dcp --with-quota --with-rtk
```


### Manual Installation

```bash
bunx blacktower@latest install
```

For a full clone-based bootstrap that backs up the entire OpenCode config
directory, resets `~/.config/opencode`, installs or updates OpenCode, builds
this repo, configures Blacktower, installs scheduled-task support by default,
optionally adds DCP/quota, and installs the tmux-aware `opencode`/`oc`/`occ`
helpers:

```bash
git clone https://github.com/blacktower/blacktower.git
cd blacktower
bun run setup
```

Bootstrap also adds quota to `tui.json(c)` when `--with-quota` is selected so
the quota panels load in the TUI. It also applies trusted host defaults in
`opencode.json(c)`: it sets
`permission: "allow"`, OpenCode compaction `{ auto: false, prune: true,
reserved: 10000 }`, and removes the legacy `~/.agents/skills` path. With
`--with-dcp` or `--with-quota`, it also writes the matching
`dcp.jsonc` and `opencode-quota/quota-toast.json` sidecar defaults.
Bootstrap installs `opencode-tasks` daemon/commands by default and writes
disabled recurring-task examples under `~/.config/opencode/task-templates/`.
Use `--no-scheduled-tasks` to skip that integration.

Use `bun run control-center` after scheduler setup to open a read-only OpenTUI
dashboard for scheduled tasks, recent runs, scheduler health, and task reports.
For scripts or support captures, `bun run control-center -- --no-tui` prints the
same snapshot as plain text and `bun run control-center -- --json` prints the
backend snapshot as JSON.

Use `bun run control-center:web` to serve the same read-only dashboard through a
local Vite/React/Tailwind web UI on `127.0.0.1`. During development, run
`bun run control-center:web:api` in one terminal and
`bun run control-center:web:dev` in another.
Binding the web server to a non-loopback host requires `--allow-network` because
the read-only snapshot can include task prompts, cwd paths, report content,
scheduler logs, and session IDs.

The installer also registers the Blacktower TUI sidebar plugin in OpenCode's
`tui.json`, which renders a full-board sidebar: core agents, custom SUBCULT
board handles, config health, MCP/LSP/plugin counts, todos, and diff activity.
The sidebar starts compact with CORE visible and custom groups collapsed. The
sidebar itself is render-only; use the real OpenCode commands `/board-toggle`,
`/board-full`, `/board-compact`, `/board-minimal`, or `/board-off` to change
density.
On the home screen, the compact Blacktower board card is right-aligned in the bottom
slot so it stays out of the main prompt area.
It also warms OpenCode's plugin cache so bunx installs keep loading even after
temporary directories are cleaned up. For manual setups, add
`blacktower` to the `plugin` array in `opencode.json` and
`blacktower/tui` to the `plugin` array in `tui.json`. If the sidebar
is visible but the Blacktower panel is missing, open the TUI plugin manager and
enable the `blacktower:tui` plugin module.

### Getting Started

The default installer writes a hybrid `openai` preset: mostly `openai/` models,
with a few OpenRouter models for design/creative roles where model variety is
useful. Passing `--preset=<name>` writes only that generated preset. It writes
built-in
MCP definitions to `opencode.json(c)` so OpenCode's native MCP auth flow owns
remote authentication. It also materializes the BUILD, OPS, GROWTH, PRODUCT,
and MYTH
custom board agent JSON files into
`~/.config/opencode/blacktower/agents/` without overwriting existing
files. It does **not** copy the bundled skill catalog or depend on
`~/.agents/skills`; the plugin materializes only the curated union of
code-owned skills referenced by enabled agents into a managed skill directory,
then applies per-agent skill permissions as the second gate.

To generate OpenCode Go instead, run
`bunx blacktower@latest install --preset=opencode-go`.

To switch every board agent later, including built-in specialists such as
Explorer, Oracle, Librarian, Designer, Fixer, Observer, Council, and
Orchestrator, run `bunx blacktower@latest switch-agents <provider>`.
This refreshes custom board JSON files and writes an active `board-<provider>`
preset to `~/.config/opencode/blacktower.json`. Restart OpenCode after
switching.

Then:

1. **Log in to the providers you want to use if you haven't already**:

   ```bash
   opencode auth login
   ```
2. **Refresh and list the models OpenCode can see**:

   ```bash
   opencode models --refresh
   ```
3. **Open your plugin config** at `~/.config/opencode/blacktower.json`

4. **Update the models you want for each agent**

> [!TIP]
> It's **recommended** to understand how automatic delegation works. The **[Orchestrator prompt](https://github.com/blacktower/blacktower/blob/master/src/agents/orchestrator.ts#L28)** contains the delegation rules, specialist routing logic, and the thresholds for when the main agent should hand work off to subagents. You can alway delegate manually by calling a subagent via: `@agentName <task>`

The default generated configuration is mostly OpenAI, with OpenRouter only for
the Designer role:

```jsonc
{
  "$schema": "https://unpkg.com/blacktower@latest/blacktower.schema.json",
  "preset": "openai",
  "presets": {
    "openai": {
      "orchestrator": { "model": "openai/gpt-5.5", "mcps": ["websearch", "grep_app"] },
      "oracle": { "model": "openai/gpt-5.5", "variant": "high", "mcps": [] },
      "council": { "model": "openai/gpt-5.5", "variant": "high", "mcps": [] },
      "librarian": { "model": "openai/gpt-5.4-mini", "variant": "low", "mcps": ["websearch", "context7", "grep_app"] },
      "explorer": { "model": "openai/gpt-5.4-mini", "variant": "low", "mcps": [] },
      "designer": { "model": "openrouter/minimax/minimax-m2.5", "variant": "medium", "mcps": [] },
      "fixer": { "model": "openai/gpt-5.4-mini", "variant": "low", "mcps": [] },
      "observer": { "model": "openai/gpt-5.4-mini", "mcps": [] }
    }
  }
}
```

Passing `--preset=opencode-go` writes only that active generated preset.
Skill profiles are omitted by default so the code-owned built-in agent defaults
control skill availability. Use `--skills=no` if you want the generated config
to explicitly deny all skills.

The `openai` board provider is also mostly OpenAI. Only a few
design/creative/product-advisory roles use MiniMax M2.5 through OpenRouter.

With `--preset=openai`, the installer writes the same hybrid core preset shown
above.

### For Alternative Providers

To use custom providers or a mixed-provider setup, use **[Configuration](docs/configuration.md)** for the full reference. If you want a ready-made starting point, check the **[Author's Preset](docs/authors-preset.md)** and **[$30 Preset](docs/thirty-dollars-preset.md)** - the `$30` preset is the best cheap setup.

The configuration guide also covers custom subagents via `agents.<name>`, where
you can define both a normal `prompt` and an `orchestratorPrompt` block for
delegation.

For model suggestions, see the **Recommended Models** listed under each agent below.

### ✅ Verify Your Setup

After installation and authentication, verify all agents are configured and responding:

```bash
opencode
```

Then run:

```
ping all agents
```

<div align="center">
  <img src="img/ping.png" alt="Ping all agents" width="600">
  <p><i>Confirmation that all configured agents are online and ready.</i></p>
</div>

If any agent fails to respond, check your provider authentication and config file.

---

<a id="meet-the-pantheon"></a>

## 🏛️ Meet the Pantheon

### 01. Orchestrator: The Embodiment Of Order

<table>
  <tr>
    <td width="30%" align="center" valign="top">
      <img src="img/orchestrator.png" width="240" style="border-radius: 10px;">
      <br><sub><i>Forged in the void of complexity.</i></sub>
    </td>
    <td width="70%" valign="top">
      The Orchestrator was born when the first codebase collapsed under its own complexity. Neither god nor mortal would claim responsibility - so The Orchestrator emerged from the void, forging order from chaos. It determines the optimal path to any goal, balancing speed, quality, and cost. It guides the team, summoning the right specialist for each task and delegating to achieve the best possible outcome.
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Role:</b> <code>Master delegator and strategic coordinator</code>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Prompt:</b> <a href="src/agents/orchestrator.ts"><code>orchestrator.ts</code></a>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Default Model:</b> <code>openai/gpt-5.5</code>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Recommended Models:</b> <code>openai/gpt-5.5</code> <code>anthropic/claude-opus-4.6</code>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Model Guidance:</b> Choose your default, strongest all-around coding model. Orchestrator is both the main coding agent and the delegator, so it needs strong implementation ability, good judgment, and reliable instruction-following.
    </td>
  </tr>
</table>

---

### 02. Explorer: The Eternal Wanderer

<table>
  <tr>
    <td width="30%" align="center" valign="top">
      <img src="img/explorer.png" width="240" style="border-radius: 10px;">
      <br><sub><i>The wind that carries knowledge.</i></sub>
    </td>
    <td width="70%" valign="top">
      The Explorer is an immortal wanderer who has traversed the corridors of a million codebases since the dawn of programming. Cursed with the gift of eternal curiosity, they cannot rest until every file is known, every pattern understood, every secret revealed. Legends say they once searched the entire internet in a single heartbeat. They are the wind that carries knowledge, the eyes that see all, the spirit that never sleeps.
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Role:</b> <code>Codebase reconnaissance</code>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Prompt:</b> <a href="src/agents/explorer.ts"><code>explorer.ts</code></a>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Default Model:</b> <code>openai/gpt-5.4-mini</code>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Recommended Models:</b> <code>cerebras/zai-glm-4.7</code> <code>fireworks-ai/accounts/fireworks/routers/kimi-k2p5-turbo</code> <code>openai/gpt-5.4-mini</code>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Model Guidance:</b> Choose a fast, low-cost model. Explorer handles broad scouting work, so speed and efficiency usually matter more than using your strongest reasoning model.
    </td>
  </tr>
</table>

---

### 03. Oracle: The Guardian of Paths

<table>
  <tr>
    <td width="30%" align="center" valign="top">
      <img src="img/oracle.png" width="240" style="border-radius: 10px;">
      <br><sub><i>The voice at the crossroads.</i></sub>
    </td>
    <td width="70%" valign="top">
      The Oracle stands at the crossroads of every architectural decision. They have walked every road, seen every destination, know every trap that lies ahead. When you stand at the precipice of a major refactor, they are the voice that whispers which way leads to ruin and which way leads to glory. They don't choose for you - they illuminate the path so you can choose wisely.
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Role:</b> <code>Strategic advisor and debugger of last resort</code>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Prompt:</b> <a href="src/agents/oracle.ts"><code>oracle.ts</code></a>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Default Model:</b> <code>openai/gpt-5.5 (high)</code>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Recommended Models:</b> <code>openai/gpt-5.5 (high)</code> <code>google/gemini-3.1-pro-preview (high)</code>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Model Guidance:</b> Choose your strongest high-reasoning model for architecture, hard debugging, trade-offs, and code review.
    </td>
  </tr>
</table>

---

### 04. Council: The Chorus of Minds

> [!NOTE]
> **Why doesn't Orchestrator auto-call Council more often?** This is intentional. Council runs multiple models at once, so automatic delegation is kept strict because it is usually the highest-cost path in the system. In practice, Council is meant to be used manually when you want it, for example: <code>@council compare these two architectures</code>.

<table>
  <tr>
    <td width="30%" align="center" valign="top">
      <img src="img/council.png" width="240" style="border-radius: 10px;">
      <br><sub><i>Many minds, one verdict.</i></sub>
    </td>
    <td width="70%" valign="top">
      The Council is not a lone being but a chamber of minds summoned when one answer is not enough. It sends your question to multiple models in parallel, gathers their competing judgments, and then the Council agent itself distills the strongest ideas into a single verdict. Where a solitary agent may miss a path, the Council cross-examines possibility itself.
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Role:</b> <code>Multi-LLM consensus and synthesis</code>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Prompt:</b> <a href="src/agents/council.ts"><code>council.ts</code></a>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Guide:</b> <a href="docs/council.md"><code>docs/council.md</code></a>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Default Setup:</b> <code>Config-driven</code> — councillors come from <code>council.presets</code> and the Council agent model comes from your normal <code>council</code> agent config
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Recommended Setup:</b> <code>Strong Council model</code> + <code>diverse councillors</code> across providers
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Model Guidance:</b> Use a strong synthesis model for the Council agent and diverse models as councillors. The value of Council comes from comparing different model perspectives, not just picking the single strongest model everywhere.
    </td>
  </tr>
</table>

---

### 05. Librarian: The Weaver of Knowledge

<table>
  <tr>
    <td width="30%" align="center" valign="top">
      <img src="img/librarian.png" width="240" style="border-radius: 10px;">
      <br><sub><i>The weaver of understanding.</i></sub>
    </td>
    <td width="70%" valign="top">
      The Librarian was forged when humanity realized that no single mind could hold all knowledge. They are the weaver who connects disparate threads of information into a tapestry of understanding. They traverse the infinite library of human knowledge, gathering insights from every corner and binding them into answers that transcend mere facts. What they return is not information - it's understanding.
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Role:</b> <code>External knowledge retrieval</code>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Prompt:</b> <a href="src/agents/librarian.ts"><code>librarian.ts</code></a>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Default Model:</b> <code>openai/gpt-5.4-mini</code>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Recommended Models:</b> <code>cerebras/zai-glm-4.7</code> <code>fireworks-ai/accounts/fireworks/routers/kimi-k2p5-turbo</code> <code>openai/gpt-5.4-mini</code>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Model Guidance:</b> Choose a fast, low-cost model. Librarian handles research and documentation lookups, so speed and efficiency usually matter more than using your strongest reasoning model.
    </td>
  </tr>
</table>

---

### 06. Designer: The Guardian of Aesthetics

<table>
  <tr>
    <td width="30%" align="center" valign="top">
      <img src="img/designer.png" width="240" style="border-radius: 10px;">
      <br><sub><i>Beauty is essential.</i></sub>
    </td>
    <td width="70%" valign="top">
      The Designer is an immortal guardian of beauty in a world that often forgets it matters. They have seen a million interfaces rise and fall, and they remember which ones were remembered and which were forgotten. They carry the sacred duty to ensure that every pixel serves a purpose, every animation tells a story, every interaction delights. Beauty is not optional - it's essential.
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Role:</b> <code>UI/UX implementation and visual excellence</code>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Prompt:</b> <a href="src/agents/designer.ts"><code>designer.ts</code></a>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Default Model:</b> <code>openai/gpt-5.4-mini</code>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Recommended Models:</b> <code>google/gemini-3.1-pro-preview</code> <code>kimi-for-coding/k2p5</code> 
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Model Guidance:</b> Choose a model that is strong at UI/UX judgment, frontend implementation, and visual polish.
    </td>
  </tr>
</table>

---

### 07. Fixer: The Last Builder

<table>
  <tr>
    <td width="30%" align="center" valign="top">
      <img src="img/fixer.png" width="240" style="border-radius: 10px;">
      <br><sub><i>The final step between vision and reality.</i></sub>
    </td>
    <td width="70%" valign="top">
      The Fixer is the last of a lineage of builders who once constructed the foundations of the digital world. When the age of planning and debating began, they remained - the ones who actually build. They carry the ancient knowledge of how to turn thought into thing, how to transform specification into implementation. They are the final step between vision and reality.
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Role:</b> <code>Fast implementation specialist</code>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Prompt:</b> <a href="src/agents/fixer.ts"><code>fixer.ts</code></a>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Default Model:</b> <code>openai/gpt-5.4-mini</code>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Recommended Models:</b> <code>cerebras/zai-glm-4.7</code> <code>fireworks-ai/accounts/fireworks/routers/kimi-k2p5-turbo</code> <code>openai/gpt-5.4-mini</code>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Model Guidance:</b> Choose a fast, reliable coding model for routine, scoped implementation work. Fixer usually receives a concrete plan or bounded instructions from Orchestrator, making it a good place for efficient execution tasks such as tests, test updates, and straightforward code changes.
    </td>
  </tr>
</table>

---

## Optional Agents

### Observer: The Silent Witness

> [!NOTE]
> **Why a separate agent?** If your Orchestrator model is not multimodal, enable Observer to handle images, screenshots, PDFs, and other visual files. Observer is disabled by default and gives the Orchestrator a dedicated multimodal reader without forcing you to change your main reasoning model. Set `disabled_agents: []` and an `observer` model in your configuration. The bundled `opencode-go` install preset does this automatically because its GLM Orchestrator is not multimodal.

<table>
  <tr>
    <td width="30%" align="center" valign="top">
      <img src="img/observer.jpg" width="240" style="border-radius: 10px;">
      <br><sub><i>The eye that reads what others cannot.</i></sub>
    </td>
    <td width="70%" valign="top">

**Read-only visual analysis** — interprets images, screenshots, PDFs, and diagrams. Returns structured observations to the orchestrator without loading raw file bytes into the main context window.

- Images, screenshots, diagrams → `read` tool (native image support)
- PDFs and binary documents → `read` tool (text + structure extraction)
- **Disabled by default** — enable with `"disabled_agents": []` and configure a vision-capable model; installing with `--preset=opencode-go` enables it with `opencode-go/kimi-k2.6`

    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Prompt:</b> <a href="src/agents/observer.ts"><code>observer.ts</code></a>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Default Model:</b> <code>openai/gpt-5.4-mini</code> — <i>configure a vision-capable model to enable</i>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <b>Model Guidance:</b> Choose a vision-capable model if you want the agent to read screenshots, images, PDFs, and other visual files.
    </td>
  </tr>
</table>

---

## 📚 Documentation

Use this section as a map: start with installation, then jump to features, configuration, or example presets depending on what you need.

### 🚀 Start Here

| Doc | What it covers |
|-----|----------------|
| **[Installation Guide](docs/installation.md)** | Install the plugin, use CLI flags, reset config, and troubleshoot setup |

<a id="features-and-workflows"></a>

### ✨ Features & Workflows

| Doc | What it covers |
|-----|----------------|
| **[Council](docs/council.md)** | Run multiple models in parallel and synthesize a single answer with `@council` |
| **[Integrated Toolkits](docs/toolkits.md)** | Config-gated GitHub, review, observe, caveman, plugin health, and rtk toolkits |
| **[Multiplexer Integration](docs/multiplexer-integration.md)** | Watch agents work live in Tmux or Zellij panes |
| **[Background Orchestration](docs/background-orchestration.md)** | Track delegated task sessions and cancel stuck workers with `cancel_task` |
| **[Session Management](docs/session-management.md)** | Reuse recent child-agent sessions with short aliases instead of starting over |
| **[Todo Continuation](docs/todo-continuation.md)** | Auto-continue orchestrator sessions with cooldowns and safety checks |
| **[Preset Switching](docs/preset-switching.md)** | Switch agent model presets at runtime with `/preset` |
| **[Switch Provider Guide](docs/switch-provider-guide.md)** | Data guide for `switch-provider` / `switch-agents` provider assignment |
| **[Subtask](docs/subtask.md)** | Run a bounded child worker with `/subtask` and return a structured summary to the main session |
| **[Codemap](docs/codemap.md)** | Generate hierarchical codemaps to understand large codebases faster |
| **[Clonedeps](docs/clonedeps.md)** | Clone selected dependency source into an ignored local workspace for inspection |
| **[Interview](docs/interview.md)** | Turn rough ideas into a structured markdown spec through a browser-based Q&A flow |

### ⚙️ Config & Reference

| Doc | What it covers |
|-----|----------------|
| **[Configuration](docs/configuration.md)** | Config file locations, JSONC support, prompt overrides, and full option reference |
| **[Custom Agents](docs/custom-agents.md)** | JSON custom-agent definitions, CLI validation, recipes, and troubleshooting |
| **[Board Runtime](docs/board-runtime.md)** | First-class Board routing, delegation policy, and future orchestration runtime |
| **[Blacktower Distribution Layer](docs/blacktower-distribution-layer.md)** | Use Blacktower as the main plugin layer while OpenCode keeps host runtime duties and DCP/quota stay separate |
| **[Maintainer Guide](docs/maintainers.md)** | Issue triage rules, label meanings, support routing, and repo maintenance workflow |
| **[Skills](docs/skills.md)** | Built-in and recommended skills such as `simplify`, `agent-browser`, `codemap`, and `clonedeps` |
| **[MCPs](docs/mcps.md)** | `websearch`, `context7`, `grep_app`, and how MCP permissions work per agent |
| **[Tools](docs/tools.md)** | Built-in tool capabilities like `webfetch`, LSP tools, code search, and formatters |

### 💡 Presets

| Doc | What it covers |
|-----|----------------|
| **[Author's Preset](docs/authors-preset.md)** | The author's daily mixed-provider setup |
| **[$30 Preset](docs/thirty-dollars-preset.md)** | A budget mixed-provider setup for around $30/month |
| **[OpenCode Go Preset](docs/opencode-go-preset.md)** | The bundled `opencode-go` preset generated by the installer |

---


## 📄 License

MIT
