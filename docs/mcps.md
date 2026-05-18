# MCP Servers

Built-in Model Context Protocol (MCP) definitions ship with oh-my-opencode-slim and give agents access to external tools — web search, library documentation, code search, browser automation, product APIs, and local workflow bridges.

---

## Built-in MCPs

| MCP | Purpose | Endpoint |
|-----|---------|----------|
| `github` | GitHub repositories, pull requests, issues, and Actions via the official GitHub MCP Docker image | local Docker command using `GITHUB_PERSONAL_ACCESS_TOKEN` or `gh auth token` |
| `playwright` | Browser automation via Playwright MCP | `npx -y @playwright/mcp@latest --isolated --headless` |
| `chrome-devtools` | Chrome DevTools automation, debugging, and performance analysis | `npx -y chrome-devtools-mcp@latest --isolated --headless --no-usage-statistics` |
| `websearch` | Real-time web search via Exa AI | `https://mcp.exa.ai/mcp` |
| `context7` | Official library documentation (up-to-date) | `https://mcp.context7.com/mcp` |
| `stripe` | Stripe billing, customers, payments, invoices, and subscriptions | `https://mcp.stripe.com/` |
| `super-productivity` | Super Productivity task and time-tracking bridge | local `sp-mcp` command |
| `grep_app` | GitHub code search via grep.app | `https://mcp.grep.app` |

The installer writes these definitions into OpenCode's host `opencode.json(c)`
instead of exporting them from the plugin. That keeps OAuth/API authentication
inside OpenCode's native MCP flow. User-specific absolute paths and secret
values are not vendored into the plugin; local MCPs expect their normal commands
(`docker`, `gh`, `npx`, or `sp-mcp`) to be available on the host.
All built-in MCPs are registered enabled by default. Host-dependent local MCPs
still require their host commands/auth to work (`docker`, `gh`, `npx`, or
`sp-mcp`). Use `disabled_mcps` if you want to keep a server from starting, and
use per-agent `mcps` lists to decide which agents can call each server.

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

This marks the host MCP disabled and removes it from OMOC's per-agent MCP
permission expansion. It is useful when you want to cut external network calls
entirely (e.g. air-gapped environments or cost control).

---

## Enabling All MCPs For An Agent

Built-in MCP servers are registered enabled by default, but agents still need
permission to call them. Grant broad per-agent access with `mcps: ["*"]`, or use
the default focused lists for narrower access:

```json
{
  "presets": {
    "my-preset": {
      "orchestrator": {
        "mcps": ["*"]
      },
      "designer": {
        "mcps": ["playwright"]
      }
    }
  }
}
```
