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

## Commands

Board Runtime exposes a read-only `/board` command for inspection.

- `/board status` shows runtime state (`enabled`, mode, council escalation,
  role count, recent decision count).
- `/board roles` lists configured board roles with id, title, agent, and
  priority.
- `/board route <request>` previews routing on a request and records one
  in-memory decision so you can inspect action, reason, and candidates.

This command is intentionally read-only in this phase.

- no config mutation;
- no persistent state writes;
- no live auto-routing changes;
- no TUI integration changes.

Future role editing and mutation commands come after this read-only surface is
stable.

## Default Board Groups

The installer materializes five default groups:

- **BUILD** — backend, language, and test advisors.
- **OPS** — cloud, data, observability, SRE, and security advisors.
- **GROWTH** — content, copy, conversion, launch, SEO, and social advisors.
- **PRODUCT** — agent-systems, devtools product, DX documentation, and
  maintainer-strategy advisors.
- **MYTH** — documentation artifacts, media, story, SUBCULT creative direction,
  and worldbuilding advisors.
