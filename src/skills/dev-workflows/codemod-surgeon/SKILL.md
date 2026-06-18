---
name: codemod-surgeon
description: Plan and execute safe repo-wide mechanical refactors, API migrations, subsystem removals, renames, generated-index moves, and AST-grep/codemod rewrites. Use when many files must change consistently with low semantic ambiguity.
---

# Codemod Surgeon

Use this skill for broad mechanical edits where consistency matters more than
local cleverness.

## Procedure

1. **Define the invariant**
   - What exact old pattern must disappear?
   - What exact new pattern replaces it?
   - Which files are excluded?

2. **Inventory before editing**
   - Search by filename and content.
   - Use AST-aware tools where syntax matters.
   - Save a migration plan using `templates/migration-plan.md` for risky edits.

3. **Edit in narrow passes**
   - Prefer one transformation per commit.
   - Regenerate indexes after moving generated/catalog content.
   - Do not mix behavior changes with mechanical rewrites unless approved.

4. **Prove completion**
   - Search for old names/patterns.
   - Run formatting/lint/typecheck/tests.
   - Document intentional leftovers.

Read `references/codemod-playbook.md` for AST/rewrite strategy. Use
`scripts/find_leftovers.py <pattern> <paths...>` to print remaining literal
matches after a migration.
