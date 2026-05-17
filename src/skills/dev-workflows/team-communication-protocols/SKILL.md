---
name: team-communication-protocols
description: Structured messaging protocols for agent team communication including message type selection, plan approval, shutdown procedures, and anti-patterns to avoid. Use this skill when establishing communication norms for a newly spawned team, when deciding whether to send a direct message or a broadcast, when a team-lead needs to review and approve an implementer's plan before work begins, when orchestrating a graceful team shutdown after all tasks are complete, or when debugging why teammates are not coordinating correctly at integration points.
metadata:
  version: 1.0.2
---

# Team Communication Protocols

Use predictable message contracts for teammate coordination, plan approvals, and shutdown.

## Core Rules

- Default to `message` (direct, single recipient).
- Use `broadcast` only for critical shared blockers.
- Use teammate `name`, never `agentId`.
- Communicate at integration handoffs immediately.
- Prefer milestone updates; avoid micromanagement noise.

## Message Type Selection

### `message` (default)

Use for task updates, dependency handoffs, blockers, and questions.

```json
{
  "type": "message",
  "recipient": "implementer-1",
  "content": "Your API endpoint is ready. You can now build the frontend form.",
  "summary": "API endpoint ready for frontend"
}
```

### `broadcast` (rare)

Use only when every teammate must react now.

```json
{
  "type": "broadcast",
  "content": "Critical: shared types file has been updated. Pull latest before continuing.",
  "summary": "Shared types updated"
}
```

Cost note: one broadcast fans out to N direct messages.

### `shutdown_request`

Use for graceful team closeout.

```json
{
  "type": "shutdown_request",
  "recipient": "reviewer-1",
  "content": "Review complete, shutting down team."
}
```

Recipient returns `shutdown_response` with approve/reject and reason.

## Communication Anti-Patterns

- Broadcasting routine status updates.
- Sending structured status via chat instead of task/status tools.
- Missing interface-ready handoff messages.
- Using UUIDs in place of teammate names.
- Leaving idle teammates unassigned/unclosed.

## Plan Approval Workflow

For teammates with `plan_mode_required`:

1. Teammate explores read-only and drafts plan.
2. `ExitPlanMode` emits `plan_approval_request`.
3. Lead approves or rejects with actionable feedback.
4. Teammate executes only after approval.

Approve example:

```json
{
  "type": "plan_approval_response",
  "request_id": "abc-123",
  "recipient": "implementer-1",
  "approve": true
}
```

Reject example:

```json
{
  "type": "plan_approval_response",
  "request_id": "abc-123",
  "recipient": "implementer-1",
  "approve": false,
  "content": "Please add error handling for the API calls"
}
```

## Shutdown Protocol

1. Lead sends `shutdown_request` to each teammate.
2. Teammate replies `shutdown_response` (`approve: true|false`).
3. If rejected: wait for active work, retry.
4. After all approve: run `TeamDelete`.

## Teammate Discovery

Read team config to get names and capabilities.

Location: `~/.claude/teams/{team-name}/config.json`

Example:

```json
{
  "members": [
    {
      "name": "security-reviewer",
      "agentId": "uuid-here",
      "agentType": "team-reviewer"
    },
    {
      "name": "perf-reviewer",
      "agentId": "uuid-here",
      "agentType": "team-reviewer"
    }
  ]
}
```

Always message by `name`; never assign by `agentId`.

## Related Skills

- [team-composition-patterns](../team-composition-patterns/SKILL.md) — Select agent types and team size before establishing communication norms
- [parallel-feature-development](../../dev-workflows/parallel-feature-development/SKILL.md) — Use communication protocols to coordinate integration handoffs between parallel implementers

## Resources

- `references/`
  - `references/messaging-patterns.md` — ready-to-send templates.
  - `references/full-guide.md` — anti-pattern matrix, troubleshooting, and deeper operations guidance.

Load these only when the active task needs the extra detail; keep `SKILL.md` as the activation workflow.
