# Skills

Skills are specialized capabilities you can assign to agents. Unlike MCPs (which are running servers), skills are **prompt-based tool configurations** — instructions injected into an agent's system prompt that describe how to use a particular tool.

Blacktower ships its own skill catalog, but it does not expose the whole catalog at
once. At startup it materializes only the curated union of skills referenced by
enabled agents. You do not need `~/.agents/skills` for Blacktower skills.

---

## Skill Packaging Policy

Blacktower treats skills in three categories:

1. **Bundled code-managed skills** live in `src/skills/`, are shipped with the
   package, and are copied into a managed skill directory only when an enabled
   agent's resolved skill profile references them. Per-agent permissions decide
   which of these curated skills are visible/runnable.
2. **External skills** can still be installed manually when you intentionally
   want non-Blacktower skill packages.
3. **Permission-only skills** are not installed by Blacktower. Blacktower only grants
   agent permission for users who already have them.

For Blacktower as the distribution layer, prefer code-owned availability rather than a
personal global skill folder. Keep DCP/quota-related skills outside Blacktower unless
a future integration contract explicitly defines that boundary.

Bundled skill discovery is recursive (`src/skills/**/SKILL.md`) and generated
at runtime from frontmatter metadata. This removes manual registry maintenance
as the in-repo catalog grows.

---

## Available Skills

### Code-managed by Blacktower

