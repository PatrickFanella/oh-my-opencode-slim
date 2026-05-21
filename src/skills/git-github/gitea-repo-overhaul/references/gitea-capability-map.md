# Gitea Capability Map

Observed target: Gitea `1.26.1` at `https://git.subcult.tv/`.

Use this as an implementation map. Re-check swagger on the live instance before
large automation runs. On this instance, `tea api /swagger.v1.json` can 404
because `tea api` prefixes `/api/v1`; use direct fetch instead:

```bash
curl -sS -A opencode-audit https://git.subcult.tv/swagger.v1.json
```

## Core repo settings

Repo create/edit supports or reports:

- `default_branch`
- `description`
- `private`
- `has_issues`
- `has_wiki`
- `has_projects`
- `projects_mode`
- `has_pull_requests`
- `has_actions`
- `has_packages`
- `topics`

Useful endpoints:

- `GET /api/v1/repos/{owner}/{repo}`
- `PATCH /api/v1/repos/{owner}/{repo}`
- `GET /api/v1/repos/{owner}/{repo}/branches`
- `GET /api/v1/repos/{owner}/{repo}/branches/{branch}`
- `POST /api/v1/repos/{owner}/{repo}/branches`
- `GET /api/v1/repos/{owner}/{repo}/branch_protections`
- `POST /api/v1/repos/{owner}/{repo}/branch_protections`

Branch lists are paginated and can be truncated. Verify default branches with the
direct branch endpoint before declaring a repo blocked.

### Soft branch protection payload

Use `rule_name`, not deprecated `branch_name`. This payload blocks force-pushes
while preserving normal direct pushes for users with write access:

```json
{
  "rule_name": "main",
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

Do not enable required approvals or status checks broadly. Add them only after a
repo-specific workflow has passed and maintainers can still push/merge.

Before creating a soft rule, inspect existing rules. Treat a stricter exact rule
or applicable wildcard rule as compliant. Never replace or patch away existing
required reviews, required checks, whitelists, admin override settings, or push
restrictions without repo-specific approval.

### Non-destructive default-branch migration

For `master` → `main` after approval:

```json
POST /repos/{owner}/{repo}/branches
{"new_branch_name":"main","old_ref_name":"master"}

PATCH /repos/{owner}/{repo}
{"default_branch":"main"}
```

Keep `master` intact and verify both refs point at the same commit. Do not delete
or lock the old branch in the same batch.
If `main` already exists and differs from `master`, stop for repo-specific
approval instead of changing the default branch.

## Labels

- `GET /repos/{owner}/{repo}/labels`
- `POST /repos/{owner}/{repo}/labels`
- `PATCH /repos/{owner}/{repo}/labels/{id}`
- `DELETE /repos/{owner}/{repo}/labels/{id}`
- `GET /orgs/{org}/labels`
- `POST /orgs/{org}/labels`

Avoid deleting labels currently used by issues unless the user approves a merge
or remap.

## Milestones

- `GET /repos/{owner}/{repo}/milestones`
- `POST /repos/{owner}/{repo}/milestones`
- `PATCH /repos/{owner}/{repo}/milestones/{id}`
- `DELETE /repos/{owner}/{repo}/milestones/{id}`

Use milestones for real releases/roadmaps, not as generic categories.

## Issues

- `GET /repos/{owner}/{repo}/issues`
- `POST /repos/{owner}/{repo}/issues`
- `PATCH /repos/{owner}/{repo}/issues/{index}`
- comments, labels, deadlines, dependencies, pin/lock, reactions,
  subscriptions, stopwatch, timeline, and assets are available.

Use `type=issues` to avoid PRs when listing issues if supported by the endpoint.

## Pull requests

- `GET /repos/{owner}/{repo}/pulls`
- `POST /repos/{owner}/{repo}/pulls`
- `POST /repos/{owner}/{repo}/pulls/{index}/merge`
- reviews, requested reviewers, files, commits, and compare endpoints exist.

Do not auto-merge PRs unless explicitly requested for a repo.

## Wiki

- `GET /repos/{owner}/{repo}/wiki/pages`
- `POST /repos/{owner}/{repo}/wiki/new`
- `GET/PATCH/DELETE /repos/{owner}/{repo}/wiki/page/{pageName}`
- `GET /repos/{owner}/{repo}/wiki/revisions/{pageName}`

Wiki may be empty even when `has_wiki=true`.

Wiki create/edit may appear to fail if the CLI response is empty or non-JSON.
When the API call is ambiguous, verify with:

```text
GET /repos/{owner}/{repo}/wiki/page/Repository%20Maintenance
```

The first real run saw this on one repo: create returned a parse error, but the
page existed and had the expected content.

## Releases

- `GET /repos/{owner}/{repo}/releases`
- `POST /repos/{owner}/{repo}/releases`
- `GET /repos/{owner}/{repo}/releases/latest`
- tag lookup and release assets are available.

Create releases only when tags and release notes are trustworthy.

## Actions

- Repo endpoints exist for runs, jobs, artifacts, secrets, variables,
  workflows, and runners.
- Org/admin/user action endpoints are also present.
- CLI token generation:

```bash
gitea actions generate-runner-token --scope owner[/repo]
```

Local instance notes:

- Actions are enabled.
- Default actions URL is `github`.
- Log retention is 30 days.
- Artifact retention is 14 days.
- Runner `almaz-docker-01` exists.

## Topics

- `GET /repos/{owner}/{repo}/topics`
- `PUT /repos/{owner}/{repo}/topics`
- `PUT /repos/{owner}/{repo}/topics/{topic}`
- `DELETE /repos/{owner}/{repo}/topics/{topic}`
- `GET /topics/search`

Topics should be lowercase, concise, and stable.

## Packages

Package endpoints are owner-scoped rather than repo-scoped:

- `/packages/{owner}/...`

Use package cleanup/publishing automation only with explicit package policy.
Enabling packages can expose generated package-index repos such as
`_cargo-index`. Re-run repository inventory after package/settings batches and
catch up labels/issues/protection/wiki for late-discovered repos.

## Projects

Repo metadata exposes `has_projects` and `projects_mode`. During skill creation,
no `/projects` paths were visible in swagger. Treat project-board automation as
capability-dependent: inspect current swagger/UI before claiming project boards
were created.

If API support is missing, report a manual UI step.

## Gitea CLI

Useful CLI commands:

- `gitea dump-repo`
- `gitea restore-repo`
- `gitea admin repo-sync-releases`
- `gitea actions generate-runner-token`

`dump-repo` / `restore-repo` supports units such as wiki, issues, labels,
releases, release assets, milestones, pull requests, and comments.
