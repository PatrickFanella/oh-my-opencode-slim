# Skills

Skills are specialized capabilities you can assign to agents. Unlike MCPs (which are running servers), skills are **prompt-based tool configurations** — instructions injected into an agent's system prompt that describe how to use a particular tool.

Skills are installed via the `oh-my-opencode-slim` installer or manually with `npx skills add`.

---

## Skill Packaging Policy

OMOC treats skills in three categories:

1. **Bundled custom skills** live in `src/skills/` and are copied into the
   OpenCode config directory by the installer. Use this for skills that are
   core to OMOC workflows and maintained with this repo.
2. **Recommended external skills** are installed through the skills CLI during
   setup. Use this only for skills with an upstream owner or external runtime
   dependency.
3. **Permission-only skills** are not installed by OMOC. OMOC only grants
   agent permission for users who already have them.

For OMOC as the distribution layer, prefer bundled custom skills for core
orchestration workflows. Keep DCP/quota-related skills outside OMOC unless a
future integration contract explicitly defines that boundary.

Bundled skill discovery is recursive (`src/skills/**/SKILL.md`) and generated
at runtime from frontmatter metadata. This removes manual registry maintenance
as the in-repo catalog grows.

---

## Available Skills

### Recommended (via installer)

| Skill | Description | Assigned to by default |
|-------|-------------|----------------------|
| [`agent-browser`](#agent-browser) | High-performance browser automation | `designer` |

### Bundled in repo

| Skill | Description | Assigned to by default |
|-------|-------------|----------------------|
| [`simplify`](#simplify) | Behavior-preserving code simplification | `oracle` |
| [`codemap`](#codemap) | Repository codemap generation | `orchestrator` |
| [`clonedeps`](#clonedeps) | Local dependency source cloning | `orchestrator` |

In addition to those OMOC defaults, this repo now bundles the migrated skills
catalog under category paths like:

- `src/skills/language-js-ts/<skill>/`
- `src/skills/git-github/<skill>/`
- `src/skills/dev-workflows/<skill>/`
- `src/skills/.system/<skill>/`

Top-level catalog docs are also preserved in `src/skills/` (`README.md`,
`CATALOG.md`, `QUALITY.md`, `AUDIT_WORKFLOW.md`, `STACK_PROFILE.md`,
`index.json`, `index.md`, plus `audits/`).

Default auto-assignment remains intentionally narrow:

- `simplify` -> `oracle`
- `codemap` -> `orchestrator`
- `clonedeps` -> `orchestrator`

Generated configs use deny-by-default skill permissions. All other bundled
migrated skills default to no auto-grants unless explicitly configured per
agent, for example with `skills: ["*"]` or a named allow-list.

`agent-browser` remains a recommended external skill because it also installs a
runtime CLI. The migrated catalog copy is kept as source material but is not
installed as a bundled custom skill, preventing the installer from overwriting
the external skill payload.

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
source repositories into `.slim/clonedeps/repos/` so OpenCode can inspect library
internals while keeping cloned code out of git.

The skill is assigned to `orchestrator`. The orchestrator may ask `@librarian`
to identify important dependencies and resolve official repository URLs/tags,
then asks for approval before cloning with direct git/filesystem operations.
There is intentionally no helper script; dependency discovery and ref validation
are handled by the orchestrator/librarian workflow so the skill works across
languages and repository types.

Before planning, the orchestrator checks `.slim/clonedeps.json` and reuses
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

## Skills Assignment

Control which skills each agent can use in `~/.config/opencode/oh-my-opencode-slim.json` (or `.jsonc`):

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
