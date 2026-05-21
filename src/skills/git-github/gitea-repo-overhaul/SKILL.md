---
name: gitea-repo-overhaul
description: End-to-end Gitea/Forgejo repository overhaul workflow for self-hosted repos. Use when asked to inventory, modernize, normalize, audit, or aggressively improve Gitea repos by creating manifests/reports, normalizing labels/issues/wiki pages, enabling repo units, adding soft branch protections, migrating default branches, planning workflows/releases/packages, and keeping repo settings sane.
---

# Gitea Repo Overhaul

Use this skill to run a controlled but aggressive overhaul across Gitea or
Forgejo repositories. Default scope is all repos in the local Gitea instance
unless the user gives a narrower list.

## Operating stance

- Treat Gitea as the primary remote and GitHub as mirror/upstream when present.
- Use aggressive automation for reversible enrichment and normalization.
- Separate mutation levels: inventory-only, safe metadata, soft governance,
  default-branch migration, workflow PRs, and destructive/admin changes.
- Take an audit snapshot before mutations.
- Prefer repo-by-repo idempotent changes over broad blind changes.
- Preserve issue/user history where possible; when not possible, preserve clear
  provenance in internal reports rather than noisy public issue bodies unless
  requested.
- Treat workflows, required status checks, deploy secrets, package cleanup, and
  strict branch rules as per-repo work even after broad overhaul approval.
- Re-read current state immediately before every mutation, skip already-compliant
  repos, and report drift from the previous snapshot.
- Keep secrets out of output: tokens, `.env`, runner files, webhook secrets,
  deploy keys, package credentials.

## Required resources

- Read `references/overhaul-lifecycle.md` before running a repo overhaul.
- Read `references/gitea-capability-map.md` when using Gitea API endpoints or
  deciding which feature can be automated.
- Read `references/batch-recipes.md` before applying broad safe metadata,
  governance, or default-branch batches.
- Use `templates/repo-audit-report.md` for per-repo reports.
- Use `templates/overhaul-manifest.md` for multi-repo tracking.

## Default workflow

1. **Inventory**
   - List target repos from Gitea.
   - Capture owner, name, default branch, clone URL, repo units, topics,
     visibility, mirror state, branch list, latest commits, issues, labels,
     milestones, wiki pages, releases, Actions workflows, and branch protection.
   - Identify GitHub mirror/upstream if a `github` remote or push mirror exists.

2. **Snapshot**
   - Save a machine-readable manifest outside the repo under `/tmp/opencode/` or
     a user-approved docs path.
   - Include current remotes, default branch, HEAD SHAs, repo settings, labels,
     milestones, open issue counts, wiki status, and branch protections.
   - Record rollback commands for every planned mutation.

3. **Classify each repo**
   - `green`: safe to auto-overhaul.
   - `yellow`: needs review before branch/default/code changes.
   - `red`: skip until user resolves blocker.
   - Mark yellow/red when there are unmerged divergent branches, no obvious main
     branch, missing auth, unknown upstream, failed tests, or sensitive secrets.

4. **Safe metadata batch**
   - Mutate only labels and non-blocking roadmap/planning issues.
   - Add the default label taxonomy only to repos with no labels; preserve
     existing taxonomies unless the user approves mapping or merging.
   - Skip red repos unless the user explicitly accepts the blocker.
   - Preserve existing labels; do not rename/delete/merge labels automatically.

5. **Soft governance batch**
   - Enable safe repo units: issues, pulls, wiki, projects, packages, releases.
   - Enable Actions only after checking that existing workflows are absent or
     non-destructive. Repos with deploy/publish/destructive workflows need
     per-repo review.
   - Add an additive `Repository Maintenance` wiki page.
   - Do not overwrite existing wiki pages unless explicitly approved.
   - Add soft protection to the current default branch: normal pushes allowed,
     force-push disabled, no required checks/reviews.
   - Inspect existing protections first. Treat stricter existing rules as
     compliant; never weaken reviews, status checks, whitelists, or admin settings
     without repo-specific approval.
   - Re-inventory after this batch; package-generated repos such as
     `_cargo-index` can appear after package features are enabled.

6. **Default-branch checkpoint**
   - Only migrate `master` to `main` after explicit approval for that mutation
     level.
   - Use the non-destructive sequence: create `main` from `master`, protect
     `main`, patch default branch to `main`, keep `master` intact, verify both
     refs point at the same commit.
   - If `main` already exists and differs from `master`, stop for repo-specific
     approval instead of switching defaults.
   - Leave intentional nonstandard defaults such as `dev` unchanged unless the
     user names them.

