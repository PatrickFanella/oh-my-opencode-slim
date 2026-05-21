# Gitea Overhaul Batch Recipes

These recipes capture the proven sequence from the first full run on
`git.subcult.tv`. Use them as patterns, not blind scripts: always write a report
and verify live state after each batch.

Before mutating any repo in any recipe, re-read that repo's live state, compare
it to the prior snapshot, skip already-compliant repos, and report drift.

## 1. Inventory-only audit

Goal: produce evidence without mutations.

1. Create `/tmp/opencode/gitea-overhaul/<timestamp>/` with `raw/` and
   `reports/` subdirectories.
2. For each owner, page both:
   - `/users/{owner}/repos`
   - `/orgs/{owner}/repos`
3. For each repo, capture:
   - repo settings and default branch,
   - direct default-branch lookup,
   - branches, labels, issues, PRs, releases, topics, wiki pages,
   - branch protections,
   - README/docs/workflow presence.
4. Classify conservatively.
5. Write:
   - `manifest.json`
   - `manifest.md`
   - `raw/<owner_repo>.json`
   - `reports/<owner_repo>.md`

Report summary fields:

- total repos,
- green/yellow/red counts,
- red blockers,
- common recommendations,
- next batch recommendation.

## 2. Safe metadata batch

Allowed mutations:

- add the standard label taxonomy to repos with no labels,
- create one `[ROADMAP] Repository maintenance plan` issue on repos with no open
  issues.

If a repo already has labels, preserve them unless the user approves a mapping or
merge.

Skip:

- red repos,
- label deletion/renaming/merging,
- assignment, deadlines, milestones,
- branch/settings/workflow/wiki changes.

Default labels:

```text
type:bug
type:feature
type:docs
type:maintenance
type:security
type:question
priority:high
priority:medium
priority:low
status:blocked
status:needs-review
status:ready
area:ci
area:docs
area:infra
area:ux
```

Roadmap issue title:

```text
[ROADMAP] Repository maintenance plan
```

Roadmap issue guardrails:

```markdown
## Guardrails

- Do not change default branches, rewrite history, delete branches, change
  visibility, add deploy secrets, or enable deploy workflows without explicit
  approval.
- Prefer small pull requests for code, docs, or workflow changes.
- Keep secret values out of issue comments and reports.
```

Verify with counts and spot checks: labels exist, roadmap issue exists, red repos
were skipped.

## 3. Soft governance batch

Allowed mutations:

- enable disabled safe repo units for active repos,
- add soft default-branch protection,
- create an additive `Repository Maintenance` wiki page.

Enable Actions only after checking existing workflow files. If deploy, publish,
package, infrastructure, or other destructive workflows already exist, skip broad
enablement and move the repo to per-repo review.

Soft branch protection payload:

```json
{
  "rule_name": "<default-branch>",
  "enable_push": true,
  "enable_push_whitelist": false,
  "enable_force_push": false,
  "required_approvals": 0,
  "enable_status_check": false,
  "block_on_rejected_reviews": false,
  "block_on_official_review_requests": false,
  "block_on_outdated_branch": false,
  "dismiss_stale_approvals": false,
  "require_signed_commits": false,
  "block_admin_merge_override": false
}
```

Inspect existing protection rules first. Treat stricter exact or wildcard rules
as compliant. Never weaken required reviews, required checks, whitelists, admin
override settings, or push restrictions without repo-specific approval.

Wiki page title:

```text
Repository Maintenance
```

Wiki content should include:

- current default branch,
- link to roadmap issue when present,
- follow-up checklist from audit recommendations,
- guardrails against destructive changes and secret exposure,
- audit provenance.

Do not overwrite an existing `Repository Maintenance` page unless explicitly
approved.

If a wiki create call returns a parse/non-JSON error, read the page back before
marking it failed.

## 4. Default branch migration batch

Only after explicit approval.

For each `master` default repo:

1. Confirm current default is still `master`.
2. Confirm `master` branch exists.
3. If `main` already exists, verify it points at the same commit as `master`.
   If it differs, stop for repo-specific approval or an explicit fast-forward
   plan.
4. Create `main` from `master` if missing.
5. Add soft protection to `main`.
6. Patch `default_branch` to `main`.
7. Verify `main` and `master` point at the same commit.
8. Keep `master` intact.

Do not migrate intentional `dev` defaults unless the user names them. After
migrating the active repository, fetch the local clone and switch to `main` so
future work tracks `origin/main`.

## 5. Final live verification

After any broad mutation batch, re-list all repos and print:

- total repos,
- defaults by branch name,
- repos missing soft default-branch protection,
- repos missing `Repository Maintenance` wiki page,
- repos with no labels,
- repos with no open issues.

If a late-discovered repo appears, run catch-up metadata/governance on that repo
and repeat verification.

## 6. Workflows, releases, and packages

Use PRs for workflow files. Detect stack first, then add minimal smoke/lint/test
workflows. Do not add deploy/publish workflows broadly.

Create releases only from trustworthy existing tags and conservative notes. Do
not create tags, delete releases, or clean packages without repo-specific
approval.
