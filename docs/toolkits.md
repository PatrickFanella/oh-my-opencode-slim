# Integrated Toolkits

Integrated toolkits port selected personal OpenCode plugins into this repo as
first-class, config-gated features.

## Included Toolkit Flags

- `pluginHealth`
- `github`
- `review`
- `observe`
- `caveman`
- `rtk`

## Scope in This Slice

- Implemented now: `pluginHealth`, `github`, `review`, `caveman`, `observe`,
  `rtk`
- Config gates added now for all flags above

## GitHub Toolkit (Implemented)

Enabled via `toolkits.github: true`.

### Tools

- `gh_tree`
- `gh_search`
- `gh_branch_list`
- `gh_issue_create`
- `gh_issue_update`
- `gh_issue_comment`
- `gh_issue_list`
- `gh_pr_diff`
- `gh_pr_comments`
- `gh_pr_comment`
- `gh_pr_review`
- `gh_pr_context`
- `gh_review_queue`
- `gh_changed_files`
- `gh_ci_status`
- `gh_suite_status`
- `gh_doctor`

### Slash Commands

- `gh-branch-list`
- `gh-changed-files`
- `gh-ci-status`
- `gh-doctor`
- `gh-issue-comment`
- `gh-issue-create`
- `gh-issue-update`
- `gh-issues`
- `gh-pr-comment`
- `gh-pr-context`
- `gh-pr-review`
- `gh-pr`
- `gh-review-queue`
- `gh-search`
- `gh-suite-status`
- `gh-tree`

## Review Toolkit (Implemented)

Enabled via `toolkits.review: true`.

### Tools

- `review_diff`
- `review_todos`
- `review_complexity`
- `review_dead_exports`
- `review_search`
- `review_coverage_gaps`
- `review_changed_files`
- `review_auto`
- `review_summary`
- `review_pr_ready`

### Slash Commands

- `review-auto`
- `review-auto-off`
- `review-auto-on`
- `review-auto-status`
- `review-changed-files`
- `review-complexity`
- `review-coverage-gaps`
- `review-dead-exports`
- `review-diff`
- `review-pr-ready`
- `review-search`
- `review-summary`
- `review-todos`

### State Compatibility and Idle Reminder

- Reuses legacy state file path:
  `~/.config/opencode/review-tools-state.json`.
- `review_auto` toggles `autoReview` in that state.
- When enabled, a best-effort idle event reminder nudges users to run review
  tools when changed files are detected.

## Caveman Toolkit (Implemented)

Enabled via `toolkits.caveman: true`.

### Tools

- `caveman_mode`

### Slash Commands

- `caveman`
- `caveman-status`
- `caveman-commit`
- `caveman-review`
- `caveman-compress`

### Modes and Actions

`caveman_mode` supports actions:

- `get`
- `set`
- `clear`
- `set-default`
- `reset-default`
- `list`

Modes:

- `normal`
- `lite`
- `full`
- `ultra`
- `wenyan-lite`
- `wenyan`
- `wenyan-ultra`
- `commit`
- `review`

Default mode is `ultra`.

### State and Compatibility Paths

- State file: `~/.config/opencode/caveman-state.json`
- Active-flag file: `~/.config/opencode/.caveman-active`
- Legacy active-flag file: `~/.claude/.caveman-active`

### Migration Warning

Before enabling `toolkits.caveman`, remove local caveman plugin entries from
your OpenCode plugin list. The integrated toolkit and local plugin both
register `caveman_mode`; duplicate tool names can conflict.

## Excluded Systems

- DCP remains an external plugin.
- Quota remains an external plugin.

## Configuration

All toolkits default to disabled:

```jsonc
{
  "toolkits": {
    "pluginHealth": true,
    "github": true,
    "review": true,
    "observe": true,
    "caveman": true,
    "rtk": true
  }
}
```

## Migration Policy

For toolkits with unique tool names, enable integrated toolkits first, validate
parity, then remove matching local plugin entries from
`~/.config/opencode/opencode.json`. For caveman, remove the local caveman plugin
entry before enabling `toolkits.caveman` because both implementations register
`caveman_mode`. Keep DCP and quota entries in place.

## Observe Toolkit (Implemented)

Enabled via `toolkits.observe: true`.

### Tools

- `observe_start`
- `observe_stop`
- `observe_status`
- `observe_list`
- `observe_history`
- `observe_prune`

### Slash Commands

- `observe-start`
- `observe-stop`
- `observe-status`
- `observe-list`
- `observe-history`
- `observe-prune`

### DB, Legacy Migration, and Compatibility Paths

- Per-project DB path:
  `~/.config/opencode/observe/<projectKey(directory)>.db`
- `projectKey(directory)` uses FNV-1a hash of resolved project directory.
- First open runs best-effort one-time legacy migration from:
  - `~/.config/opencode/observe-state.json`
  - `~/.config/opencode/observe-history.jsonl`

### Loop/Event Hook Behavior

- `session.created`: bind unclaimed active loops to the new session and inject
  an `<observation-resume>` note.
- `session.deleted`: detach active loops from deleted session and clear pending
  locks.
- `session.compacted`: inject fresh `<observation-resume>` note for active
  loops.
- `session.idle`: prune stale rows, enqueue next due loop, and prompt one
  observe cycle.
- `message.part.updated`: parse `<observe-result ... />` and complete loop
  cycle.
- `experimental.chat.system.transform`: append `<observation-state>` block for
  active loops in current session.

All prompt injections are best-effort and fail open (never crash plugin).

## RTK Toolkit (Implemented)

Enabled via `toolkits.rtk: true`.

### Behavior

- Detects `rtk` binary once at plugin startup (`which rtk`) and disables itself
  if missing.
- Hooks `tool.execute.before`.
- Only targets `bash` and `shell` tool calls with string `output.args.command`.
- Runs `rtk rewrite <command>` via shell runner.
- Replaces `output.args.command` only when rewrite output is non-empty (after
  trim) and different from the original command.
- Fail-open: rewrite errors never crash or block tool execution.

## Removing Legacy Local Plugins

After integrated toolkits pass validation in your environment, remove these
legacy local plugin entries from `~/.config/opencode/opencode.json`:

```jsonc
"./plugins/github-tools.js",
"./plugins/review-tools.js",
"./plugins/observe-and-tune.js",
"./plugins/caveman.js",
"./plugins/plugin-health.js",
"./plugins/rtk.ts"
```

Keep these external plugins separate:

```jsonc
"@tarquinen/opencode-dcp@latest",
"@slkiser/opencode-quota"
```

Restart OpenCode after config changes. Do not remove DCP or quota while
migrating integrated toolkits.
