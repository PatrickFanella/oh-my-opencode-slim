# Blacktower Release Surface

## Package contents

- `package.json` file whitelist/scripts
- `src/skills/**` bundled static skills
- generated schemas and custom agent schemas
- CLI entrypoints
- docs required for install and migration

## Generated artifacts

- `blacktower.schema.json` from `scripts/generate-schema.ts`
- `src/skills/index.json` and `src/skills/index.md` from
  `scripts/generate_skill_index.py`

## Installer compatibility

Installer changes need tests for:

- fresh install
- upgrade preserving existing config
- non-interactive flags
- shell/profile edits
- dry-run output

## Release validation command set

Prefer the full set before publishing or after package/install changes:

```bash
bun run check:ci
bun run typecheck
bun test
bun run build
```
