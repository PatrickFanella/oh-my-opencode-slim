# Codemod Playbook

## Choose the edit mechanism

- **AST rewrite**: import/function/API shape changes.
- **Exact text edit**: docs, config keys, generated fixtures.
- **Manual edit**: mixed semantic changes, ambiguous references.

## Risk controls

- Keep a pre-edit search result so you know expected scope.
- Exclude vendored/generated directories unless intentionally updating them.
- Run the smallest relevant tests after each pass.
- If a rewrite requires judgment per match, stop treating it as mechanical.

## Completion criteria

- No unintended old-pattern matches remain.
- Generated indexes are refreshed.
- Tests cover at least one representative changed path.
- Docs mention user-visible name removals or aliases.
