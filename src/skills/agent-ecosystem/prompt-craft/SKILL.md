---
name: prompt-craft
description: "Write better CLAUDE.md files, SKILL.md files, and slash commands. The meta-skill for improving Claude Code configuration — covers the 5-question CLAUDE.md framework, skill description optimization, progressive disclosure, and anti-patterns. Use when creating or improving project instructions, skill descriptions, or command definitions. Triggers: improve CLAUDE.md, write CLAUDE.md, optimize skill, skill description, write instructions, prompt engineering, meta-skill."
allowed-tools: Read Write Edit Grep Glob
---

> **See also:** `skill-creator` (full skill creation workflow with evals), `skill-improver` (improve skills from run artifacts), `context-engineer` (context window management).

# Prompt Craft

Write instructions that make Claude work better. Every token in CLAUDE.md, SKILL.md, and slash commands costs context — make each one earn its place.

## CLAUDE.md — The 5-Question Framework

Answer five questions, cut everything else.

### 1. What is this?

One sentence. Orient immediately. Not your mission statement.

```markdown
# Good

This is a Go backend for community data aggregation — ingests Reddit and X,
stores in PostgreSQL, serves via GraphQL.

# Bad

Welcome to our innovative platform that leverages cutting-edge AI to
revolutionize how communities interact with data...
```

### 2. How do I run things?

Exact commands. No guessing.

```markdown
# Good

- `make dev` — starts local server on :8080
- `make test` — runs all tests
- `make migrate` — applies pending DB migrations
- Requires: Go 1.22+, PostgreSQL 15+, .env file (see .env.example)

# Bad

- You can run the project using the standard Go toolchain
```

### 3. What patterns do I follow?

Non-negotiable rules. Use `IMPORTANT:` on the ones that matter most.

```markdown
IMPORTANT: All API handlers must validate input with the validation package
before accessing the database. No raw SQL — use the query builder.

- Error responses follow RFC 7807 (Problem Details)
- Logging uses structured logger (slog), never fmt.Println
- New endpoints need integration tests, not just unit tests
```

### 4. What's weird here?

Gotchas that will trip Claude up because they're counterintuitive.

```markdown
- The `users` table has both `status` and `account_status` — use `account_status` (other is legacy)
- Rate limiter is disabled in dev but the middleware is still loaded — don't remove it
- The `/internal/` package is NOT Go internal — it's just a naming convention in this project
```

### 5. How do we work?

Process, conventions, approval gates.

```markdown
- Branch naming: type/description (feat/add-user-api, fix/login-redirect)
- Commits: conventional commits (feat:, fix:, refactor:, test:)
- Never push directly to main — always PR
- Run `make lint` before committing
```

### Size targets

| Project type   | Lines   | Tokens |
| -------------- | ------- | ------ |
| Personal/small | 10-20   | ~500   |
| Team project   | 50-100  | ~2k    |
| Monorepo       | 200-400 | ~10k   |

If it's longer, you're dumping, not pointing.

## The "Point, Don't Dump" Pattern

```markdown
# Bad — 200 lines of coding standards inline

[entire style guide pasted here]

# Good — 2 lines that load on demand

- For coding standards, see docs/coding-standards.md
- For API patterns, see docs/api-guide.md
```

Claude reads referenced files only when relevant. CLAUDE.md loads every session.

## SKILL.md — Description Optimization

The `description` field is the most important line in a skill. Claude matches tasks to skills by scanning descriptions.

### Include trigger words

```yaml
# Good — packed with triggers
description: "Test-Driven Development workflow: write a failing test first
(red), implement minimal code to pass (green), then refactor. Use when
the user asks for TDD, test-first development, red-green-refactor, or
when building features that need test coverage. Triggers: tdd, test first,
red green refactor, write tests first, test-driven."

# Bad — too vague
description: "Helps with testing."
```

### State what it does AND when to use it

```yaml
# Good
description: "Deploy applications to Cloudflare. Use when the user asks to
deploy, host, publish, or set up a project on Cloudflare."

# Bad — only says what, not when
description: "Cloudflare deployment."
```

### Add negative triggers for ambiguous skills

```yaml
description: "Build apps with the Claude API or Anthropic SDK.
TRIGGER when: code imports anthropic/@anthropic-ai/sdk/claude_agent_sdk.
DO NOT TRIGGER when: code imports openai/other AI SDK, general programming."
```

## Progressive Disclosure

Skills load in three stages — design for this:

1. **Metadata** (~100 tokens) — `name` + `description`. Loaded for ALL skills at startup.
2. **Instructions** (<5000 tokens) — SKILL.md body. Loaded when skill activates.
3. **Resources** (as needed) — `references/`, `scripts/`, `assets/`. Loaded on demand.

Keep SKILL.md under 500 lines. Move reference material to `references/`.

## Slash Command Patterns

Commands go in `.claude/commands/` as markdown files.

```markdown
---
description: Read all changed files on current branch
allowed-tools: Bash, Read, Grep, Glob
---

Look at `git diff --name-only main...HEAD` to find all files changed on
this branch. Read each one to understand the current state of work.
Summarize what's been done and what might still need attention.
```

### Variable passing

- `$ARGUMENTS` — full argument string
- `$1`, `$2`, etc. — positional arguments

### Keep commands minimal

If a command is more than 10 lines of prompt, it should probably be a skill instead. Commands are for triggering specific actions. Skills are for providing context and methodology.

## Anti-Patterns

- **ALL CAPS everywhere** — use `IMPORTANT:` sparingly on critical rules only
- **Negative-only constraints** — "Never use X" without saying what to use instead
- **Explaining what Claude can read** — don't describe file contents, point to the file
- **Duplicate instructions** — if it's in CLAUDE.md AND a skill, it'll conflict eventually
- **Over-explaining obvious things** — Claude knows how to write TypeScript. Tell it your project's conventions, not the language.
- **Pasting entire docs inline** — use the `references/` directory in skills

## Resources

Load these only when needed; keep `SKILL.md` as the activation workflow.

## Merged Skills

### Curated references

Former merged-skill dumps were distilled into these lookup files:

- `references/curated/prompt-engineering-patterns.md` — Prompt Engineering Patterns guidance.
