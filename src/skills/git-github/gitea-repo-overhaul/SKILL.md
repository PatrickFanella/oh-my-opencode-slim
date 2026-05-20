---
name: gitea-repo-overhaul
description: End-to-end Gitea repository overhaul workflow for self-hosted repos. Use when asked to modernize, normalize, audit, or aggressively improve Gitea repos by ensuring latest code is on main, issues/labels/milestones/projects are current, READMEs/docs/wiki are accurate, Actions are enabled, branch protections/settings are sane, and repo features are fully used.
---

# Gitea Repo Overhaul

Use this skill to run a controlled but aggressive overhaul across Gitea
repositories. Default scope is all repos in the local Gitea instance unless the
user gives a narrower list.

## Operating stance

- Treat Gitea as the primary remote and GitHub as mirror/upstream when present.
- Use aggressive automation for safe enrichment and normalization.
- Never do destructive branch/code/default-branch changes without a checkpoint.
- Take an audit snapshot before mutations.
- Prefer repo-by-repo idempotent changes over broad blind changes.
- Preserve issue/user history where possible; when not possible, preserve clear
  provenance in internal reports rather than noisy public issue bodies unless
  requested.
- Keep secrets out of output: tokens, `.env`, runner files, webhook secrets,
  deploy keys, package credentials.

## Required resources

- Read `references/overhaul-lifecycle.md` before running a repo overhaul.
- Read `references/gitea-capability-map.md` when using Gitea API endpoints or
  deciding which feature can be automated.
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

4. **Normalize safe metadata**
   - Enable repo units: issues, pulls, wiki, projects, Actions, packages.
   - Normalize labels from the chosen label taxonomy.
   - Create/update milestones only when the repo has a clear release/roadmap.
   - Add topics based on repo language, domain, deployment role, and owner.
   - Ensure repo descriptions are concise and accurate.

5. **Code freshness checkpoint**
   - Compare Gitea default branch against GitHub mirror/upstream and local clones.
   - Prefer fast-forwarding Gitea from the trusted freshest branch.
   - Stop for explicit user approval before force pushes, default-branch changes,
     branch deletion, squashing, rebasing shared branches, or replacing history.

6. **Docs and README pass**
   - Inspect README, docs directory, examples, compose files, package files,
     CI/workflow files, and deployment docs.
   - Update README/docs to match the current implementation.
   - Add missing quickstart, development, test, deploy, and repo ownership notes.
   - If docs are substantial, propose wiki conversion using the wiki policy in
     `references/overhaul-lifecycle.md`.

7. **Issues and planning pass**
   - Close stale issues only when clearly resolved by code/docs and after noting
     evidence.
   - Create new issues for discovered gaps, broken tests, missing docs,
     migration risks, TODO clusters, or release blockers.
   - Apply labels/milestones/projects consistently.
   - Do not create noisy duplicate issues; deduplicate by title/topic first.

8. **Actions and quality gates**
   - Ensure `.gitea/workflows/` or `.github/workflows/` has a sensible workflow
     for the repo type.
   - Prefer smoke/lint/test workflows before deploy workflows.
   - Run available local checks before pushing workflow changes.
   - Confirm Gitea Actions runner availability when workflows are expected to
     execute.

9. **Projects / roadmap**
   - Use projects when the repo has active multi-issue work.
   - Create project boards only when there are enough issues to justify them.
   - Suggested columns: Backlog, Ready, In Progress, Review, Done.
   - If the current Gitea API cannot automate a project feature, document the
     manual UI step instead of pretending it is done.

10. **Verify and report**
    - Verify remotes, branch HEADs, settings, labels, issues, wiki pages,
      workflows, and mirror status.
    - Produce a summary grouped by repo: changed, skipped, needs approval,
      failed, and next actions.
    - Include exact file paths and URLs, but not secret values.

## Mandatory approval gates

Ask for explicit user approval before:

- Force-pushing or rewriting history.
- Changing a default branch.
- Deleting branches, tags, releases, issues, wiki pages, packages, or repos.
- Making private repos public or changing visibility.
- Adding deploy secrets, package credentials, webhooks, or third-party tokens.
- Enabling deploy workflows that can modify production infrastructure.
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
- Exact next commands or UI steps.
