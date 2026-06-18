# Bun Exit Crash Triage

This note tracks how blacktower treats Bun shutdown crashes observed when
OpenCode exits.

## Current classification

The current evidence points to an upstream Bun/OpenCode runtime shutdown issue,
especially in standalone executable cleanup paths. blacktower can trigger or
amplify shutdown work through timers, fetches, local servers, and spawned
processes, but the TypeScript plugin code does not perform native memory work
that would directly explain a segmentation fault.

Published `@opencode-ai/plugin@1.3.17` type definitions do not expose a
plugin-level dispose or shutdown hook. Do not add an unsupported lifecycle hook
as a presumed fix.

## Evidence to collect

When reporting or investigating this class of crash, capture:

- Bun version, OpenCode version, OS, architecture, and install method.
- Whether OpenCode is running as a standalone binary, through `bunx`, or through
  an installed Bun runtime.
- Whether the crash reproduces with blacktower disabled.
- Whether the crash reproduces with a fresh OpenCode config and an empty
  workspace.
- The complete Bun panic output and any core dump or crash log.
- Whether the stack mentions timer cleanup, immediate tasks, `Bun.serve`,
  `fetch`, subprocesses, SQLite, or JavaScriptCore finalization.

## Isolation checklist

If the crash reproduces reliably, isolate optional blacktower subsystems one at
a time:

1. Auto-update checking and installs.
2. Control center web API and SSE clients.
3. Multiplexer session polling and child OpenCode attachments.
4. Todo continuation timers.
5. Scheduled-task support.

Record the exact config change that makes the crash disappear or return.

## Workarounds

- Upgrade Bun and OpenCode when newer releases are available.
- Prefer non-standalone execution when practical.
- Keep `autoUpdate` omitted or set to `false` unless automatic installs are
  explicitly desired.
- Minimize optional long-lived integrations while collecting crash evidence.

## Repository hardening policy

blacktower should treat shutdown-sensitive code conservatively:

- Clear and `unref()` timers when they are no longer needed.
- Avoid unread subprocess pipes in background work.
- Prefer notification-only background update behavior by default.
- Stop local servers, polling loops, and child processes through explicit
  cleanup paths when the host API provides one.
- Document unknowns instead of claiming a plugin-side fix for an upstream
  runtime segmentation fault without proof.
