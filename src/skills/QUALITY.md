# Skill Quality Rubric

Use this checklist before merging skill changes.

## Required for all skills

- Folder name uses `kebab-case`.
- `SKILL.md` frontmatter `name` matches folder name.
- Description clearly states when to use and when not to use.
- Triggers are concrete and non-overlapping with nearby skills.
- References are linked and paths are valid.

## Portability

- Avoid hardcoded agent-specific absolute paths.
- Prefer `"${AGENT_SKILLS_HOME:-~/.claude/skills}"` for script examples.
- Commands should work on standard Linux/macOS shells unless documented otherwise.

## Security

- No embedded secrets, tokens, or private endpoints without warnings.
- Network/file-system scripts document trust boundaries and side effects.
- High-risk operations require an explicit confirmation checkpoint.

## Maintainability

- Add cross-references for related/overlapping skills.
- Keep aliases minimal and clearly marked deprecated.
- Keep examples concise and executable.

## Validation

- Run `bash scripts/validate-hub.sh`.
- Refresh generated inventory with `python3 scripts/generate_skill_index.py` when skills change.
- Run `python3 scripts/hub_doctor.py` after moving local configs or reinstalling agent CLIs.
- Verify links and referenced files exist.
- Update docs (`README.md`, `CATALOG.md`, `AUDIT.md`) when behavior changes.
