# MCP Servers

Built-in Model Context Protocol (MCP) servers ship with oh-my-opencode-slim and give agents access to external tools — web search, library documentation, code search, browser automation, product APIs, and local workflow bridges.

---

## Built-in MCPs

| MCP | Purpose | Endpoint |
|-----|---------|----------|
| `github` | GitHub repositories, pull requests, issues, and Actions via the official GitHub MCP Docker image | local Docker command using `GITHUB_PERSONAL_ACCESS_TOKEN` or `gh auth token` |
| `playwright` | Browser automation via Playwright MCP | `npx -y @playwright/mcp@latest --isolated --headless` |
| `chrome-devtools` | Chrome DevTools automation, debugging, and performance analysis | `npx -y chrome-devtools-mcp@latest --isolated --headless --no-usage-statistics` |
| `websearch` | Real-time web search via Exa AI | `https://mcp.exa.ai/mcp` |
| `context7` | Official library documentation (up-to-date) | `https://mcp.context7.com/mcp` |
| `microsoft-learn` | Official Microsoft Learn documentation and code samples | `https://learn.microsoft.com/api/mcp` |
| `sentry` | Sentry issues, events, traces, and debugging workflows | `https://mcp.sentry.dev/mcp` |
| `stripe` | Stripe billing, customers, payments, invoices, and subscriptions | `https://mcp.stripe.com/` |
| `huggingface` | Hugging Face Hub and Spaces via official MCP | `https://huggingface.co/mcp?login` |
| `super-productivity` | Super Productivity task and time-tracking bridge | local `sp-mcp` command |
| `grep_app` | GitHub code search via grep.app | `https://mcp.grep.app` |

The expanded built-in list mirrors the shared `.agents` MCP registry where the
entries can be represented portably in OMOC. User-specific absolute paths and
secret values are not vendored into the plugin; local MCPs expect their normal
commands (`docker`, `gh`, `npx`, or `sp-mcp`) to be available on the host.
Host-dependent local MCPs and auth/product remotes (`github`, `playwright`,
`chrome-devtools`, `microsoft-learn`, `sentry`, `stripe`, `huggingface`, and
`super-productivity`) are registered disabled by default; opt into them with
`enabled_mcps` before assigning them to agents.

---

## Default Permissions Per Agent

| Agent | Default MCPs |
|-------|-------------|
| `orchestrator` | `websearch`, `grep_app` |
| `librarian` | `websearch`, `context7`, `grep_app` |
| `designer` | none |
| `oracle` | none |
| `explorer` | none |
| `fixer` | none |
 | `councillor` | none |

---

## Configuring MCP Access

Control which MCPs each agent can use via the `mcps` array in your preset config (`~/.config/opencode/oh-my-opencode-slim.json` or `.jsonc`):

| Syntax | Meaning |
|--------|---------|
| `["*"]` | All MCPs |
| `["*", "!context7"]` | All MCPs except `context7` |
| `["websearch", "context7"]` | Only listed MCPs |
| `[]` | No MCPs |
| `["!*"]` | Deny all MCPs |

**Rules:**
- `*` expands to all available MCPs
- `!item` excludes a specific MCP
- Conflicts (e.g. `["a", "!a"]`) → deny wins

**Example:**

```json
{
  "presets": {
    "my-preset": {
      "orchestrator": {
        "mcps": ["websearch", "grep_app"]
      },
      "librarian": {
        "mcps": ["websearch", "context7", "grep_app"]
      },
      "oracle": {
        "mcps": ["*", "!websearch"]
      },
      "fixer": {
        "mcps": []
      }
    }
  }
}
```

---

## Disabling MCPs Globally

To disable specific MCPs for all agents regardless of preset, add them to `disabled_mcps` at the root of your config:

```json
{
  "disabled_mcps": ["websearch"]
}
```

This is useful when you want to cut external network calls entirely (e.g. air-gapped environments or cost control).

---

## Enabling Opt-In MCPs

Local MCPs that require host tools and product/API remotes that may require auth
are disabled by default so OMOC does not start extra local processes or connect
to product services on every installation. Enable them explicitly with
`enabled_mcps`, then grant per-agent access through `mcps`:

```json
{
  "enabled_mcps": ["github", "playwright"],
  "presets": {
    "my-preset": {
      "orchestrator": {
        "mcps": ["websearch", "grep_app", "github"]
      },
      "designer": {
        "mcps": ["playwright"]
      }
    }
  }
}
```