| Skill | Description | Assigned to by default |
|-------|-------------|----------------------|
| [`agent-browser`](#agent-browser) | High-performance browser automation | `designer` |

### Bundled in repo

| Skill | Description | Built-in fallback assignment |
|-------|-------------|-----------------------------|
| [`simplify`](#simplify) | Behavior-preserving code simplification | `oracle` |
| [`codemap`](#codemap) | Repository codemap generation | `orchestrator` |
| [`clonedeps`](#clonedeps) | Local dependency source cloning | `orchestrator` |
| [`almaz`](#almaz-homelab-and-nuc) | Almaz homelab operations and documentation | `orchestrator`, `oracle` |
| [`homelab`](#almaz-homelab-and-nuc) | Cross-host NUC/Almaz coordination | `orchestrator`, `oracle` |
| [`nuc`](#almaz-homelab-and-nuc) | NUC homelab operations and documentation | `orchestrator`, `oracle` |
| [`scheduled-tasks`](#scheduled-tasks) | OpenCode task scheduling guidance | all agents |
| `gitea-repo-overhaul` | Gitea/Forgejo repo audit and governance playbook | `orchestrator`, `oracle` |
| `neubrutal-hud` | Neubrutal HUD design system for broadcast overlays, dashboards, and control panels | `designer`, `fixer`, `orchestrator` |
| `super-productivity-maintenance` | Super Productivity maintenance router | `orchestrator` |
| `super-productivity-planning` | Super Productivity task hygiene and planning | `orchestrator` |

In addition to those Blacktower defaults, this repo now bundles the migrated skills
catalog under category paths like:

- `src/skills/language-js-ts/<skill>/`
- `src/skills/git-github/<skill>/`
- `src/skills/dev-workflows/<skill>/`
- `src/skills/homelab/<skill>/`
- `src/skills/.system/<skill>/`

Top-level catalog docs are also preserved in `src/skills/` (`README.md`,
`CATALOG.md`, `QUALITY.md`, `AUDIT_WORKFLOW.md`, `STACK_PROFILE.md`,
`index.json`, `index.md`, plus `audits/`).

Skill assignment is controlled by skill profiles and explicit agent `skills`
arrays. The installer-generated config omits `skillProfiles` by default, so the
code-owned built-in profiles are active. If you run with `--skills=no`, the
generated config writes explicit empty profiles for every built-in agent.

Generated configs use deny-by-default skill permissions. Niche skills stay
invisible unless code-owned profiles or explicit agent `skills` arrays allow
them.

`agent-browser` is bundled as a skill definition, but its runtime CLI still must
exist on the host for browser automation commands to work.

---

## simplify

**Behavior-preserving simplification for readability and maintainability.**

`simplify` is a bundled skill for clarity-focused refactoring without behavior changes. It helps `oracle` reduce unnecessary complexity, improve naming and structure, and keep simplification work scoped and reviewable.

By default, this skill is assigned to `oracle`, which owns code review, maintainability review, and simplification guidance. The `orchestrator` should route simplification requests to `oracle` instead of handling them as a top-level specialty itself.

Source: adapted from Addy Osmani's `code-simplification` skill and bundled locally as `simplify`.

---

## agent-browser

**External browser automation for visual verification and testing.**

`agent-browser` provides full high-performance browser automation. It allows agents to browse the web, interact with page elements, take screenshots, and verify visual state — useful for UI/UX work, end-to-end testing, and researching live documentation.

---

## codemap

**Automated repository mapping through hierarchical codemaps.**

`codemap` empowers the Orchestrator to build and maintain a deep architectural understanding of any codebase. Instead of reading thousands of lines of code on every task, agents refer to hierarchical `codemap.md` files describing the *why* and *how* of each directory.

**How to use:** Ask the Orchestrator to `run codemap`. It automatically detects whether to initialize a new map or update an existing one.

**Why it's useful:**
- **Instant onboarding** — understand unfamiliar codebases in seconds
- **Efficient context** — agents read architectural summaries, saving tokens and improving accuracy
- **Change detection** — only modified folders are re-analyzed
- **Timeless documentation** — focuses on high-level design, not implementation details

See **[Codemap Skill](codemap.md)** for full documentation including manual commands and technical details.

---

## clonedeps

**Local source mirroring for important project dependencies.**

`clonedeps` helps the Orchestrator clone a small, approved set of dependency
source repositories into `.blacktower/clonedeps/repos/` so OpenCode can inspect library
internals while keeping cloned code out of git.

The skill is assigned to `orchestrator`. The orchestrator may ask `@librarian`
to identify important dependencies and resolve official repository URLs/tags,
then asks for approval before cloning with direct git/filesystem operations.
There is intentionally no helper script; dependency discovery and ref validation
are handled by the orchestrator/librarian workflow so the skill works across
languages and repository types.

Before planning, the orchestrator checks `.blacktower/clonedeps.json` and reuses
existing clones when possible. After cloning, it adds or updates a concise
`## Cloned Dependency Source` section in root `AGENTS.md` that lists each
read-only cloned repo path directly with a one-sentence purpose.

Safety defaults:

- direct, important dependencies only;
- max 3-5 clones by default;
- HTTPS repositories only;
- pinned tags/commits only;
- no dependency scripts are executed;
- ignore-file edits are limited to managed marker blocks.

See **[Clonedeps](clonedeps.md)** for the full workflow and file layout.

---

## almaz, homelab, and nuc

**Host-specific and cross-host homelab operations workflows.**

`almaz`, `homelab`, and `nuc` are bundled under `src/skills/homelab/` so Blacktower
installs and manages them with the rest of the curated repo-owned skills. They
are assigned to `orchestrator` and `oracle` by default because homelab operations
need coordination and safety review rather than broad write-capable availability.

The host-specific `almaz` and `nuc` skills cover single-host work. The `homelab`
skill is the cross-host router for NUC/Almaz health, ntfy alerts, routing,
backups, service ownership, placement, and incidents. Live state remains
authoritative; the skills prefer read-only discovery and require explicit
approval before operational changes.

---

## scheduled-tasks

**One-off, recurring, and session-loop task scheduling for OpenCode.**

`scheduled-tasks` is bundled from the `opencode-tasks` plugin's agent skill so
Blacktower can manage it through the same curated skill materialization path as the
rest of the in-repo catalog. It explains the `opencode-tasks` scheduling tools,
permission rules for background `opencode run` executions, recurring task file
format, daemon setup, and `/loop` session commands.

The skill is part of the default global profile because scheduling requests can
arrive through any foreground agent. The runtime tools and slash commands still
come from the external `opencode-tasks` plugin. Bootstrap installs that plugin,
the system scheduler daemon, and `/loop` commands by default; use
`--no-scheduled-tasks` to opt out. Bootstrap no longer runs
`bunx opencode-tasks --install-skill` because Blacktower now owns the skill copy.

Bootstrap also writes disabled recurring-task templates to
`~/.config/opencode/task-templates/`. They are examples, not active scheduled
jobs. Review a template, copy it into `~/.config/opencode/tasks/`, and flip
`enabled: false` to `enabled: true` when you want it to run.

---

## Skills Assignment

Control which skills each agent can use in `~/.config/opencode/blacktower.json` (or `.jsonc`):

| Syntax | Meaning |
|--------|---------|
| `["*"]` | All installed skills |
| `["*", "!agent-browser"]` | All skills except `agent-browser` |
| `["simplify"]` | Only `simplify` |
| `[]` | No skills |
| `["!*"]` | Deny all skills |

**Rules:**
- `*` expands to all available installed skills
- `!item` excludes a specific skill
- Conflicts (e.g. `["a", "!a"]`) → deny wins (principle of least privilege)
- Explicit `skills` on an agent wins over `skillProfiles`
- If no explicit `skills` exists, Blacktower uses `skillProfiles.global` plus
  `skillProfiles.agents.<agent>`; missing sections fall back to built-in focused
  defaults

**Recommended host config:** avoid globally loading every personal skill folder
unless you intentionally want those external skills available. Blacktower already
materializes the curated skills needed by enabled agents into a managed path. In
OpenCode host config, omit broad paths like:

```jsonc
"skills": {
  "paths": ["/home/you/.agents/skills"]
}
```

Use Blacktower's plugin config for focused agent visibility instead, or omit
`skillProfiles` to use the code-owned built-in defaults:

```jsonc
{
  "skillProfiles": {
    "global": [],
    "agents": {
      "orchestrator": [],
      "oracle": [],
      "designer": ["agent-browser"]
    }
  }
}
```

**Example:**

```json
{
  "presets": {
    "my-preset": {
      "orchestrator": {
        "skills": ["codemap"]
      },
      "oracle": {
        "skills": ["simplify"]
      },
      "designer": {
        "skills": ["agent-browser"]
      },
      "fixer": {
        "skills": []
      }
    }
  }
}
```

For larger setups, define reusable skill sets through
`packageDefinitions.<name>.presets` and select them with `packages`. Packages
expand into the same per-agent `skills` arrays shown above, so the allow/deny
syntax and least-privilege rules stay unchanged. See
[Configuration](configuration.md#package-composition) for the full package
shape.
