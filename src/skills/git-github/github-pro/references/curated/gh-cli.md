# Gh Cli

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `gh-cli-skill.md`

_Source topic: gh-cli_

**Purpose:** GitHub CLI (gh) comprehensive reference for repositories, issues, pull requests, Actions, projects, releases, gists, codespaces, organizations, extensions, and all GitHub operations from the command line.

# gh-cli

Thin GitHub CLI reference skill. Prefer the OpenCode GitHub plugin tools for issues, PRs, repo status, and review queues; use `gh` directly only when plugin coverage is missing.

## Workflow

1. Use this skill only when the request matches the frontmatter description.
2. Keep the main context short: read only the relevant reference file for the exact subtask.
3. Prefer existing scripts/templates/assets in this skill before writing ad hoc code.
4. Stop and ask when required credentials, CLIs, project context, or user confirmation are missing.

## Resources

- `references/full-guide.md` — detailed guidance.

## Notes


### From `github-actions-docs-skill.md`

_Source topic: github-actions-docs_

**Purpose:** Use when users ask how to write, explain, customize, migrate, secure, or troubleshoot GitHub Actions workflows, workflow syntax, triggers, matrices, runners, reusable workflows, artifacts, caching, secrets, OIDC, deployments, custom actions, or Actions Runner Controller, especially when they need official GitHub documentation, exact links, or docs-grounded YAML guidance.

## When to Use

Use this skill when the request is about:

- GitHub Actions concepts, terminology, or product boundaries
- Workflow YAML, triggers, jobs, matrices, concurrency, variables, contexts, or expressions
- GitHub-hosted runners, larger runners, self-hosted runners, or Actions Runner Controller
- Artifacts, caches, reusable workflows, workflow templates, or custom actions
- Secrets, `GITHUB_TOKEN`, OpenID Connect, artifact attestations, or secure workflow patterns
- Environments, deployment protection rules, deployment history, or deployment examples
- Migrating from Jenkins, CircleCI, GitLab CI/CD, Travis CI, Azure Pipelines, or other CI systems
- Troubleshooting workflow behavior when the user needs documentation, syntax guidance, or official references

Do not use this skill for:

- A specific failing PR check, missing workflow log, or CI failure triage. Use `gh-fix-ci`.
- General GitHub pull request, branch, or repository operations. Use `github`.
- CodeQL-specific configuration or code scanning guidance. Use `codeql`.
- Dependabot configuration, grouping, or dependency update strategy. Use `dependabot`.

## Workflow

### 1. Classify the request

Decide which bucket the question belongs to before searching:

- Getting started or tutorials
- Workflow authoring and syntax
- Runners and execution environment
- Security and supply chain
- Deployments and environments
- Custom actions and publishing
- Monitoring, logs, and troubleshooting
- Migration

If you need a quick starting point, load `references/topic-map.md` and jump to the closest section.

### 2. Search official GitHub docs first

- Treat `docs.github.com` as the source of truth.
- Prefer pages under <https://docs.github.com/en/actions>.
- Search with the user's exact terms plus a focused Actions phrase such as `workflow syntax`, `OIDC`, `reusable workflows`, or `self-hosted runners`.
- When multiple pages are plausible, compare 2-3 candidate pages and pick the one that most directly answers the user's question.

### 3. Open the best page before answering

- Read the most relevant page, and the exact section when practical.
- Use the topic map only to narrow the search space or surface likely starting pages.
- If a page appears renamed, moved, or incomplete, say that explicitly and return the nearest authoritative pages instead of guessing.

### 4. Answer with docs-grounded guidance

- Start with a direct answer in plain language.
- Include exact GitHub docs links, not just the docs homepage.
- Only provide YAML or step-by-step examples when the user asks for them or when the docs page makes an example necessary.
- Make any inference explicit. Good phrasing:
...

## Answer Shape

Use a compact structure unless the user asks for depth:

1. Direct answer
2. Relevant docs
3. Example YAML or steps, only if needed
4. Explicit inference callout, only if you had to connect multiple docs pages

## Search and Routing Tips

- For concept questions, prefer overview or concept pages before deep reference pages.
- For syntax questions, prefer workflow syntax, events, contexts, variables, or expressions reference pages.
- For security questions, prefer `Secure use`, `Secrets`, `GITHUB_TOKEN`, `OpenID Connect`, and artifact attestation docs.
- For deployment questions, prefer environments and deployment protection docs before cloud-specific examples.
- For migration questions, prefer the migration hub page first, then a platform-specific migration guide.
- If the user asks for a beginner walkthrough, start with a tutorial or quickstart instead of a raw reference page.

