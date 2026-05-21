# Gitea Repo Overhaul Lifecycle

## Phase 0: Setup and safety

1. Confirm target scope: all Gitea repos by default, with user-provided include
   or exclude patterns allowed.
2. Confirm mutation level. Use these exact levels in reports:
   - `inventory-only`: read API/repo state and write local reports only.
   - `safe-metadata`: labels and non-blocking roadmap/planning issues only.
   - `soft-governance`: additive wiki pages, repo-unit enablement, and soft
     default-branch protections only.
   - `default-branch-migration`: create a new default branch and switch default
     without deleting the old branch.
   - `workflow-pr`: create per-repo branches/PRs for workflow/docs/code files.
   - `destructive-admin`: deletion, visibility, package cleanup, force-push,
     secret/webhook/runner changes, strict branch rules.
3. Treat `destructive-admin` as always requiring explicit repo-specific approval.
4. Confirm credentials:
   - Gitea API token available without printing it.
   - Git SSH access works for Gitea remotes.
   - GitHub access works when GitHub mirror/upstream comparison is needed.
5. Create a run directory such as:

```text
/tmp/opencode/gitea-overhaul/YYYYMMDD-HHMMSS/
```

Store raw inventories and generated reports there unless the user requests a
repo-tracked docs location.

Run every broad batch from a fresh timestamped directory and keep raw JSON plus a
Markdown summary. Do not rely on chat history as the system of record.

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

Implementation notes from the first real run:

- Query both `/users/{owner}/repos` and `/orgs/{owner}/repos`, but tolerate one
  returning an error object. User owners are not orgs.
- Page repository lists; do not assume the first page is complete.
- Verify default branches with `GET /repos/{owner}/{repo}/branches/{branch}`.
  The branch list can be paginated/truncated; a missing branch in an unpaged list
  is not proof the default is invalid.
- Re-run inventory after enabling packages/features. Gitea can expose generated
  repos such as `_cargo-index` that were not in the first pass.

## Phase 2: Inventory classification

Use conservative classification:

- `green`: no blockers and only safe metadata/governance enrichment is needed.
- `yellow`: active repo, default branch/code/workflow/settings/docs decisions need
  review or PRs.
- `red`: archived/empty, missing credentials, failed critical API calls, default
  branch cannot be verified after direct branch lookup, or a dangerous mismatch is
  present.

Do not treat missing labels, missing roadmap issue, empty wiki, or absent smoke
workflow as red. Those are safe-metadata/governance candidates.

## Phase 3: Freshest-code decision tree

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

## Phase 4: Repo feature baseline

Target baseline for active repos:

- Issues enabled.
- Pull requests enabled.
- Wiki enabled when docs are worth publishing separately.
- Projects enabled when there is active multi-issue work.
- Actions enabled only after checking existing workflow files. If deploy,
  publish, package, infrastructure, or other destructive workflows already exist,
  move the repo to per-repo review before enabling Actions.
- Packages enabled unless there is a reason to disable.
- Soft branch protection on default branch for active repos: direct pushes still
  allowed, force-push disabled, no required checks/reviews initially.
- Push mirror configured if GitHub backup/public mirror is desired.

Archived or dormant repos may use a lighter baseline: accurate README,
description, topics, and issue tracker state, without projects/actions.

## Phase 5: Label taxonomy

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

In a `safe-metadata` batch, add the full taxonomy only to repos with no labels,
unless the user approves merging an existing taxonomy. If labels already exist,
preserve them and create roadmap issues without relabeling unless matching labels
are already present.

## Phase 6: Safe metadata batch

Allowed broad mutations after approval:

1. Add the default label taxonomy to repos with no labels.
2. Create one `[ROADMAP] Repository maintenance plan` issue on repos with no open
   issues.
3. Use non-blocking issue wording: discovery, checklist, and guardrails. Do not
   assign users, set deadlines, or create milestones unless requested.
4. Skip red repos and report them.
5. Verify by spot-checking labels/issues and by reporting counts.

Guardrail text for roadmap issues:

```markdown
## Guardrails

- Do not change default branches, rewrite history, delete branches, change
  visibility, add deploy secrets, or enable deploy workflows without explicit
  approval.
- Prefer small pull requests for code, docs, or workflow changes.
- Keep secret values out of issue comments and reports.
```

## Phase 7: Soft governance batch

Allowed broad mutations after approval:

1. Enable disabled safe repo units when the repo is active: issues, pull
   requests, wiki, projects, packages, releases.
   - Enable Actions only after checking existing workflow files. If deploy,
     publish, package, infrastructure, or other destructive workflows already
     exist, classify for per-repo review instead of enabling broadly.
2. Add an additive `Repository Maintenance` wiki page if missing.
3. Add soft default-branch protection:
   - normal pushes allowed,
   - force-push disabled,
   - required approvals `0`,
   - status checks disabled.
4. Inspect existing protections first. Treat stricter existing rules as
   compliant and never weaken required reviews, required checks, whitelists,
   admin override settings, or push restrictions without repo-specific approval.
5. Do not add workflow files or required status checks in this phase.
6. Do not overwrite existing wiki pages unless explicitly approved.
7. If a wiki create API call returns a parse/non-JSON error, verify by reading
   the page before marking failure. The page may have been created successfully.

## Phase 8: Default branch migration

Only run after explicit default-branch approval. For `master` → `main`:

1. Verify current default is `master`.
2. Verify `master` exists.
3. If `main` exists, verify it points at the same commit as `master`. If it
   differs, stop for repo-specific approval or an explicit fast-forward plan.
4. If `main` does not exist, create it from `master`.
5. Add soft protection to `main`.
6. Patch repo `default_branch` to `main`.
7. Verify `main` and `master` point at the same commit.
8. Keep `master` intact. Do not delete or lock it in the same batch.
9. For the active local checkout, fetch and switch to the new default branch.

Leave intentional nonstandard defaults such as `dev` unchanged unless the user
names them.

## Phase 9: README and docs audit

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

If docs are absent or stale, create issues or update docs through PRs. Direct
commits require explicit approval for that repo.

## Phase 10: Wiki conversion policy

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

The additive `Repository Maintenance` page is safe as a navigation/guardrails
page; it is not a substitute for canonical README/docs updates.

## Phase 11: Issue overhaul policy

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

## Phase 12: Actions baseline

Use per-repo PRs, not broad direct pushes. Start simple:

- Smoke workflow for every active repo.
- Language-specific lint/test workflow when package files reveal commands.
- Build workflow for buildable apps/libraries.
- Deploy workflow only after secrets, branch protection, and rollback are clear.

Never require a status check in branch protection until the workflow has run and
passed at least once on that repo. Do not add deploy/publish workflows in a broad
batch.

Prefer `.gitea/workflows/` for Gitea-native workflows unless the repo is meant
to run unchanged on GitHub too. Existing `.github/workflows/` can still run in
Gitea because this instance uses `.gitea/workflows,.github/workflows`.

## Phase 13: Final report

Group results:

- Completed automatically.
- Completed with warnings.
- Needs approval.
- Blocked.
- Skipped by policy.

Include exact repo URLs and local paths, plus the next command or UI action.
Also include a final live verification: total repos, defaults, missing soft
protections, missing maintenance wiki pages, repos with no labels, and repos with
no open issues.
