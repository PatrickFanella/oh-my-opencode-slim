# Gh Address Comments

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Extracted Resources

- `assets/gh-address-comments/`
- `scripts/gh-address-comments/`
- `assets/gh-address-comments/`

## Guidance

### From `gh-address-comments-skill.md`

_Source topic: gh-address-comments_

**Purpose:** Help address review/issue comments on the open GitHub PR for the current branch using gh CLI; verify gh auth first and prompt the user to authenticate if not logged in.

# PR Comment Handler

Guide to find the open PR for the current branch and address its comments with gh CLI. Run all `gh` commands with elevated network access.

Prereq: ensure `gh` is authenticated (for example, run `gh auth login` once), then run `gh auth status` with escalated permissions (include workflow/repo scopes) so `gh` commands succeed. If sandboxing blocks `gh auth status`, rerun it with `sandbox_permissions=require_escalated`.

## 1) Inspect comments needing attention
- Run scripts/fetch_comments.py which will print out all the comments and review threads on the PR

## 2) Ask the user for clarification
- Number all the review threads and comments and provide a short summary of what would be required to apply a fix for it
- Ask the user which numbered comments should be addressed

## 3) If user chooses comments
- Apply fixes for the selected comments

- If gh hits auth/rate issues mid-run, prompt the user to re-authenticate with `gh auth login`, then retry.

## Resources

- `scripts/`
  - `scripts/fetch_comments.py` — deterministic helper script or script support file.
- `assets/`
  - `assets/github-small.svg` — static asset used by the skill.
  - `assets/github.png` — static asset used by the skill.

Load these only when needed; keep `SKILL.md` as the activation workflow.
