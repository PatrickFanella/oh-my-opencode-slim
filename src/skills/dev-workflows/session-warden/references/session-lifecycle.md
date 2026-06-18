# Delegated Session Lifecycle Reference

## Known lifecycle owners

- `src/hooks/task-session-manager/` tracks native task sessions and short aliases.
- `src/utils/background-job-board.ts` tracks cancellable background job state.
- `src/tools/cancel-task.ts` aborts owned delegated task sessions.
- `src/tools/subtask/` creates bounded helper sessions.
- `src/council/` creates councillor worker sessions.
- `src/multiplexer/` mirrors sessions into tmux/zellij.

## Invariants

- A parent session owns which child tasks can be cancelled.
- Cleanup events can arrive after tool output; state transitions must be
  idempotent.
- Cancellation is not rollback. Partial file edits remain on disk.
- Unknown state means “could not prove terminal outcome,” not failure.
- Subtask/council helper sessions must not be confused with scheduled tasks.

## Common race bugs

- `cancel_task` marks cancelled, then `session.deleted` overwrites unknown.
- Tool output marks running but no later signal marks completed.
- A prompt timeout leaves the child session generating in the background.
- Pane close waits forever on tmux/zellij process exit.
- Parent deletion removes child aliases from the wrong parent scope.
