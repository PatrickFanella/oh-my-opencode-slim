# Skills Catalog Policy

This file defines lightweight standards for organizing skills in this folder.

## Naming

- Use `kebab-case` for category and skill folder names.
- SKILL frontmatter `name` should match folder name exactly.
- Avoid creating second aliases for the same capability unless needed for backward compatibility.

## Filesystem Categories

- Use `skills/<category>/<skill-name>/` for normal skills.
- Keep categories descriptive and coarse enough to browse, but split bins once they become dumping grounds.
- Use lowercase kebab-case names such as `growth-marketing`, `writing-craft`, `cloud-infra`, and `frontend-ui`.
- Keep `.system/` reserved for native runtime skills that should not be indexed in normal profiles.
- Nested sub-skills are allowed when they are part of a parent suite, for example `microsoft-foundry/models/deploy-model/`.

## Canonical vs Alias Skills

- Prefer one canonical skill per capability.
- Prefer deletion or demotion over active compatibility aliases.
- If an alias is truly needed, mark it as deprecated and point to the canonical skill in frontmatter and body.
- Keep alias SKILL.md files minimal to avoid duplicate maintenance, and remove them once workflows have migrated.

## Active Skills vs References

- Keep active `SKILL.md` files short: trigger, routing, core workflow, and resource map only.
- Move detailed frameworks, examples, edge cases, and old skill bodies into `references/`.
- Break down old merged skills into references and other folders as necessary.
- Rename archived `SKILL.md` files when moving them under references so recursive indexing does not treat them as active skills.
- Use `scripts/` for deterministic commands and reusable data retrieval/generation helpers.
- Use `templates/` for reusable output/input skeletons.
- Use `assets/` for static datasets and binary files.

## Prefix Guidance

> I'm torn on if we should be strict about this.

- `workflow-*`: end-to-end multi-step orchestration.
- `review-*`: analysis and quality checks.
- `tool-*`: focused utility wrappers.
- `gh-*` / `git-*`: GitHub CLI and git operations.
- `security-*`: security analysis and threat modeling.
- `skill-*`: meta-skills for creating, improving, and evolving other skills.
- `subcult-*`: SUBCULT collective branding, design, and worldbuilding suite.
- Domain names without prefix (for example `supabase`, `stripe`, `cloudflare`) should be canonical when they support multiple execution backends.

## Tool and Plugin Boundaries

- Keep tool-backed skills active only when they teach when/how to use the tool.
- Prefer plugins, hooks, MCP tools, or slash commands for repeated operational flows with strict input/output contracts.
- Skills that require optional local CLIs or API keys must include preflight guidance and fallback behavior.
- Do not duplicate provider-specific wrappers when a generic installed tool is enough.

## Deprecation Practice

- Prefer removing deprecated skills during catalog overhaul when no current workflow requires the old trigger.
- If a deprecated skill remains loadable for compatibility, mark it clearly as deprecated.
- Include the canonical replacement in the first lines of the body.
- Plan removal only after usage confirms no active dependency on the deprecated alias.
