# To Issues

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `to-issues-skill.md`

_Source topic: to-issues_

**Purpose:** Break a plan, spec, or PRD into independently-grabbable issues on the project issue tracker using tracer-bullet vertical slices. Use when user wants to convert a plan into issues, create implementation tickets, or break down work into issues.

# To Issues

Break a plan into independently-grabbable issues using vertical slices (tracer bullets).

The issue tracker and triage label vocabulary should have been provided to you — run `/setup-matt-pocock-skills` if not.

## Process

### 1. Gather context

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so to understand the current state of the code. Issue titles and descriptions should use the project's domain glossary vocabulary, and respect ADRs in the area you're touching.

### 3. Draft vertical slices

Slices may be 'HITL' or 'AFK'. HITL slices require human interaction, such as an architectural decision or a design review. AFK slices can be implemented and merged without human interaction. Prefer AFK over HITL where possible.

- Each slice delivers a narrow but COMPLETE path through every layer (schema, API, UI, tests)
- A completed slice is demoable or verifiable on its own
- Prefer many thin slices over few thick ones

### 4. Quiz the user

- **Title**: short descriptive name
- **Type**: HITL / AFK
- **Blocked by**: which other slices (if any) must complete first
- **User stories covered**: which user stories this addresses (if the source material has them)

- Does the granularity feel right? (too coarse / too fine)
- Are the dependency relationships correct?
- Should any slices be merged or split further?
- Are the correct slices marked as HITL and AFK?

### 5. Publish the issues to the issue tracker

For each approved slice, publish a new issue to the issue tracker. Use the issue body template below. These issues are considered ready for AFK agents, so publish them with the correct triage label unless instructed otherwise.
...


### From `github-issue-planner-skill.md`

_Source topic: github-issue-planner_

**Purpose:** Convert a single product or feature idea into a complete, dependency-aware implementation plan expressed as GitHub issues.

# Skill: GitHub Issue Planner (MCP-first)

## 1) Skill contract

**Name:** `github-issue-planner`
**Purpose:** Convert a single product/feature idea into a complete, step-by-step implementation plan **expressed entirely as GitHub issues**, including:

* Epic issues for major areas
* Many small, autonomous sub-issues (tests + acceptance criteria required)
* Dependency-aware **chronological phases**
* A final **Master Roadmap** issue listing *every* issue by phase (not grouped under epics)

**Primary output mode (preferred):** Create real GitHub issues via MCP GitHub server tools.
**Fallback output mode:** Produce a “dry-run” issue pack (Markdown) that can be imported/created manually.

### Inputs

* `idea` (string): The concept to build (can be short or long).

Optional (strongly recommended when creating issues):

* `repo` (string): `owner/name`
* `default_branch` (string)
* `stack` (string): languages/frameworks
* `constraints` (string[]): e.g., “must be OSS”, “self-hosted”, “no paid APIs”
* `non_goals` (string[]): explicit out-of-scope items
* `quality_bar` (enum): `prototype | mvp | production` (default: `production`)
* `target_env` (string): dev/staging/prod, hosting notes
* `test_policy` (string): e.g., “unit + integration required; e2e for critical flows”
* `security_policy` (string): auth, secrets, threat model expectations
* `max_issue_size_hours` (number): default `6` (keep issues small)

### Outputs

* If MCP GitHub tools exist: creates issues, labels, milestones (phases), then creates **Master Roadmap** issue with links.
* If MCP tools not available: returns a structured Markdown document containing:
...


### From `github-issues-skill.md`

_Source topic: github-issues_

**Purpose:** Create, update, and manage GitHub issues using MCP tools. Use this skill when users want to create bug reports, feature requests, or task issues, update existing issues, add labels/assignees/milestones, or manage issue workflows. Triggers on requests like "create an issue", "file a bug", "request a feature", "update issue X", or any GitHub issue management task.

# GitHub Issues

Manage GitHub issues using the `@modelcontextprotocol/server-github` MCP server.

## Available MCP Tools

| Tool | Purpose |
|------|---------|
| `mcp__github__create_issue` | Create new issues |
| `mcp__github__update_issue` | Update existing issues |
| `mcp__github__get_issue` | Fetch issue details |
| `mcp__github__search_issues` | Search issues |
| `mcp__github__add_issue_comment` | Add comments |
| `mcp__github__list_issues` | List repository issues |

## Workflow

1. **Determine action**: Create, update, or query?
2. **Gather context**: Get repo info, existing labels, milestones if needed
3. **Structure content**: Use appropriate template from references/templates.md
4. **Execute**: Call the appropriate MCP tool
5. **Confirm**: Report the issue URL to user

## Creating Issues

### Required Parameters

```
owner: repository owner (org or user)
repo: repository name
title: clear, actionable title
body: structured markdown content
```

### Optional Parameters

```
labels: ["bug", "enhancement", "documentation", ...]
assignees: ["username1", "username2"]
milestone: milestone number (integer)
```

### Title Guidelines
...


### From `prd-to-issues-skill.md`

_Source topic: prd-to-issues_

**Purpose:** Break a PRD into independently-grabbable GitHub issues using tracer-bullet vertical slices. Use when user wants to convert a PRD to issues, create implementation tickets, or break down a PRD into work items.

# PRD to Issues

Break a PRD into independently-grabbable GitHub issues using vertical slices (tracer bullets).

## Process

### 1. Locate the PRD

### 2. Explore the codebase (optional)

### 3. Draft vertical slices

Slices may be 'HITL' or 'AFK'. HITL slices require human interaction, such as an architectural decision or a design review. AFK slices can be implemented and merged without human interaction. Prefer AFK over HITL where possible.

- Each slice delivers a narrow but COMPLETE path through every layer (schema, API, UI, tests)
- A completed slice is demoable or verifiable on its own
- Prefer many thin slices over few thick ones

### 4. Quiz the user

- **Title**: short descriptive name
- **Type**: HITL / AFK
- **Blocked by**: which other slices (if any) must complete first
- **User stories covered**: which user stories from the PRD this addresses

- Does the granularity feel right? (too coarse / too fine)
- Are the dependency relationships correct?
- Should any slices be merged or split further?
- Are the correct slices marked as HITL and AFK?

### 5. Create the GitHub issues

For each approved slice, create a GitHub issue using `gh issue create`. Use the issue body template below.

<issue-template>
## Parent PRD
...


### From `MERGED.md`

_Source topic: MERGED_

# Merged skill: prd-to-issues
Source path: `skills/dev-workflows/prd-to-issues`
Canonical skill: `skills/git-github/to-issues`

### From `templates.md`

_Source topic: templates_

# Issue Templates

Copy and customize these templates for issue bodies.

## Bug Report Template

```markdown
## Description
[Clear description of the bug]

## Steps to Reproduce
1. [First step]
2. [Second step]
3. [And so on...]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Environment
- Browser: [e.g., Chrome 120]
- OS: [e.g., macOS 14.0]
- Version: [e.g., v1.2.3]
...
```

## Feature Request Template

```markdown
## Summary
[One-line description of the feature]

## Motivation
[Why is this feature needed? What problem does it solve?]

## Proposed Solution
[How should this feature work?]

## Acceptance Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

## Alternatives Considered
[Other approaches considered and why they weren't chosen]

## Additional Context
...
```

## Task Template
...
