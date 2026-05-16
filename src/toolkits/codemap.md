# src/toolkits/

## Responsibility

`src/toolkits/` contains config-gated personal toolkit integrations that can be
wired into plugin runtime without forcing global defaults.

Current slice includes:

- `command-registry.ts`: helper to register slash-command templates while
  preserving user overrides.
- `plugin-health.ts`: integrated plugin status/doctor tools plus command
  registration.
- `github/`: integrated GitHub toolkit split by domain:
  - `helpers.ts`: shell helpers, command builders, suite status collector.
  - `repo.ts`: tree/search/branch tools.
  - `issues.ts`: issue create/update/comment/list tools.
  - `pull-requests.ts`: PR diff/comments/comment/review/context tools.
  - `pr-workflow.ts`: review queue, changed files, CI status tools.
  - `status.ts`: suite status and doctor diagnostics tools.
  - `index.ts`: toolkit composition plus gh command template registration.
- `review/`: integrated review toolkit:
  - `state.ts`: persisted auto-review state and compatibility path helpers.
  - `git.ts`: changed-file diff helpers backed by shell runner.
  - `analyzers.ts`: pure file analyzers (complexity, coverage gaps,
    dead exports, risk buckets).
  - `index.ts`: review tool definitions, command template registration,
    optional idle-event reminder hook.
- `caveman/`: integrated caveman toolkit:
  - `modes.ts`: canonical mode list, aliases, normalization.
  - `prompts.ts`: per-mode system prompt builders and stop/resume regex.
  - `state.ts`: state file persistence, TTL cleanup, session/default mode
    operations, and active-flag compatibility writes.
  - `index.ts`: `caveman_mode` tool, caveman command templates,
    event/chat/system hooks.
- `observe/`: integrated observe toolkit:
  - `db.ts`: SQLite schema/runtime, legacy migration, loop/event helpers,
    and observe state counts.
  - `render.ts`: pure formatters for loop/status/history/prune and
    observation-state/system-note blocks.
  - `index.ts`: observe tools, observe command templates, event hooks,
    and system transform hook.
- `rtk.ts`: integrated RTK rewrite hook for `bash`/`shell` command preflight,
  startup binary detection (`which rtk`), and fail-open rewrite behavior.

## Export surface

- `registerCommandTemplates`
- `createGithubToolkit`
- `createPluginHealthToolkit`
- `createReviewToolkit`
- `createCavemanToolkit`
- `createObserveToolkit`
- `createRtkToolkit`
- Types: `CommandTemplate`, `PluginHealthStatus`

## Runtime integration

- `src/index.ts` creates toolkit instances only when corresponding
  `config.toolkits.*` flags are enabled.
- Toolkit tool maps are spread into plugin `tool` registration conditionally.
- Toolkit command templates are injected through the plugin `config` hook.