## Common Mistakes

- Answering from memory without verifying the current docs
- Linking the GitHub Actions docs landing page when a narrower page exists
- Mixing up reusable workflows and composite actions
- Suggesting long-lived cloud credentials when OIDC is the better documented path
- Treating repo-specific CI debugging as a documentation question when it should be handed to `gh-fix-ci`
- Letting adjacent domains absorb the request when `codeql` or `dependabot` is the sharper fit


### From `github-actions-templates-skill.md`

_Source topic: github-actions-templates_

**Purpose:** Create production-ready GitHub Actions workflows for automated testing, building, and deploying applications. Use when setting up CI/CD with GitHub Actions, automating development workflows, or creating reusable workflow templates.

# GitHub Actions Templates

Production-ready GitHub Actions workflow patterns for testing, building, and deploying applications.

## Purpose

Create efficient, secure GitHub Actions workflows for continuous integration and deployment across various tech stacks.

## When to Use

- Automate testing and deployment
- Build Docker images and push to registries
- Deploy to Kubernetes clusters
- Run security scans
- Implement matrix builds for multiple environments

## Common Workflow Patterns

### Pattern 1: Test Workflow

```yaml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v4
...
```

**Reference:** See `assets/test-workflow.yml`
...

# .github/workflows/reusable-test.yml
name: Reusable Test Workflow

on:
  workflow_call:
    inputs:
      node-version:
        required: true

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm test
```

**Use reusable workflow:**

```yaml
```

## Security Scanning

```yaml

    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
          output: "trivy-results.sarif"

      - name: Upload Trivy results to GitHub Security

      - name: Run Snyk Security Scan
```

## Deployment with Approvals

```yaml
...


### From `full-guide.md`

_Source topic: gh-cli_

**Purpose:** GitHub CLI (gh) comprehensive reference for repositories, issues, pull requests, Actions, projects, releases, gists, codespaces, organizations, extensions, and all GitHub operations from the command line.

# GitHub CLI (gh)

Comprehensive reference for GitHub CLI (gh) - work seamlessly with GitHub from the command line.

**Version:** 2.85.0 (current as of January 2026)

## Prerequisites

### Installation

```bash

# Configure git to use gh as credential helper
gh auth setup-git

# Refresh authentication scopes
gh auth refresh --scopes write:org,read:public_key
```

## CLI Structure

```
gh                          # Root command
│   ├── mark-template
├── run                     # Workflow runs
├── workflow                # Workflows
├── alias                   # Command aliases
```

## Configuration

### Global Configuration

```bash

# Show token in output
gh auth status --show-token

# JSON output
gh auth status --json hosts

# Create with homepage
gh repo create my-repo --homepage https://example.com

# Initialize as template repository
gh repo create my-repo --template

# JSON output
gh repo list --json name,visibility,owner

# Table output
gh repo list --limit 100 | tail -n +2

# JSON output
gh repo view --json name,description,defaultBranchRef

# Set homepage
gh repo edit --homepage https://example.com

# Add autolink
gh repo autolink add \
  --key-prefix JIRA- \
  --url-template https://jira.example.com/browse/<num>

# View gitignore template
gh repo gitignore

# View license template
gh repo license mit

# Create with title and body
gh issue create \
  --title "Bug: Login not working" \
  --body "Steps to reproduce..."


### From `topic-map.md`

_Source topic: topic-map_

# GitHub Actions Topic Map

This reference is a compact routing aid derived from the source catalog. It is intentionally selective and deduplicated. Use it to find the right documentation neighborhood quickly, then verify against the live docs on `docs.github.com`.

## Getting Started

- Understanding GitHub Actions
- Quickstart for GitHub Actions
- Continuous integration
- Continuous deployment
- Workflow syntax for GitHub Actions
- Events that trigger workflows

## Workflow Authoring

- Workflows
- Variables
- Contexts
- Expressions
- Using jobs in a workflow
- Running variations of jobs in a workflow
- Passing information between jobs
- Reuse workflows
- Reusing workflow configurations

## Runners and Execution

- GitHub-hosted runners
- Using GitHub-hosted runners
- Choosing the runner for a job
- Running jobs in a container
- Self-hosted runners
- Larger runners
- Actions Runner Controller
- Get started with Actions Runner Controller

## Security and Supply Chain
...
