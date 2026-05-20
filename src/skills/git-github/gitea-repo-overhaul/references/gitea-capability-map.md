# Gitea Capability Map

Observed target: Gitea `1.26.1` at `https://git.subcult.tv/`.

Use this as an implementation map. Re-check swagger on the live instance before
large automation runs.

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
- `GET /api/v1/repos/{owner}/{repo}/branch_protections`
- `POST /api/v1/repos/{owner}/{repo}/branch_protections`

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
