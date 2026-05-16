# OMOC as an OpenCode Distribution Layer

OMOC can be the main OpenCode plugin/distribution layer when you want one
config-driven orchestration surface and do not need multiple harnesses.

## Ownership Model

OpenCode owns:

- Authentication and provider registry
- Model discovery/refresh and host schema validation
- Core runtime/session execution

OMOC owns:

- Plugin distribution/runtime composition
- Agent routing, presets, MCP defaults/permissions
- Tools, hooks, council/session orchestration, multiplexer integration
- Bundled custom skills and OMOC plugin configuration surface

External systems stay external:

- DCP
- Quota management
- Private user skills not curated into OMOC

## Boundary Findings (Task 1)

- OMOC ownership is composition/runtime orchestration, not host replacement.
- DCP is not a first-class OMOC namespace.
- Quota concerns appear only in runtime rate-limit/fallback handling,
  not as OMOC config domain.
- Env vars are primarily for paths/state/log plumbing. The existing
  `OH_MY_OPENCODE_SLIM_PRESET` override remains a runtime preset-selection
  escape hatch, but new behavior should stay config-owned.
- Ownership split by surface:
  - `src/config/loader.ts`: layered config loading + env path/preset inputs
  - `src/index.ts`: runtime composition root (agents/tools/hooks/MCP/session)
  - `src/cli/install.ts` + `src/cli/{skills,custom-skills}.ts`: installer,
    curated skill/bootstrap boundaries
  - `docs/*`: contract + migration guidance

## Migration Path

1. Keep OpenCode host config minimal (plugin registration + host settings).
2. Put OMOC behavior in `~/.config/opencode/oh-my-opencode-slim.jsonc`.
3. Inventory real workflow skills/MCP usage.
4. Bundle only core OMOC workflow skills in `src/skills/`.
5. Keep externally maintained skills as recommended or permission-only.
6. Keep DCP and quota concerns outside OMOC.
7. Validate with `bun run check:ci`, `bun run typecheck`, `bun test` before release.

## MCP Registry Merge

OMOC's built-in MCP registry is allowed to absorb shared `.agents` MCP entries
when the entry has a portable OpenCode representation. Remote MCPs can usually
be copied directly. Local MCPs must avoid user-specific absolute paths and
secrets; prefer stable commands such as `npx`, `docker`, `gh`, or `sp-mcp` and
document host prerequisites instead.

Merged entries currently include GitHub, Playwright, Chrome DevTools, Context7,
Microsoft Learn, Sentry, Stripe, Hugging Face, Super Productivity, Exa
websearch, and grep.app.

Host-dependent local MCPs and auth/product remotes remain opt-in through
`enabled_mcps`; merging the registry should not silently start local processes,
connect to product services, or broaden default agent permissions.

## Decision Rules

Bundle a skill when it is core to OMOC workflow and maintained in this repo.

Keep a skill external when it belongs to DCP/quota, depends on an external
runtime/release process, or is user-private/harness-agnostic.

## Future Skill Migration Prep

Skill migration is intentionally skipped for now. The repo is prepared by
keeping the packaging policy explicit:

- core OMOC workflow skills belong in `src/skills/` and the `CUSTOM_SKILLS`
  installer registry;
- externally maintained skills stay in the recommended-skill installer path;
- user-private, DCP, and quota skills stay outside OMOC or permission-only;
- any future migration should start with an inventory of real workflow usage,
  not a bulk copy of every `.agents` skill.
