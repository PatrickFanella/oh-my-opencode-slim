# Team Communication Protocols: Full Guide

Detailed operating reference. Keep `SKILL.md` lightweight for activation.

## Message-Type Decision Matrix

| Need | Message type | Why |
|---|---|---|
| One teammate action/update | `message` | Lowest noise and cost |
| All teammates must react now | `broadcast` | Shared critical event |
| Graceful termination | `shutdown_request` | Explicit closeout handshake |

## Anti-Pattern Matrix

| Anti-pattern | Problem | Better pattern |
|---|---|---|
| Broadcast routine updates | High noise, high fan-out cost | Direct `message` |
| Use chat as structured status channel | Poor machine/state traceability | Use task/status tools |
| Skip interface handoffs | Teammates build against stale contracts | Send handoff message when ready |
| Micromanage via frequent pings | Interrupts execution loops | Milestone check-ins |
| Use UUIDs for recipient selection | Hard to read, high routing risk | Use teammate `name` |
| Keep idle teammates lingering | Wasted capacity | Reassign or shut down |

## Plan Approval Details

Flow:

1. Teammate in `plan_mode_required` explores with read-only tools.
2. Teammate exits plan mode -> lead gets `plan_approval_request`.
3. Lead responds with `plan_approval_response`.

### Approve

```json
{
  "type": "plan_approval_response",
  "request_id": "abc-123",
  "recipient": "implementer-1",
  "approve": true
}
```

### Reject with actionable feedback

```json
{
  "type": "plan_approval_response",
  "request_id": "abc-123",
  "recipient": "implementer-1",
  "approve": false,
  "content": "Please add error handling for the API calls"
}
```

## Shutdown Handling Details

If teammate rejects shutdown:

1. Read reason from `shutdown_response`.
2. Wait for current task/milestone completion.
3. Retry `shutdown_request`.
4. Force only when explicitly required and safe.

After all teammates approve, run `TeamDelete`.

## Teammate Discovery Notes

Config path: `~/.claude/teams/{team-name}/config.json`

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

Use `name` for routing and assignment. Treat `agentId` as internal metadata only.

## Troubleshooting

### Teammate not responding

- Check if active vs idle.
- Active teammates may process messages after current execution step.
- Idle teammates need reassignment or shutdown.

### Broadcast overuse

- Replace routine broadcasts with direct updates.
- Reserve broadcasts for shared contract breaks or global blockers.

### Unexpected shutdown rejection

- Usually active work not finished.
- Respect unsaved work; retry after completion.

### `plan_approval_request` missing `request_id`

- Ask teammate to re-enter plan mode and call `ExitPlanMode` again.

### Cross-wait deadlock between teammates

- Lead sends a direct unblock message to one side with stub/partial contract.
- Establish temporary ownership to break circular waiting.
