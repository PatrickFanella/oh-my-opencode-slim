# Control Surface Principles

## Operator-first hierarchy

Every control surface should answer:

1. What is running?
2. What changed recently?
3. What needs action?
4. What is risky or irreversible?
5. What can I safely ignore?

## State vocabulary

Prefer explicit states:

- running
- completed
- failed
- cancelled
- unknown
- stale
- waiting for user

Avoid ambiguous labels like “done?” or “maybe stopped.”

## Dangerous action copy

Use verb-specific copy:

- Cancel delegated task
- Stop scheduler run
- Delete local artifact
- Remove worktree

Do not use a generic “kill” or “clear” label unless the action is purely local
and reversible.
