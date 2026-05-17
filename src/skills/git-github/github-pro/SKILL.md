---
name: github-pro
description: GitHub workflow skill for this hub's plugin-first GitHub integration. Use for PRs, issues, review comments, CI checks, branch context, commits, release notes, and repo contribution workflow. Prefer local `github-tools` plugin tools over GitHub MCP in OpenCode.
---

# GitHub Pro

Single GitHub workflow skill. Runtime actions should use the `github-tools` OpenCode plugin tools where available; use `gh` CLI only as fallback or when a workflow specifically requires it.

## Use When

- Inspecting PR context, changed files, CI status, or review comments.
- Creating/updating/commenting issues.
- Reviewing or commenting on PRs.
- Fixing GitHub Actions failures.
- Preparing commits or repo contribution workflow.
- Turning plans into GitHub issues/PRDs.

## Integration Stance

- **Primary runtime:** `plugins/github-tools/`.
- **Fallback:** `gh` CLI with non-interactive flags.
- **Not preferred in OpenCode:** GitHub MCP, to avoid duplicate GitHub surfaces.

## Workflow

1. Check repo/auth context with plugin status/doctor tools.
2. Inspect branch, diff, files, PR context, and CI before acting.
3. Stage or modify only intended files.
4. Use concise Conventional Commit messages when committing is explicitly requested.
5. For PR/issue actions, return URLs and summarize changes.
6. Never force-push, amend, or publish destructive actions unless explicitly requested.

## Resources

### Curated references

Former merged-skill dumps were distilled into these lookup files:

- `references/curated/gh-address-comments.md` — Gh Address Comments guidance.
- `references/curated/gh-cli.md` — Gh Cli guidance.
- `references/curated/gh-fix-ci.md` — Gh Fix Ci guidance.
- `references/curated/git-commit.md` — Git Commit guidance.
- `references/curated/make-repo-contribution.md` — Make Repo Contribution guidance.
- `references/curated/to-issues.md` — To Issues guidance.
- `references/curated/to-prd.md` — To Prd guidance.


### Extracted resource directories

- `references/` — curated resources extracted from prior merged skill material.
- `scripts/` — curated resources extracted from prior merged skill material.
- `assets/` — curated resources extracted from prior merged skill material.
