---
name: changelog-automation
description: Automate changelog generation from commits, PRs, and releases following Keep a Changelog format. Use when setting up release workflows, generating release notes, or standardizing commit conventions.
---

# Changelog Automation

Automate changelog + release notes from commit history with predictable versioning and low manual editing.

## Purpose

Use this skill to enforce Conventional Commits, generate Keep a Changelog-compatible output, and run repeatable release workflows.

## When to Use This Skill

- Bootstrapping release notes automation in CI/CD
- Standardizing commit messages across team/repos
- Moving from manual version bumps/changelog edits to tool-driven release
- Generating GitHub/GitLab release notes from commit/PR history

## When Not to Use

- Tiny one-off repo where no formal releases are planned
- You need narrative product announcements (manual writing still needed)

## Workflow

1. **Pick automation level**
   - Manual assist: `standard-version` / `git-cliff`
   - Full CI automation: `semantic-release`
   - Python-heavy repo: `commitizen`
2. **Enforce commit format**
   - Adopt Conventional Commits (`feat`, `fix`, `perf`, etc.)
   - Add linting gate (`commitlint` or `cz check`)
3. **Map commit types to changelog sections**
   - `feat` → Added, `fix` → Fixed, `perf/refactor` → Changed
   - Hide noise types unless needed (`docs`, `style`, `test`, `chore`)
4. **Configure semantic version rules**
   - `feat!` / `BREAKING CHANGE` = MAJOR
   - `feat` = MINOR, `fix` = PATCH
5. **Implement release pipeline**
   - Local dry run
   - CI execution on main/release branches
   - Tag, changelog update, release artifact publication
6. **Template release notes**
   - Keep customer-facing sections concise
   - Include compare links + breaking changes + upgrade notes
7. **Continuously audit quality**
   - Fix ambiguous commit messages
   - Ensure tooling output stays readable and useful

## Output Checklist

- [ ] Commit format guard is active in local/CI workflow
- [ ] Version bump logic matches team policy
- [ ] Changelog sections map to meaningful user impact
- [ ] Release process supports dry-run and rollback path
- [ ] Generated notes include links/tags and upgrade guidance

## Resources

- Full guide: `references/full-guide.md`
