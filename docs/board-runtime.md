# Board Runtime

Board Runtime is the central orchestration subsystem for this project.

It owns:

- consultant role metadata;
- routing policy;
- delegation recommendations;
- council escalation policy;
- in-memory decision records for the first phase;
- future hooks for persistence and TUI/status display.

OpenCode remains the host runtime for auth, providers, model discovery, and
core sessions. DCP and quota remain separate systems.

## First Phase

The first phase makes Board runtime real without forcing a full rename or broad
behavior swap:

1. `board` config namespace.
2. typed Board role registry.
3. prompt rendering through `<Board Runtime>`.
4. route/policy functions.
5. runtime facade with in-memory decisions.

## Later Phases

- persistent Board decisions;
- TUI Board status;
- structured slash/runtime commands;
- deeper executor handoff;
- product rename and package identity migration.