7. **Code freshness checkpoint**
   - Compare Gitea default branch against GitHub mirror/upstream and local clones.
   - Prefer fast-forwarding Gitea from the trusted freshest branch.
   - Stop for explicit user approval before force pushes, branch deletion,
     squashing, rebasing shared branches, or replacing history.

8. **Docs and README pass**
   - Inspect README, docs directory, examples, compose files, package files,
     CI/workflow files, and deployment docs.
   - Update README/docs through per-repo PRs unless the user explicitly approves
     direct commits.
   - Add missing quickstart, development, test, deploy, and repo ownership notes.
   - If docs are substantial, propose wiki conversion using the wiki policy in
     `references/overhaul-lifecycle.md`.

9. **Issues and planning pass**
   - Close stale issues only when clearly resolved by code/docs and after noting
     evidence.
   - Create new issues for discovered gaps, broken tests, missing docs,
     migration risks, TODO clusters, or release blockers.
   - Apply labels/milestones/projects consistently.
   - Do not create noisy duplicate issues; deduplicate by title/topic first.

10. **Actions and quality gates**
    - Ensure `.gitea/workflows/` or `.github/workflows/` has a sensible workflow
      for the repo type.
    - Add workflow files through per-repo branches/PRs after stack detection.
    - Prefer smoke/lint/test workflows before deploy workflows.
    - Do not require status checks until the workflow has passed once on that
      repo.
    - Run available local checks before pushing workflow changes.
    - Confirm Gitea Actions runner availability when workflows are expected to
      execute.

11. **Projects / roadmap**
   - Use projects when the repo has active multi-issue work.
   - Create project boards only when there are enough issues to justify them.
   - Suggested columns: Backlog, Ready, In Progress, Review, Done.
   - If the current Gitea API cannot automate a project feature, document the
     manual UI step instead of pretending it is done.

12. **Verify and report**
    - Verify remotes, branch HEADs, settings, labels, issues, wiki pages,
      workflows, and mirror status.
    - After every broad batch, re-list all repos and confirm there are no missing
      labels, planning issues, default-branch soft protections, or maintenance
      wiki pages in the intended scope.
    - Produce a summary grouped by repo: changed, skipped, needs approval,
      failed, and next actions.
    - Include exact file paths and URLs, but not secret values.

## Mandatory approval gates

Ask for explicit user approval before:

- Force-pushing or rewriting history.
- Changing a default branch. If approved, prefer create-new-default + switch +
  keep-old-branch, not delete/rename.
- Deleting branches, tags, releases, issues, wiki pages, packages, or repos.
- Making private repos public or changing visibility.
- Adding deploy secrets, package credentials, webhooks, or third-party tokens.
- Adding or enabling deploy workflows that can modify production infrastructure.
- Creating tags, creating releases from unverified tags, deleting releases, or
  cleaning packages without repo-specific approval.
- Requiring status checks or reviews on branch protection before the workflow has
  passed once and maintainers can still push/merge.
- Bulk-closing issues when evidence is uncertain.

## Gitea defaults for this homelab

- Gitea URL: `https://git.subcult.tv/`.
- Internal origin for runner/API from `almaz`: `http://10.0.0.56:3005/`.
- Gitea version observed during skill creation: `1.26.1`.
- Actions are enabled and an `almaz-docker-01` runner exists.
- Default owner set usually includes `PatrickFanella`, `onnwee`, and
  `subculture-collective`.

## Delegation guidance

- Use `@explorer` for broad repo inventory, pattern search, and audit summaries.
- Use `@oracle` for risky branch/default-branch/history decisions and final
  quality review of proposed overhaul plans.
- Use `@fixer` for bounded repo edits after the audit report defines exact file
  changes.
- Use `@librarian` when checking current Gitea, Actions, language/framework, or
  package-manager docs.

## Output contract

Every overhaul run should end with:

- Target repo list.
- Snapshot/report location.
- Counts of changed/skipped/blocked repos.
- Branch/code freshness status.
- Metadata/features status.
- Docs/wiki status.
- Issues/projects status.
- Actions status.
- Approval-needed list.
- Follow-up plan for workflow PRs, strict branch rules, releases/packages, and
  destructive cleanup that was intentionally not automated.
- Exact next commands or UI steps.
