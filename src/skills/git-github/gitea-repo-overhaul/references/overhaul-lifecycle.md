# Gitea Repo Overhaul Lifecycle

## Phase 0: Setup and safety

1. Confirm target scope: all Gitea repos by default, with user-provided include
   or exclude patterns allowed.
2. Confirm mutation level. This skill defaults to aggressive automation, but
   destructive changes still require explicit approval.
3. Confirm credentials:
   - Gitea API token available without printing it.
   - Git SSH access works for Gitea remotes.
   - GitHub access works when GitHub mirror/upstream comparison is needed.
4. Create a run directory such as:

```text
/tmp/opencode/gitea-overhaul/YYYYMMDD-HHMMSS/
```

Store raw inventories and generated reports there unless the user requests a
repo-tracked docs location.

## Phase 1: Inventory schema

Capture at least these fields per repo:

```json
{
  "owner": "subculture-collective",
  "repo": "subcults",
  "full_name": "subculture-collective/subcults",
  "default_branch": "main",
  "visibility": "public|private|limited",
  "empty": false,
  "archived": false,
  "gitea_clone_ssh": "git@git.subcult.tv:owner/repo.git",
  "github_remote": "git@github.com:owner/repo.git",
  "head_sha": "...",
  "github_head_sha": "...",
  "branches": [],
  "tags": [],
  "topics": [],
  "repo_units": {
    "issues": true,
    "pull_requests": true,
    "wiki": true,
    "projects": true,
    "actions": true,
    "packages": true
  },
  "counts": {
    "open_issues": 0,
    "closed_issues": 0,
    "labels": 0,
    "milestones": 0,
    "releases": 0,
    "wiki_pages": 0,
    "actions_workflows": 0
  },
  "classification": "green|yellow|red",
  "blockers": []
}
```

## Phase 2: Freshest-code decision tree

Use this order:

1. If Gitea `main` equals GitHub/main or configured upstream, mark fresh.
2. If GitHub/main is ahead and Gitea can fast-forward, propose or perform
   fast-forward depending on mutation mode.
3. If Gitea/main is ahead, verify push mirror state and avoid overwriting it.
4. If both have unique commits, classify yellow and request user approval.
5. If only `master` exists and no `main`, classify yellow before changing
   default branch.
6. If local clones have commits absent from both remotes, classify yellow and
   report exact local path/branch.

Never force-push or rewrite history without explicit approval.

## Phase 3: Repo feature baseline

Target baseline for active repos:

- Issues enabled.
- Pull requests enabled.
- Wiki enabled when docs are worth publishing separately.
- Projects enabled when there is active multi-issue work.
- Actions enabled when the repo has build/test/deploy needs.
- Packages enabled unless there is a reason to disable.
- Branch protection on default branch for repos with collaborators or deploys.
- Push mirror configured if GitHub backup/public mirror is desired.

Archived or dormant repos may use a lighter baseline: accurate README,
description, topics, and issue tracker state, without projects/actions.

## Phase 4: Label taxonomy

Use a compact default taxonomy unless the repo already has a better one:

- `type:bug`
- `type:feature`
- `type:docs`
- `type:maintenance`
- `type:security`
- `type:question`
- `priority:high`
- `priority:medium`
- `priority:low`
- `status:blocked`
- `status:needs-review`
- `status:ready`
- `area:ci`
- `area:docs`
- `area:infra`
- `area:ux`

Merge or map existing labels rather than duplicating obvious equivalents. Do
not delete labels that are used by issues unless the user approves the mapping.

## Phase 5: README and docs audit

Check for:

- Accurate project purpose.
- Current install/dev/test commands.
- Environment variables documented by name only, not value.
- Service dependencies and ports.
- Docker/compose instructions when relevant.
- Gitea/GitHub remote policy.
- Actions/CI status and workflow explanation.
- Deployment or release notes.
- License and ownership.

If docs are absent or stale, create issues or update docs directly depending on
scope and confidence.

## Phase 6: Wiki conversion policy

Convert or mirror docs into wiki when:

- The docs are user/operator-facing rather than source-code-adjacent.
- There are multiple long Markdown files that users should browse outside the
  code tree.
- Operational runbooks, architecture notes, or roadmap docs are useful in the
  Gitea UI.

Keep docs in the repo when:

- They are required for development close to code.
- They must be reviewed in PRs with code changes.
- They are generated API/reference docs.

Recommended pattern: keep canonical docs in repo, publish curated wiki pages
for overview/runbook navigation. Avoid deleting repo docs just because a wiki
exists.

## Phase 7: Issue overhaul policy

For each repo:

1. Deduplicate open issues by title/topic.
2. Apply labels and milestone/project placement.
3. Close issues only when the code/docs clearly resolve them.
4. Create new issues for discovered gaps with concise acceptance criteria.
5. Prefer one issue per actionable unit, not giant omnibus issues.

Suggested issue body structure:

```markdown
## Goal

## Current evidence

## Acceptance criteria

- [ ] ...

## Notes
```

## Phase 8: Actions baseline

Start simple:

- Smoke workflow for every active repo.
- Language-specific lint/test workflow when package files reveal commands.
- Build workflow for buildable apps/libraries.
- Deploy workflow only after secrets, branch protection, and rollback are clear.

Prefer `.gitea/workflows/` for Gitea-native workflows unless the repo is meant
to run unchanged on GitHub too. Existing `.github/workflows/` can still run in
Gitea because this instance uses `.gitea/workflows,.github/workflows`.

## Phase 9: Final report

Group results:

- Completed automatically.
- Completed with warnings.
- Needs approval.
- Blocked.
- Skipped by policy.

Include exact repo URLs and local paths, plus the next command or UI action.
