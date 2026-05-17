---
name: context-engineer
description: "Manage Claude Code's context window effectively: clear-and-catchup patterns, document-and-clear for complex tasks, handoff documents, when to compact vs restart, context budgeting. Use when context is getting large, sessions are getting slow, or when planning multi-session work. Triggers: context management, running out of context, context window, clear session, compact, context budget, long session."
---

> **See also:** `session-handoff` (create handoff documents), `deep-research` (research that consumes context).

# Context Engineering

Claude Code has ~200k tokens of context. Treat it like disk space — manage it ruthlessly. A fresh session with good context beats a long session with accumulated noise.

## Context Budget

| Component         | Typical tokens  | Notes                         |
| ----------------- | --------------- | ----------------------------- |
| System prompt     | ~10k            | Fixed cost, always present    |
| CLAUDE.md         | 2-10k           | Keep lean — point, don't dump |
| Active skills     | 1-5k each       | Loaded on demand              |
| Your conversation | Everything else | This is what you're managing  |

Run `/context` mid-session to check usage. If you're over 60%, consider clearing.

## Three Context Strategies

### 1. Simple Restart (default, preferred)

For most tasks. The cheapest and most reliable approach.

```
/clear
→ "Read the files I changed on this branch and continue the work"
```

Or use the `/catchup` command if available. Fresh context, no accumulated confusion.

**When to use**: Task is straightforward, all state is in the code/files, no complex decisions to preserve.

### 2. Document and Clear (complex tasks)

For multi-step work where you need to preserve decisions and progress.

```
1. Ask Claude to dump progress to a markdown file:
   "Write a handoff document to .claude/handoff.md covering:
    what we've done, what's left, key decisions, blockers"

2. /clear

3. New session:
   "Read .claude/handoff.md and continue from where we left off"
```

Creates **external memory** — the session state survives the clear.

**When to use**: Architecture decisions in progress, multi-file refactors, debugging sessions with accumulated clues.

### 3. Avoid /compact

Automatic compaction is opaque, lossy, and not well-optimized. It silently drops information Claude might need. Prefer explicit `/clear` + document-and-clear over letting compaction happen automatically.

If you must compact: save important context to a file first.

## CLAUDE.md as Context Engineering

The most impactful context decision you make is what goes in CLAUDE.md.

### The "Point, Don't Dump" Pattern

```markdown
# Bad — dumps entire style guide into context every session

[500 lines of coding standards]

# Good — points to the detail, loads on demand

- For coding standards, see docs/coding-standards.md
- For API patterns, see docs/api-guide.md
- For deployment, see docs/deploy.md
```

### The 5-Question Framework

Answer these five questions, nothing more:

1. **What is this?** — One sentence. Orient Claude immediately.
2. **How do I run things?** — Exact commands, file paths, no guessing.
3. **What patterns do I follow?** — Your non-negotiable rules. Use `IMPORTANT:` sparingly.
4. **What's weird here?** — Gotchas, legacy quirks, counterintuitive things.
5. **How do we work?** — Process: variations, naming conventions, approval gates.

### Size Target

- **Personal project**: 10-20 lines
- **Team project**: 50-100 lines
- **Enterprise monorepo**: 200-400 lines (13-25k tokens)
- **If it's longer**: You're dumping, not pointing

## Session Patterns

### Starting a fresh session

```
"Read CLAUDE.md, then look at git status and recent commits
 to understand what's in progress"
```

### Resuming complex work

```
"Read .claude/handoff.md for context on the current task,
 then check git diff to see what's changed"
```

### Parallel sessions

Use `claude --resume <session-id>` to continue a specific session. Use `claude --continue` for the most recent. Use separate terminal windows for independent tasks.

### Context-aware commits

Before committing in a long session, verify Claude still remembers the full scope:

```
"Before we commit, summarize all the changes we've made
 and why. Make sure nothing is missing."
```

## Anti-Patterns

- **Stuffing context with @-mentions** — every file you @-mention costs tokens permanently
- **Long sessions without clearing** — accumulated context degrades quality after ~100k tokens
- **Relying on compact** — lossy, opaque, unpredictable
- **Explaining things Claude can read** — "this file does X" when Claude can just read the file
- **Negative-only constraints** — "Never use --flag" without saying what to use instead
- **Full documentation inline** — put it in files, reference from CLAUDE.md

## Meta-Analysis

Your conversation history lives at `~/.claude/projects/`. You can analyze it:

```bash
# Find sessions about a topic
grep -l -i "keyword" ~/.claude/projects/-*/*.jsonl

# Analyze common patterns
cat session.jsonl | jq -r 'select(.type=="user") | .message.content'
```

Use these insights to improve your CLAUDE.md — if Claude keeps making the same mistake, add a rule.

## Resources

Load these only when the active task needs the extra detail; keep `SKILL.md` as the activation workflow.

### Curated references

Former merged-skill dumps were distilled into these lookup files:

- `references/curated/context-driven-development.md` — Context Driven Development guidance.
- `references/curated/context-network.md` — Context Network guidance.
- `references/curated/context-retrospective.md` — Context Retrospective guidance.


### Extracted resource directories

- `references/` — curated resources extracted from prior merged skill material.
- `templates/` — curated resources extracted from prior merged skill material.
