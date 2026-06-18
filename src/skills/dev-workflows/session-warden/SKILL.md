---
name: session-warden
description: Diagnose and change Blacktower delegated-session lifecycle behavior. Use for stuck delegated tasks, background job board state, cancel_task, subtask/council sessions, session reuse, tmux/zellij panes, cleanup, orphan processes, or OpenCode SDK session timeout handling.
---

# Session Warden

Use this skill for work where delegated sessions can hang, leak, be cancelled,
or be misreported.

## Lifecycle checklist

1. **Identify the owner path**
   - Native `task` tool / task-session-manager
   - `subtask` tool
   - council worker
   - foreground fallback
   - smartfetch secondary model
   - multiplexer pane mirror

2. **Trace the lifecycle**
   - create → prompt/run → status/messages/result → abort/delete → event cleanup
   - Read `references/session-lifecycle.md` before changing lifecycle code.

3. **Protect every async boundary**
   - Session create/messages/prompt/abort/delete must have bounded waits.
   - Event handlers must not block unrelated cleanup.
   - Multiplexer close should not depend on a forever-running child process.

4. **Record ambiguity honestly**
   - Mark unknown/uncertain states instead of pretending cancellation succeeded.
   - Do not overwrite terminal states with later stale events.

5. **Validate with race-focused tests**
   - cancellation followed by `session.deleted`
   - completed task followed by deletion
   - abort timeout
   - stale/resumed missing session
   - multiplexer cleanup path if panes are involved

Use `templates/session-incident.md` for bug reports or post-fix notes. Use
`scripts/extract_session_events.py` on saved logs when diagnosing event order.
