# Changelog Automation Full Guide

Detailed material moved from `SKILL.md`.

## Core Concepts

### Keep a Changelog baseline

Structure releases with:

- `## [Unreleased]`
- Version sections by date
- Subsections: Added / Changed / Deprecated / Removed / Fixed / Security
- Compare links between tags

### Conventional Commits contract

Pattern:

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Common mapping:

- `feat` → Added
- `fix` → Fixed
- `perf`, `refactor` → Changed
- `revert` → Removed/Reverted
- `docs/style/test/chore/ci/build` usually hidden

### Semantic Versioning policy

- MAJOR: `feat!` or `BREAKING CHANGE`
- MINOR: `feat`
- PATCH: `fix` (+ optionally perf/refactor)

## Implementation Patterns

## 1) Node-based setup (`commitlint` + `standard-version`)

Install:

```bash
npm install -D @commitlint/cli @commitlint/config-conventional
npm install -D husky standard-version
```

Minimal `commitlint.config.js`:

```js
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [2, "always", [
      "feat","fix","docs","style","refactor","perf","test","chore","ci","build","revert"
    ]],
    "subject-max-length": [2, "always", 72]
  }
};
```

Hook:

```bash
npx husky init
echo "npx --no -- commitlint --edit \$1" > .husky/commit-msg
```

Release scripts example:

```json
{
  "scripts": {
    "release": "standard-version",
    "release:minor": "standard-version --release-as minor",
    "release:major": "standard-version --release-as major",
    "release:patch": "standard-version --release-as patch",
    "release:dry": "standard-version --dry-run"
  }
}
```

## 2) Full CI automation (`semantic-release`)

Use when you want push-to-main => automated version/tag/changelog/release.

Typical plugins:

- `@semantic-release/commit-analyzer`
- `@semantic-release/release-notes-generator`
- `@semantic-release/changelog`
- `@semantic-release/github`
- `@semantic-release/git`
- `@semantic-release/npm` (if publishing packages)

GitHub Actions baseline:

- checkout with full history (`fetch-depth: 0`)
- install deps
- run `npx semantic-release`
- pass `GITHUB_TOKEN` (+ registry tokens if needed)

## 3) Fast changelog generation (`git-cliff`)

`git-cliff` is good for large repos and custom grouping templates.

Core config ideas:

- enable `conventional_commits = true`
- parse commit groups by regex (`^feat`, `^fix`, etc.)
- skip `chore(release)` commits
- generate compare links in footer

Commands:

```bash
git cliff -o CHANGELOG.md
git cliff v1.0.0..v2.0.0 -o RELEASE_NOTES.md
git cliff --unreleased --dry-run
```

## 4) Python-oriented flow (`commitizen`)

`pyproject.toml` essentials:

```toml
[tool.commitizen]
name = "cz_conventional_commits"
version = "1.0.0"
tag_format = "v$version"
update_changelog_on_bump = true

[tool.commitizen.customize]
schema = "<type>(<scope>): <subject>"
schema_pattern = "^(feat|fix|docs|style|refactor|perf|test|chore)(\\(\\w+\\))?:\\s.*"
```

Commands:

```bash
pip install commitizen
cz commit
cz check --rev-range HEAD~5..HEAD
cz bump --changelog
```

## Release Notes Templates

Keep both forms:

1. **Auto-generated technical notes** (PR/commit driven)
2. **Internal narrative notes** (summary, highlights, known issues, upgrade notes)

Recommended sections:

- Summary
- Highlights
- Breaking Changes
- Upgrade Guide
- Known Issues
- Dependency Updates
- Full compare link

## Commit Message Guidance

Good patterns:

- `feat(auth): add OAuth2 support for Google login`
- `fix(checkout): resolve race condition in payment processing`
- `feat(api)!: change user endpoint response format`

For breaking changes, include footer:

```text
BREAKING CHANGE: <impact + migration guidance>
```

## Best Practices

Do:

- enforce format in CI and local hooks
- keep scopes consistent
- link commits to issues/PRs
- run dry-run before first live release

Avoid:

- manual changelog edits that diverge from tool output
- mixed-purpose commits
- unmarked breaking changes
- releasing without validation checks
