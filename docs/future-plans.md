# Future Plans

This document is the parking lot for planned Blacktower improvements. Keep it focused
on user-visible outcomes, with enough notes that future implementation work can
be split into issues or PRs.

## Near-Term Roadmap

### Simpler Commands

Goal: make the common install and daily-use paths easier to remember.

- Add short, copyable commands for the full bootstrap path.
- Consider package scripts or CLI aliases for common flows such as:
  - full install/bootstrap
  - update existing install
  - dry-run preview
  - repair/recreate config directory
- Keep advanced flags available, but make the recommended path one command.

### Actual Install TUI

Goal: replace the current mostly flag-driven install flow with a real guided
terminal UI.

- Guide users through provider choice, DCP/quota/RTK/task scheduler options,
  config backup/reset behavior, and shell helper setup.
- Show a preflight summary before writing files.
- Support dry-run previews from the same UI.
- Make errors actionable with recovery steps and paths to affected files.

### Fix `opencode-tasks` Error

Goal: make scheduled-task installation reliable and self-healing.

- Capture the current `opencode-tasks` failure mode and expected command output.
- Validate plugin install, daemon install, and `/loop` command install
  separately.
- Add repair guidance when the daemon or commands are missing.
- Keep the bundled `scheduled-tasks` skill aligned with the installed runtime
  behavior.

### Add Agents to Default Install

Goal: default installs should include the full intended agent board without
manual follow-up.

- Materialize built-in/custom agent definitions needed for the default board.
- Ensure default model/provider choices work after a fresh bootstrap.
- Keep custom board agents visible in docs, TUI status, and runtime delegation
  prompts.
- Add tests that a fresh install exposes the expected agent set.

### Agent Builder / Editor

Goal: provide a supported way to create and maintain custom agents.

- Add an interactive builder for name, description, model, mode, tools, MCPs,
  skills, permissions, and prompt.
- Add an editor flow for existing agent JSON definitions.
- Validate definitions before saving and show exact schema errors.
- Include preview/test actions so users can verify the agent loads correctly.

### Task List / Scheduler

Goal: make task planning, loops, and scheduled work a first-class workflow.

- Surface active loops and scheduled tasks in a clear list view.
- Add commands for create/list/stop/pause/resume/edit.
- Integrate with TUI sidebar/status so scheduled work is visible.
- Document persistence, daemon lifecycle, and recovery for failed scheduled
  tasks.

## Notes for Future Work

- Prefer small, testable PRs; each roadmap item should have at least one
  verification command and one user-facing doc update.
- Changes that alter install output should update `README.md`,
  `docs/installation.md`, and relevant codemaps.
- Skill assignment changes can start from
  [`skill-assignments-editable.md`](skill-assignments-editable.md).
- Changes that touch scheduler/task behavior should verify both CLI behavior
  and runtime/TUI visibility.
