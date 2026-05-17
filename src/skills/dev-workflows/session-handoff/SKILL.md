---
name: session-handoff
description: "Create structured handoff documents for session continuity — progress, decisions, blockers, next steps, and file references. Use when ending a long session, before /clear, when context is getting large, or when another agent needs to continue work. Triggers: handoff, save progress, session summary, continue later, hand off, document progress, before clear."
allowed-tools: Read Write Edit Grep Glob
---

> **See also:** `context-engineer` (context window management strategies).

# Session Handoff

Create a handoff document that lets a fresh session (or a different agent) continue exactly where you left off. External memory that survives `/clear`.

## When to Create a Handoff

- Before running `/clear` on a complex task
- When context usage exceeds 60%
- Before switching to a different task
- When work will continue in a different session or by a different person/agent
- At natural breakpoints in multi-day work

## Handoff Document Structure

Write to `.claude/handoff.md` (or a location the user specifies).

```markdown
# Handoff: [Task Name]

**Date:** [timestamp]
**Branch:** [current branch]
**Status:** [in-progress | blocked | ready-for-review]

## Goal

[One sentence: what we're building/fixing and why]

## What's Done

- [Completed item with file path]
- [Completed item with file path]

## What's Left

- [ ] [Next task — be specific]
- [ ] [Next task]
- [ ] [Next task]

## Key Decisions

- [Decision and why we made it]
- [Trade-off and which side we chose]

## Blockers / Open Questions

- [Thing we're stuck on or need input for]

## Key Files

- `path/to/main-file.ts` — [what it does / what changed]
- `path/to/test-file.test.ts` — [test coverage status]
- `path/to/config.json` — [relevant config changes]

## How to Continue

[Exact steps for the next session to pick up where we left off]
```

## Rules

- **Be specific** — file paths, function names, line numbers. Not "the auth module" but `src/auth/validate.ts:42`.
- **Capture decisions** — the "why" matters more than the "what". The next session can read the code, but can't read your reasoning.
- **List blockers explicitly** — a blocker that's only in your head dies when the session ends.
- **Keep it scannable** — the next session needs to load this fast. No prose essays.
- **Include the continuation command** — "Read .claude/handoff.md and continue" should be all the next session needs.

## Quick Handoff (for simple tasks)

If the task is simple, a minimal handoff is fine:

```markdown
# Handoff: Fix login redirect bug

Branch: fix/login-redirect
Status: in-progress

Done: identified root cause in `src/auth/callback.ts:89` — redirect URL not encoded.
Left: implement fix, add test, verify with Playwright.
```

## Resuming from a Handoff

Start a new session with:

```
Read .claude/handoff.md and continue from where we left off.
Check git status and recent commits for any changes since the handoff.
```
