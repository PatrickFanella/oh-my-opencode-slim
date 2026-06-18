---
name: customize-opencode
description: Use ONLY when editing or creating OpenCode's own configuration, including opencode.json/jsonc, .opencode files, ~/.config/opencode files, OpenCode agents, skills, plugins, MCP servers, or permission rules.
---

# Customizing OpenCode

OpenCode validates its own config strictly and can refuse to start when a field
shape is wrong. Treat this skill as a workflow and quick reference, not as the
full source of truth. If a field is not covered here, fetch and inspect the
authoritative schema before writing config:

```text
https://opencode.ai/config.json
```

Every OpenCode config should include:

```json
{
  "$schema": "https://opencode.ai/config.json"
}
```

## When to Use

Use this skill only for OpenCode host configuration and extension files:

- `opencode.json` / `opencode.jsonc`
- `.opencode/**`
- `~/.config/opencode/**`
- OpenCode agent files
- OpenCode skill files
- OpenCode plugin files
- OpenCode MCP server config
- OpenCode permission rules

Do not use it for ordinary application code or Blacktower's plugin-specific
config unless the task also touches OpenCode host config.

## File Locations

| Purpose | Path |
|---|---|
| Project config | `./opencode.json`, `./opencode.jsonc`, `.opencode/opencode.json` |
| Global config | `~/.config/opencode/opencode.json` |
| Project agents | `.opencode/agent/<name>.md` or `.opencode/agents/<name>.md` |
| Global agents | `~/.config/opencode/agent/<name>.md` or `~/.config/opencode/agents/<name>.md` |
| Project skills | `.opencode/skill/<name>/SKILL.md` or `.opencode/skills/<name>/SKILL.md` |
| Global skills | `~/.config/opencode/skill/<name>/SKILL.md` or `~/.config/opencode/skills/<name>/SKILL.md` |
| Project plugins | `.opencode/plugin/*.ts` or `.opencode/plugins/*.ts` |

Config is loaded at startup. After changing config, agents, skills, plugins, or
MCP definitions, tell the user to restart OpenCode for the change to apply.

## Config Shape Reference

Common `opencode.json` fields:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "model": "provider/model-id",
  "small_model": "provider/model-id",
  "default_agent": "agent-name",
  "instructions": ["AGENTS.md"],
  "skills": {
    "paths": [".opencode/skills"],
    "urls": ["https://example.com/.well-known/skills/"]
  },
  "agent": {
    "reviewer": {
      "description": "Reviews PRs for regressions.",
      "mode": "subagent",
      "model": "anthropic/claude-sonnet-4-6",
      "permission": { "edit": "deny" }
    }
  },
  "mcp": {
    "playwright": {
      "type": "local",
      "command": ["npx", "-y", "@playwright/mcp"],
      "enabled": true
    }
  },
  "plugin": [
    "blacktower",
    "./local-plugin.ts",
    ["plugin-name", { "option": "value" }]
  ],
  "permission": {
    "edit": "deny",
    "bash": { "*": "ask", "git status": "allow" }
  }
}
```

Important shape rules:

- `model` values include provider prefix: `provider/model-id`.
- `skills` is an object with `paths` and/or `urls`, not an array.
- `agent` is an object keyed by agent name, not an array.
- `plugin` is an array of strings or `[name, options]` tuples.
- `mcp.<name>.command` is an array of strings, not a shell string.
- `permission` can be a flat action or a per-tool object.

## Agents

Prefer file-based agents for non-trivial prompts:

```markdown
---
description: Reviews PRs for style and regressions.
mode: subagent
model: anthropic/claude-sonnet-4-6
permission:
  edit: deny
  bash: ask
---

You are a strict PR reviewer. Focus on actionable findings.
```

Valid `mode` values are `primary`, `subagent`, and `all`.

## Skills

Skills live in a directory containing an exact `SKILL.md` file:

```text
.opencode/skills/my-skill/SKILL.md
```

Required frontmatter:

```markdown
---
name: my-skill
description: Use when concrete trigger words apply; describe what it does and when to use it.
---
```

Skill descriptions should be concrete and narrow. Use `Use ONLY when...` for
skills that should not trigger on adjacent topics.

## MCP Servers

MCP servers are keyed under `mcp` and require a `type`:

```jsonc
{
  "mcp": {
    "local-tool": {
      "type": "local",
      "command": ["node", "server.js"],
      "enabled": true,
      "env": { "TOKEN": "{env:TOKEN}" }
    },
    "remote-tool": {
      "type": "remote",
      "url": "https://example.com/mcp",
      "headers": { "Authorization": "Bearer {env:TOKEN}" }
    }
  }
}
```

Use `enabled: false` to disable an inherited MCP server.

## Permissions

Actions are `allow`, `ask`, and `deny`.

```jsonc
{
  "permission": {
    "edit": "deny",
    "bash": { "*": "ask", "git status": "allow" },
    "external_directory": { "*": "deny", "~/Projects/**": "allow" }
  }
}
```

Within permission objects, insertion order matters: the last matching rule wins.
Put broad rules first and narrow rules later.

## Safe Edit Workflow

1. Inspect the existing file before editing.
2. Preserve `$schema`, comments, and unrelated settings.
3. Confirm exact field shapes from `https://opencode.ai/config.json` when unsure.
4. Prefer creating focused agent/skill/plugin files over stuffing large prompts
   into `opencode.json`.
5. Validate JSON/JSONC after editing.
6. Tell the user to restart OpenCode.

## Recovery Escape Hatches

If OpenCode will not start because config is broken:

- `OPENCODE_DISABLE_PROJECT_CONFIG=1` skips project config.
- `OPENCODE_CONFIG=/path/to/file.json` loads an explicit config.
- `OPENCODE_CONFIG_CONTENT='{"$schema":"https://opencode.ai/config.json"}'`
  injects minimal config content.
- `OPENCODE_DISABLE_DEFAULT_PLUGINS=1` skips default plugins.
- `OPENCODE_PURE=1` skips external plugins.
- `OPENCODE_DISABLE_EXTERNAL_SKILLS=1` skips external skill scans.
