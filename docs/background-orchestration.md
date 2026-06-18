# Background Orchestration

blacktower tracks delegated OpenCode `task` sessions in an in-memory background
job board. This is an additive reliability layer on top of the existing
resumable-session manager.

## What is tracked

When the orchestrator delegates with the native `task` tool, blacktower records:

- the child task/session ID,
- the parent orchestrator session,
- the specialist agent,
- a short parent-scoped alias such as `exp-1`, `fix-1`, or `ora-1`,
- the current best-known state,
- cancellation and uncertainty flags.

The existing `### Resumable Sessions` prompt block remains the user-facing
continuity mechanism. The background job board is used internally for safer
tracking and cancellation.

## Cancelling delegated work

Use the `cancel_task` tool to stop a tracked delegated OpenCode task session:

```text
cancel_task(id: "exp-1")
```

The `id` can be either the background job alias or the raw task/session ID. For
safety, raw IDs are only accepted when they belong to the current parent session.

## Scope and limits

`cancel_task` only cancels delegated OpenCode task sessions tracked by
blacktower. It does **not** cancel recurring or one-off scheduled tasks from the
control center, and it does **not** roll back file edits already written by a
worker.

If cancellation times out, blacktower marks the job status as uncertain and
returns a warning instead of blocking the orchestrator indefinitely. Inspect the
working tree and any multiplexer panes before continuing after an uncertain
cancellation.

## Compatibility

This feature does not remove or replace:

- `subtask`,
- todo continuation,
- Divoom/control-center integration,
- `fallback.chains`,
- existing `grep_app` compatibility.
