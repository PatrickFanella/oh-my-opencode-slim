# Make Repo Contribution

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Extracted Resources

- `assets/make-repo-contribution/`

## Guidance

### From `make-repo-contribution-skill.md`

_Source topic: make-repo-contribution_

**Purpose:** All changes to code must follow the guidance documented in the repository. Before any issue is filed, branch is made, commits generated, or pull request (or PR) created, a search must be done to ensure the right steps are followed. Whenever asked to create an issue, commit messages, to push code, or create a PR, use this skill so everything is done correctly.

# Contribution guidelines

Most every project has a set of contribution guidelines everyone needs to follow when creating issues, pull requests (PR), or otherwise contributing code. These may include, but are not limited to:

- Creating an issue before creating a PR, or creating the two in conjunction
- Templates for issues or PRs that must be used depending on the change request being made
- Guidelines on what needs to be documented in those issues and PRs
- Tests, linters, and other prerequisites that need to be run before pushing any changes

Always remember, you are a guest in someone else's repository. As such, you need to follow the rules and guidelines set forth by the repository owner when contributing code.

## Using existing guidelines

Before creating a PR or any of the steps leading up to it, explore the project to determine if there's any guidance. Places to explore include, but are not limited to:

- README.md
- CONTRIBUTING.md
- Project documentation
- Issue templates
- Pull request or PR templates

## No guidelines found

If no guidance is found, or doesn't provide guidance on certain topics, then use the following as a foundation for creating a quality contribution. **ALWAYS** defer to the guidance provided in the repository.

## Tasks

Many repository owners will have guidance on prerequisite steps which need to be completed before a PR is to be created. This can include, but is not limited to:

- building the project or generating assets
- running linters and ensuring any issues are resolved
- naming guidelines and other patterns
- unit tests, end to end tests, or other tests which need to be created and pass
  - related, there may be required coverage percentages

## Issue
...


### From `yeet-skill.md`

_Source topic: yeet_

**Purpose:** Use only when the user explicitly asks to stage, commit, push, and open a GitHub pull request in one flow using the GitHub CLI (`gh`).

## Naming conventions

- Branch: `codex/{description}` when starting from main/master/default.
- Commit: `{description}` (terse).
- PR title: `[codex] {description}` summarizing the full diff.

## Workflow

- If on main/master/default, create a branch: `git checkout -b "codex/{description}"`
- Otherwise stay on the current branch.
- Confirm status, then stage everything: `git status -sb` then `git add -A`.
- Commit tersely with the description: `git commit -m "{description}"`
- Run checks if not already. If checks fail due to missing deps/tools, install dependencies and rerun once.
- Push with tracking: `git push -u origin $(git branch --show-current)`
- If git push fails due to workflow auth errors, pull from master and retry the push.
- Open a PR and edit title/body to reflect the description and the deltas: `GH_PROMPT_DISABLED=1 GIT_TERMINAL_PROMPT=0 gh pr create --draft --fill --head $(git branch --show-current)`
- Write the PR description to a temp file with real newlines (e.g. pr-body.md ... EOF) and run pr-body.md to avoid \\n-escaped markdown.
- PR description (markdown) must be detailed prose covering the issue, the cause and effect on users, the root cause, the fix, and any tests or checks used to validate.


### From `issue-template.md`

_Source topic: issue-template_

# <!-- Provide a concise, descriptive title for the issue -->

## Summary

<!-- Provide a clear, one-sentence description of the request or issue. -->

## Context

- The problem being solved
- Any relevant background information
- Link to related issues or discussions if applicable

## Proposed Solution

- Specific changes to be made
- Files or areas affected
- Any alternatives considered

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Additional Information

- Error messages or logs
- Steps to reproduce (for bugs)
- Dependencies or blockers
- Impact assessment


### From `pr-template.md`

_Source topic: pr-template_

# <!-- Provide a concise, descriptive title for the pull request -->

## Summary

<!-- Provide a three to four sentence description of what this PR accomplishes. -->

## Background

- The problem being solved or feature being added
- Link to related issues (use "Closes #123" to auto-close)
- Any relevant context or discussions

## Changes

- Files added, modified, or deleted
- Key code changes with brief explanations
- Any architectural or design decisions made

## Testing

- Commands run (e.g., `npm run build`, `npm run validate`)
- Manual testing performed
- Edge cases considered

## Additional Notes

- Breaking changes or migration steps
- Highlights for human reviewers
